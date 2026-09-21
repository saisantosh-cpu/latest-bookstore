// Firestore Security Rules test suite.
//
// This tests the RULES themselves — the scenarios the HTTP-level script
// (security-test.mjs) can't reach, because they involve a signed-in user
// hitting Firestore directly with the Web SDK, bypassing your /api layer
// entirely. That's exactly what a malicious user would do from the browser
// console, so it's the most important thing to verify.
//
// Setup (one time):
//   npm install -g firebase-tools
//   firebase login
//
// Run:
//   firebase emulators:exec --only firestore "node scripts/rules-test.mjs"
//
// (The emulator runs locally — this never touches your real data.)

import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { readFileSync } from 'fs';

let passed = 0;
let failed = 0;

async function check(name, promise) {
  try {
    await promise;
    passed++;
    console.log(`✅ PASS — ${name}`);
  } catch (err) {
    failed++;
    console.log(`❌ FAIL — ${name}\n   ${err.message}`);
  }
}

const testEnv = await initializeTestEnvironment({
  projectId: 'novella-rules-test',
  firestore: {
    rules: readFileSync('firestore.rules', 'utf8'),
    host: '127.0.0.1',
    port: 8080,
  },
});

// Seed some baseline data with rules bypassed, so we have something to
// attack in the tests below.
await testEnv.withSecurityRulesDisabled(async (ctx) => {
  const db = ctx.firestore();
  await setDoc(doc(db, 'users/admin-uid'), { name: 'Admin', email: 'admin@test.com', role: 'admin' });
  await setDoc(doc(db, 'users/customer-uid'), { name: 'Customer', email: 'cust@test.com', role: 'user' });
  await setDoc(doc(db, 'users/other-uid'), { name: 'Other', email: 'other@test.com', role: 'user' });
  await setDoc(doc(db, 'store_books/book-1'), { title: 'Test Book', price: 500, stockQuantity: 10 });
  await setDoc(doc(db, 'coupons/TESTCODE'), { code: 'TESTCODE', percent: 10, active: true, usageCount: 0 });
  await setDoc(doc(db, 'orders/order-1'), {
    orderId: 'NB-111111', uid: 'customer-uid', total: 1000, status: 'confirmed',
    name: 'Customer', email: 'cust@test.com', phone: '9876543210', items: [],
  });
  await setDoc(doc(db, 'orders/order-2'), {
    orderId: 'NB-222222', uid: 'other-uid', total: 2000, status: 'confirmed',
    name: 'Other', email: 'other@test.com', phone: '9999999999', items: [],
  });
});

const customer = testEnv.authenticatedContext('customer-uid').firestore();
const admin = testEnv.authenticatedContext('admin-uid').firestore();
const guest = testEnv.unauthenticatedContext().firestore();

console.log('\n--- BOOKS ---');
await check('Anyone can READ books (public catalog)',
  assertSucceeds(getDoc(doc(guest, 'store_books/book-1'))));

await check('Normal user CANNOT create a book',
  assertFails(setDoc(doc(customer, 'store_books/evil-book'), { title: 'Hacked', price: 1 })));

await check('Normal user CANNOT change a book price',
  assertFails(updateDoc(doc(customer, 'store_books/book-1'), { price: 1 })));

await check('Normal user CANNOT change book stock',
  assertFails(updateDoc(doc(customer, 'store_books/book-1'), { stockQuantity: 99999 })));

await check('Normal user CANNOT delete a book',
  assertFails(deleteDoc(doc(customer, 'store_books/book-1'))));

await check('Admin CAN update a book',
  assertSucceeds(updateDoc(doc(admin, 'store_books/book-1'), { price: 600 })));

console.log('\n--- ORDERS ---');
await check('Customer CAN read their own order',
  assertSucceeds(getDoc(doc(customer, 'orders/order-1'))));

await check("Customer CANNOT read another customer's order",
  assertFails(getDoc(doc(customer, 'orders/order-2'))));

await check('Customer CANNOT list ALL orders (unscoped query)',
  assertFails(getDocs(collection(customer, 'orders'))));

await check('Customer CAN list their own orders (scoped by uid)',
  assertSucceeds(getDocs(query(collection(customer, 'orders'), where('uid', '==', 'customer-uid')))));

