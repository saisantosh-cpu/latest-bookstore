import { getAdminDb } from './_lib/firebaseAdmin.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { orderId, email, phone } = req.query;
  if (!orderId || typeof orderId !== 'string') {
    return res.status(400).json({ error: 'Missing order ID.' });
  }
  if (!email && !phone) {
    // Requiring a second matching detail (whatever the customer already has
    // from their confirmation page/email) makes the 6-digit order ID much
    // harder to brute-force/enumerate than the ID alone.
    return res.status(400).json({ error: 'Please provide the email or phone used on this order.' });
  }

  let snap;
  try {
    const db = getAdminDb();
    snap = await db.collection('orders').where('orderId', '==', orderId).limit(1).get();
  } catch (err) {
    console.error(err.message);
    return res.status(503).json({ error: 'Server is not fully configured yet.' });
  }
  if (snap.empty) {
    return res.status(404).json({ error: 'Order not found.' });
  }

  const data = snap.docs[0].data();
  const emailMatches = email && data.email?.toLowerCase() === String(email).toLowerCase();
  const phoneMatches = phone && data.phoneNormalized === String(phone).replace(/\D/g, '');
  if (!emailMatches && !phoneMatches) {
    return res.status(404).json({ error: 'Order not found.' });
  }
  // Only return what an invoice/confirmation page needs — never leak the
  // raw uid, idempotencyKey, or internal Razorpay identifiers.
  return res.status(200).json({
    orderId: data.orderId,
    name: data.name,
    email: data.email,
    phone: data.phone,
    address: data.address,
    city: data.city,
    zip: data.zip,
    items: data.items,
    subtotal: data.subtotal,
    discountAmount: data.discountAmount,
    couponCode: data.couponCode,
    tax: data.tax,
    total: data.total,
    paymentMethod: data.paymentMethod,
    status: data.status,
    createdAt: data.createdAt ? data.createdAt.toMillis() : null,
  });
}
