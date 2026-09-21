import { getAdminDb, admin } from './_lib/firebaseAdmin.js';
import { getVerifiedUser } from './_lib/verifyUser.js';
import Razorpay from 'razorpay';

const TAX_RATE = 0.08;
const MAX_QTY_PER_ITEM = 20;

const isProduction = () => process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let db;
  try {
    db = getAdminDb();
  } catch (err) {
    console.error(err.message);
    return res.status(503).json({ error: 'Checkout is not fully set up yet on the server. See README.md (Firebase Admin SDK setup).' });
  }

  const user = await getVerifiedUser(req); // null for guest checkout — that's allowed
  const { items, couponCode, shippingInfo, paymentMethod, idempotencyKey } = req.body || {};

  // --- Basic input validation (never trust shape/types from the client) ---
  if (!idempotencyKey || typeof idempotencyKey !== 'string') {
    return res.status(400).json({ error: 'Missing request identifier.' });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Your cart is empty.' });
  }
  for (const item of items) {
    if (!item?.bookId || typeof item.bookId !== 'string') {
      return res.status(400).json({ error: 'Invalid item in cart.' });
    }
    if (!Number.isInteger(item.quantity) || item.quantity <= 0 || item.quantity > MAX_QTY_PER_ITEM) {
      return res.status(400).json({ error: 'Invalid quantity in cart.' });
    }
    if (item.selectedSize !== undefined && item.selectedSize !== null && typeof item.selectedSize !== 'string') {
      return res.status(400).json({ error: 'Invalid size in cart.' });
    }
  }
  const requiredShipping = ['name', 'email', 'phone', 'address', 'city', 'zip'];
  for (const field of requiredShipping) {
    if (!shippingInfo?.[field] || typeof shippingInfo[field] !== 'string' || !shippingInfo[field].trim()) {
      return res.status(400).json({ error: `Missing ${field} in shipping details.` });
    }
  }
  if (!/^\d{6}$/.test(shippingInfo.zip.trim())) {
    return res.status(400).json({ error: 'PIN code must be exactly 6 digits.' });
  }
  if (!['razorpay', 'cod'].includes(paymentMethod)) {
    return res.status(400).json({ error: 'Invalid payment method.' });
  }

  // --- Idempotency: a duplicate submit (double-click, refresh, retry)
  // returns the SAME order instead of creating a second one. ---
  const existing = await db.collection('orders').where('idempotencyKey', '==', idempotencyKey).limit(1).get();
  if (!existing.empty) {
    const doc = existing.docs[0];
    const data = doc.data();
    return res.status(200).json({
      internalOrderId: doc.id,
      orderId: data.orderId,
      status: data.status,
      total: data.total,
      razorpayOrderId: data.razorpayOrderId || null,
      razorpayKeyId: process.env.VITE_RAZORPAY_KEY_ID || null,
    });
  }

  // --- Fetch real book data server-side. Client-supplied price/title are
  // never trusted — only bookId and quantity are used from the request. ---
  const bookRefs = items.map((i) => db.collection('store_books').doc(i.bookId));
  const bookSnaps = await db.getAll(...bookRefs);

  const orderItems = [];
  for (let i = 0; i < bookSnaps.length; i++) {
    const snap = bookSnaps[i];
    if (!snap.exists) {
      return res.status(409).json({ error: `An item in your cart is no longer available. Please remove it and try again.` });
    }
    const book = snap.data();
    const qty = items[i].quantity;
    if ((book.stockQuantity ?? 0) < qty) {
      return res.status(409).json({
        error: `"${book.title}" only has ${book.stockQuantity ?? 0} left in stock.`,
      });
    }
    orderItems.push({ id: snap.id, title: book.title, price: book.price, quantity: qty, selectedSize: items[i].selectedSize || null });
  }

  const subtotal = orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

  // --- Server-side coupon validation. The client may show a preview
  // discount for UX, but this is the only calculation that counts. ---
  let discountAmount = 0;
  let appliedCouponCode = null;
  const identityKey = user?.uid || shippingInfo.email.toLowerCase();

  if (couponCode && typeof couponCode === 'string') {
    const code = couponCode.trim().toUpperCase();
    const couponSnap = await db.collection('coupons').doc(code).get();

    if (!couponSnap.exists) {
      return res.status(400).json({ error: `Coupon "${code}" does not exist.` });
    }
    const coupon = couponSnap.data();
    const now = admin.firestore.Timestamp.now();

    if (!coupon.active) return res.status(400).json({ error: `Coupon "${code}" is no longer active.` });
    if (coupon.startDate && now.toMillis() < coupon.startDate.toMillis()) {
      return res.status(400).json({ error: `Coupon "${code}" is not active yet.` });
    }
    if (coupon.expiryDate && now.toMillis() > coupon.expiryDate.toMillis()) {
      return res.status(400).json({ error: `Coupon "${code}" has expired.` });
    }
    if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) {
      return res.status(400).json({ error: `Coupon "${code}" requires a minimum order of ₹${coupon.minOrderAmount}.` });
    }
    if (coupon.usageLimit && (coupon.usageCount || 0) >= coupon.usageLimit) {
      return res.status(400).json({ error: `Coupon "${code}" has reached its usage limit.` });
    }
    if (coupon.firstOrderOnly) {
      const priorOrders = await db.collection('orders')
        .where(user ? 'uid' : 'shippingEmail', '==', user ? user.uid : shippingInfo.email.toLowerCase())
        .where('status', 'in', ['confirmed', 'pending_payment'])
        .limit(1)
        .get();
      if (!priorOrders.empty) {
        return res.status(400).json({ error: `Coupon "${code}" is only valid on your first order.` });
      }
    }
    if (coupon.perUserLimit) {
      const redemptionSnap = await db.collection('coupons').doc(code).collection('redemptions').doc(identityKey).get();
      const usedCount = redemptionSnap.exists ? redemptionSnap.data().count || 0 : 0;
      if (usedCount >= coupon.perUserLimit) {
        return res.status(400).json({ error: `You've already used coupon "${code}" the maximum number of times.` });
      }
    }

    discountAmount = Math.round(subtotal * ((coupon.percent || 0) / 100));
    if (coupon.maxDiscount) discountAmount = Math.min(discountAmount, coupon.maxDiscount);
    appliedCouponCode = code;
  }

  const discountedSubtotal = subtotal - discountAmount;
  const tax = Math.round(discountedSubtotal * TAX_RATE);
  const total = discountedSubtotal + tax;

  // --- Production safety: never silently complete a "free" order because
  // payment infrastructure isn't configured. ---
  const razorpayConfigured = Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
  if (paymentMethod === 'razorpay' && !razorpayConfigured && isProduction()) {
    return res.status(503).json({ error: 'Online payment is not available right now. Please try Cash on Delivery or contact the store.' });
  }

  const orderId = `NB-${Math.floor(100000 + Math.random() * 900000)}`;
  const orderDoc = {
    idempotencyKey,
    orderId,
    uid: user?.uid || null,
    name: shippingInfo.name.trim(),
    email: shippingInfo.email.trim(),
    shippingEmail: shippingInfo.email.trim().toLowerCase(),
    phone: shippingInfo.phone.trim(),
    phoneNormalized: shippingInfo.phone.replace(/\D/g, ''),
    address: shippingInfo.address.trim(),
    city: shippingInfo.city.trim(),
    zip: shippingInfo.zip.trim(),
    items: orderItems,
    subtotal,
    discountAmount,
    couponCode: appliedCouponCode,
    tax,
    total,
    paymentMethod,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  // --- Cash on Delivery: finalize immediately (strict stock re-check +
  // decrement + coupon usage, all in ONE atomic transaction — so a crash
  // mid-way can never leave stock decremented without the order recorded,
  // or an order confirmed without its coupon usage counted). ---
  if (paymentMethod === 'cod') {
    let couponRef = null, redemptionRef = null;
    if (appliedCouponCode) {
      couponRef = db.collection('coupons').doc(appliedCouponCode);
      redemptionRef = couponRef.collection('redemptions').doc(identityKey);
    }

    try {
      await db.runTransaction(async (tx) => {
        // All reads before any writes (Firestore transaction requirement).
        const freshSnaps = await Promise.all(bookRefs.map((ref) => tx.get(ref)));
        const redemptionSnap = redemptionRef ? await tx.get(redemptionRef) : null;

        freshSnaps.forEach((snap, idx) => {
          const qty = orderItems[idx].quantity;
          if (!snap.exists || (snap.data().stockQuantity ?? 0) < qty) {
            throw new Error(`STOCK_CONFLICT:${orderItems[idx].title}`);
          }
        });

        freshSnaps.forEach((snap, idx) => {
          tx.update(bookRefs[idx], { stockQuantity: snap.data().stockQuantity - orderItems[idx].quantity });
        });
        const newOrderRef = db.collection('orders').doc();
        tx.set(newOrderRef, { ...orderDoc, status: 'confirmed', paymentStatus: 'cod_pending' });

        if (appliedCouponCode) {
          const prevCount = redemptionSnap.exists ? redemptionSnap.data().count || 0 : 0;
          tx.set(redemptionRef, { count: prevCount + 1, lastUsedAt: admin.firestore.FieldValue.serverTimestamp() });
          tx.update(couponRef, { usageCount: admin.firestore.FieldValue.increment(1) });
        }
      });
    } catch (err) {
      if (String(err.message).startsWith('STOCK_CONFLICT')) {
        return res.status(409).json({ error: `${err.message.split(':')[1]} sold out while you were checking out. Please remove it and try again.` });
      }
      console.error('COD order transaction failed:', err);
      return res.status(500).json({ error: 'Could not place your order. Please try again.' });
    }

    const savedSnap = await db.collection('orders').where('idempotencyKey', '==', idempotencyKey).limit(1).get();
    return res.status(200).json({
      internalOrderId: savedSnap.docs[0].id,
      orderId,
      status: 'confirmed',
      total,
    });
  }

  // --- Razorpay path: create a pending order, then a Razorpay order bound
  // to the server-computed amount. Stock is decremented only after the
  // payment is independently verified (see verify-razorpay-payment.js). ---
  if (!razorpayConfigured) {
    // Non-production fallback so local/dev checkout keeps working without
    // full Razorpay setup. This branch is blocked entirely in production
    // by the check above. No stock is at risk here (this never happens in
    // prod), but coupon usage is still recorded atomically with the order.
    let couponRef = null, redemptionRef = null;
    if (appliedCouponCode) {
      couponRef = db.collection('coupons').doc(appliedCouponCode);
      redemptionRef = couponRef.collection('redemptions').doc(identityKey);
    }
    const newOrderRef = db.collection('orders').doc();
    await db.runTransaction(async (tx) => {
      const redemptionSnap = redemptionRef ? await tx.get(redemptionRef) : null;
      tx.set(newOrderRef, { ...orderDoc, status: 'confirmed', paymentStatus: 'demo_no_gateway' });
      if (appliedCouponCode) {
        const prevCount = redemptionSnap.exists ? redemptionSnap.data().count || 0 : 0;
        tx.set(redemptionRef, { count: prevCount + 1, lastUsedAt: admin.firestore.FieldValue.serverTimestamp() });
        tx.update(couponRef, { usageCount: admin.firestore.FieldValue.increment(1) });
      }
    });
    return res.status(200).json({ internalOrderId: newOrderRef.id, orderId, status: 'confirmed', total, demo: true });
  }

  const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
  let razorpayOrder;
  try {
    razorpayOrder = await razorpay.orders.create({
      amount: Math.round(total * 100),
      currency: 'INR',
      receipt: idempotencyKey,
    });
  } catch (err) {
    console.error('Razorpay order creation failed:', err);
    return res.status(500).json({ error: 'Could not start the payment. Please try again.' });
  }

  const newOrderRef = db.collection('orders').doc();
  await newOrderRef.set({
    ...orderDoc,
    status: 'pending_payment',
    paymentStatus: 'pending',
    razorpayOrderId: razorpayOrder.id,
  });

  return res.status(200).json({
    internalOrderId: newOrderRef.id,
    orderId,
    status: 'pending_payment',
    total,
    razorpayOrderId: razorpayOrder.id,
    razorpayKeyId: process.env.VITE_RAZORPAY_KEY_ID,
  });
}