await check('Customer CANNOT change their order total',
  assertFails(updateDoc(doc(customer, 'orders/order-1'), { total: 1 })));

await check('Customer CANNOT change payment status',
  assertFails(updateDoc(doc(customer, 'orders/order-1'), { paymentStatus: 'paid' })));

// Cancellation must go exclusively through POST /api/cancel-order, which
// restores stock and issues refunds. If a customer could flip status
// directly here, they'd bypass both — so ALL customer order updates are
// rejected, status-only included.
await check('Customer CANNOT flip their own confirmed order to cancelled (must use /api/cancel-order)',
  assertFails(updateDoc(doc(customer, 'orders/order-1'), { status: 'cancelled' })));

await check('Customer CANNOT update ANY field on their own order',
  assertFails(updateDoc(doc(customer, 'orders/order-1'), { status: 'delivered' })));

await check('Customer CANNOT set refund fields on their own order',
  assertFails(updateDoc(doc(customer, 'orders/order-1'), { refundStatus: 'processed', refundId: 'fake' })));

await check('Customer CANNOT restore book stock themselves (why cancel is server-side)',
  assertFails(updateDoc(doc(customer, 'store_books/book-1'), { stockQuantity: 500 })));

await check('Admin CAN still update an order status',
  assertSucceeds(updateDoc(doc(admin, 'orders/order-1'), { status: 'shipped' })));

await check("Customer CANNOT modify another customer's order",
  assertFails(updateDoc(doc(customer, 'orders/order-2'), { status: 'cancelled' })));

await check('Customer CANNOT create an order directly (server-only)',
  assertFails(setDoc(doc(customer, 'orders/fake-order'), { uid: 'customer-uid', total: 0, items: [] })));

await check('Nobody can delete an order',
  assertFails(deleteDoc(doc(admin, 'orders/order-2'))));

await check('Admin CAN read all orders',
  assertSucceeds(getDocs(collection(admin, 'orders'))));

console.log('\n--- USERS / PRIVILEGE ESCALATION ---');
await check('User CANNOT promote themselves to admin',
  assertFails(updateDoc(doc(customer, 'users/customer-uid'), { role: 'admin' })));

await check("User CANNOT read another user's profile",
  assertFails(getDoc(doc(customer, 'users/other-uid'))));

await check('User CAN read their own profile',
  assertSucceeds(getDoc(doc(customer, 'users/customer-uid'))));

await check('New signup CANNOT create themselves as admin',
  assertFails(setDoc(doc(testEnv.authenticatedContext('new-uid').firestore(), 'users/new-uid'), { name: 'New', email: 'n@t.com', role: 'admin' })));

await check('New signup CAN create themselves as a normal user',
  assertSucceeds(setDoc(doc(testEnv.authenticatedContext('new-uid2').firestore(), 'users/new-uid2'), { name: 'New', email: 'n2@t.com', role: 'user' })));

console.log('\n--- COUPONS ---');
await check('Anyone can READ coupons (for checkout preview)',
  assertSucceeds(getDoc(doc(guest, 'coupons/TESTCODE'))));

await check('Normal user CANNOT create a coupon',
  assertFails(setDoc(doc(customer, 'coupons/FREEMONEY'), { code: 'FREEMONEY', percent: 100, active: true })));

await check('Normal user CANNOT change a coupon discount',
  assertFails(updateDoc(doc(customer, 'coupons/TESTCODE'), { percent: 100 })));

await check('Normal user CANNOT tamper with coupon usage count',
  assertFails(updateDoc(doc(customer, 'coupons/TESTCODE'), { usageCount: 0 })));

await check('Normal user CANNOT read redemption records',
  assertFails(getDoc(doc(customer, 'coupons/TESTCODE/redemptions/customer-uid'))));

await check('Admin CAN create a coupon',
  assertSucceeds(setDoc(doc(admin, 'coupons/ADMINCODE'), { code: 'ADMINCODE', percent: 15, active: true, usageCount: 0 })));

await testEnv.cleanup();

console.log(`\n${passed} passed, ${failed} failed.\n`);
process.exit(failed > 0 ? 1 : 0);
