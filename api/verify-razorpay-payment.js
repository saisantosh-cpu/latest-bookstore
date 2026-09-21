import crypto from 'crypto';
import Razorpay from 'razorpay';
import { getAdminDb, admin } from './_lib/firebaseAdmin.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, internalOrderId } = req.body || {};
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !internalOrderId) {
    return res.status(400).json({ error: 'Missing payment details.' });
  }
  if (!process.env.RAZORPAY_KEY_SECRET || !process.env.RAZORPAY_KEY_ID) {
    return res.status(500).json({ error: 'Razorpay is not configured on the server.' });
  }

  let db, orderRef, orderSnap, order;
  try {
    db = getAdminDb();
    orderRef = db.collection('orders').doc(internalOrderId);
    orderSnap = await orderRef.get();
  } catch (err) {
    console.error(err.message);
    return res.status(503).json({ error: 'Server is not fully configured yet. See README.md.' });
  }
  if (!orderSnap.exists) {
    return res.status(404).json({ error: 'Order not found.' });
  }
  order = orderSnap.data();

  // Already finalized (e.g. a duplicate verify call) — return success idempotently.
  if (order.status === 'confirmed') {
    return res.status(200).json({ verified: true });
  }

  // 1. The Razorpay order id returned by the client MUST match the one WE
  // created and stored for this internal order — otherwise someone could
  // try to pay a different (e.g. smaller) order and apply it here instead.
  if (order.razorpayOrderId !== razorpay_order_id) {
    return res.status(400).json({ verified: false, error: 'This payment does not match this order.' });
  }

  // 2. Verify the HMAC signature Razorpay generated.
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');
  if (expectedSignature !== razorpay_signature) {
    return res.status(400).json({ verified: false, error: 'Payment signature could not be verified.' });
  }

  // 3. Independently ask Razorpay for the payment itself — never trust the
  // browser's claim that payment succeeded. Confirms amount, currency, and
  // status directly from Razorpay's servers.
  const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
  let payment;
  try {
    payment = await razorpay.payments.fetch(razorpay_payment_id);
  } catch (err) {
    console.error('Failed to fetch payment from Razorpay:', err);
    return res.status(502).json({ verified: false, error: 'Could not confirm payment with Razorpay.' });
  }

  const expectedPaise = Math.round(order.total * 100);
  if (
    payment.order_id !== razorpay_order_id ||
    payment.amount !== expectedPaise ||
    payment.currency !== 'INR' ||
    !['captured', 'authorized'].includes(payment.status)
  ) {
    return res.status(400).json({ verified: false, error: 'Payment details do not match this order.' });
  }

  // 4. Finalize: strict stock re-check + decrement, coupon usage increment,
  // mark the order confirmed — all atomically, in ONE transaction, so a
  // crash mid-way can never leave stock/coupon usage out of sync with the
  // order's confirmed status.
  const bookRefs = order.items.map((i) => db.collection('store_books').doc(i.id));
  const identityKey = order.uid || order.shippingEmail;
  const couponRef = order.couponCode ? db.collection('coupons').doc(order.couponCode) : null;
  const redemptionRef = couponRef ? couponRef.collection('redemptions').doc(identityKey) : null;

  try {
    await db.runTransaction(async (tx) => {
      const freshSnaps = await Promise.all(bookRefs.map((ref) => tx.get(ref)));
      const redemptionSnap = redemptionRef ? await tx.get(redemptionRef) : null;

      freshSnaps.forEach((snap, idx) => {
        const qty = order.items[idx].quantity;
        if (!snap.exists || (snap.data().stockQuantity ?? 0) < qty) {
          throw new Error(`STOCK_CONFLICT:${order.items[idx].title}`);
        }
      });
      freshSnaps.forEach((snap, idx) => {
        tx.update(bookRefs[idx], { stockQuantity: snap.data().stockQuantity - order.items[idx].quantity });
      });
      tx.update(orderRef, {
        status: 'confirmed',
        paymentStatus: 'paid',
        razorpayPaymentId: razorpay_payment_id,
      });
      if (order.couponCode) {
        const prevCount = redemptionSnap.exists ? redemptionSnap.data().count || 0 : 0;
        tx.set(redemptionRef, { count: prevCount + 1, lastUsedAt: admin.firestore.FieldValue.serverTimestamp() });
        tx.update(couponRef, { usageCount: admin.firestore.FieldValue.increment(1) });
      }
    });
  } catch (err) {
    if (String(err.message).startsWith('STOCK_CONFLICT')) {
      // Payment already succeeded but stock ran out in the meantime (the
      // race between two people buying the last copy). Never leave a
      // customer having paid for nothing — issue an automatic refund via
      // Razorpay and record exactly what happened. If the refund API call
      // itself fails, fall back to flagging it for manual admin action
      // rather than losing track of the payment.
      const conflictedTitle = err.message.split(':')[1];
      try {
        const refund = await razorpay.payments.refund(razorpay_payment_id, {
          amount: expectedPaise,
          notes: { reason: `Out of stock: ${conflictedTitle}`, orderId: order.orderId },
        });
        await orderRef.update({
          status: 'cancelled',
          paymentStatus: 'refunded',
          refundId: refund.id,
          refundStatus: refund.status,
          cancelReason: `Out of stock: ${conflictedTitle}`,
        });
        return res.status(409).json({
          verified: true,
          refunded: true,
          error: `"${conflictedTitle}" sold out at the exact moment you paid — you have NOT been charged; a full refund of ₹${order.total} has been issued automatically.`,
        });
      } catch (refundErr) {
        console.error('Automatic refund failed:', refundErr);
        await orderRef.update({ status: 'stock_conflict_needs_refund', paymentStatus: 'paid_refund_failed' });
        return res.status(409).json({
          verified: true,
          refunded: false,
          error: `Payment succeeded, but "${conflictedTitle}" sold out in the meantime and the automatic refund failed. Our team will manually refund you shortly — keep order ${order.orderId} for reference.`,
        });
      }
    }
    console.error('Order finalization transaction failed:', err);
    return res.status(500).json({ verified: false, error: 'Could not finalize your order. Please contact support.' });
  }

  return res.status(200).json({ verified: true });
}
