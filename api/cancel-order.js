import { getAdminDb, admin } from './_lib/firebaseAdmin.js';
import { getVerifiedUser } from './_lib/verifyUser.js';
import Razorpay from 'razorpay';

// Cancelling restores stock, which means writing to store_books — something
// only admins may do directly (see firestore.rules). So cancellation has to
// happen here, server-side, rather than in a client-side transaction.
const CANCELLABLE_BY_CUSTOMER = ['confirmed'];

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { internalOrderId } = req.body || {};
  if (!internalOrderId || typeof internalOrderId !== 'string') {
    return res.status(400).json({ error: 'Missing order reference.' });
  }

  let db;
  try {
    db = getAdminDb();
  } catch (err) {
    console.error(err.message);
    return res.status(503).json({ error: 'Server is not fully configured yet.' });
  }

  const user = await getVerifiedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Please sign in to cancel an order.' });
  }

  const orderRef = db.collection('orders').doc(internalOrderId);
  const orderSnap = await orderRef.get();
  if (!orderSnap.exists) {
    return res.status(404).json({ error: 'Order not found.' });
  }
  const order = orderSnap.data();

  // Authorization: the order's own owner, or an admin.
  const userDoc = await db.collection('users').doc(user.uid).get();
  const isAdmin = userDoc.exists && userDoc.data()?.role === 'admin';
  const isOwner = order.uid === user.uid;
  if (!isAdmin && !isOwner) {
    return res.status(403).json({ error: 'You cannot cancel this order.' });
  }

  if (order.status === 'cancelled') {
    return res.status(200).json({ cancelled: true }); // idempotent
  }
  if (!isAdmin && !CANCELLABLE_BY_CUSTOMER.includes(order.status)) {
    return res.status(409).json({ error: 'This order can no longer be cancelled. Please contact the store.' });
  }

  // Restore stock + mark cancelled, atomically.
  const bookRefs = (order.items || []).map((i) => db.collection('store_books').doc(i.id));
  try {
    await db.runTransaction(async (tx) => {
      const snaps = await Promise.all(bookRefs.map((ref) => tx.get(ref)));
      snaps.forEach((snap, idx) => {
        if (!snap.exists) return; // book since deleted — nothing to restore
        const currentStock = snap.data().stockQuantity ?? 0;
        tx.update(bookRefs[idx], { stockQuantity: currentStock + (order.items[idx].quantity || 0) });
      });
      tx.update(orderRef, { status: 'cancelled', cancelledAt: admin.firestore.FieldValue.serverTimestamp() });
    });
  } catch (err) {
    console.error('Cancellation transaction failed:', err);
    return res.status(500).json({ error: 'Could not cancel the order. Please try again.' });
  }

  // If it was already paid online, refund it automatically.
  if (order.paymentStatus === 'paid' && order.razorpayPaymentId && process.env.RAZORPAY_KEY_SECRET) {
    try {
      const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
      const refund = await razorpay.payments.refund(order.razorpayPaymentId, {
        amount: Math.round(order.total * 100),
        notes: { reason: 'Order cancelled', orderId: order.orderId },
      });
      await orderRef.update({ paymentStatus: 'refunded', refundId: refund.id, refundStatus: refund.status });
      return res.status(200).json({ cancelled: true, refunded: true });
    } catch (refundErr) {
      console.error('Refund on cancellation failed:', refundErr);
      await orderRef.update({ paymentStatus: 'paid_refund_failed' });
      return res.status(200).json({
        cancelled: true,
        refunded: false,
        warning: 'Order cancelled, but the automatic refund failed. Our team will refund you manually.',
      });
    }
  }

  return res.status(200).json({ cancelled: true });
}
