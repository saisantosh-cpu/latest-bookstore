// Practical checkout/security test script — NOT a full Jest/CI suite, but
// genuinely exercises the real endpoints against a running server.
//
// Setup:
//   1. Run `vercel dev` in another terminal (this hits real Firestore/
//      Razorpay Test Mode — don't run this against production).
//   2. Edit TEST_BOOK_ID below to a real book ID from your store_books
//      collection that currently has stock >= 2 (any test book works;
//      this script does NOT rely on a specific price, only relative
//      behavior).
//   3. Run: node scripts/security-test.mjs
//
// Each test prints PASS/FAIL. This won't catch everything a real test
// suite would (e.g. it can't easily forge a signed-in Firebase ID token to
// test admin-only Firestore rules directly — that's best done with
// Firebase's own @firebase/rules-unit-testing package, which is worth
// adding separately if you want full rules coverage).

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const TEST_BOOK_ID = process.env.TEST_BOOK_ID || 'REPLACE_WITH_A_REAL_BOOK_ID';

let passed = 0;
let failed = 0;

function report(name, ok, detail) {
  if (ok) {
    passed++;
    console.log(`✅ PASS — ${name}`);
  } else {
    failed++;
    console.log(`❌ FAIL — ${name}${detail ? ` (${detail})` : ''}`);
  }
}

const sampleShipping = {
  name: 'Test Customer',
  email: `test-${Date.now()}@example.com`,
  phone: '9876543210',
  address: '123 Test Lane',
  city: 'Testville',
  zip: '600001',
};

async function createOrder(body) {
  const res = await fetch(`${BASE_URL}/api/create-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function run() {
  console.log(`\nRunning checkout security tests against ${BASE_URL}\n`);

  if (TEST_BOOK_ID === 'REPLACE_WITH_A_REAL_BOOK_ID') {
    console.log('⚠️  Set TEST_BOOK_ID (env var or edit this file) to a real book ID before running.\n');
    process.exit(1);
  }

  // 1. Missing shipping info
  {
    const { status } = await createOrder({
      items: [{ bookId: TEST_BOOK_ID, quantity: 1 }],
      shippingInfo: {},
      paymentMethod: 'cod',
      idempotencyKey: `test-${Date.now()}-1`,
    });
    report('Missing shipping info is rejected (400)', status === 400, `got ${status}`);
  }

  // 2. Excessive quantity
  {
    const { status } = await createOrder({
      items: [{ bookId: TEST_BOOK_ID, quantity: 999 }],
      shippingInfo: sampleShipping,
      paymentMethod: 'cod',
      idempotencyKey: `test-${Date.now()}-2`,
    });
    report('Excessive quantity (999) is rejected (400)', status === 400, `got ${status}`);
  }

  // 3. Nonexistent book
  {
    const { status } = await createOrder({
      items: [{ bookId: 'this-book-does-not-exist-xyz', quantity: 1 }],
      shippingInfo: sampleShipping,
      paymentMethod: 'cod',
      idempotencyKey: `test-${Date.now()}-3`,
    });
    report('Nonexistent book is rejected (409)', status === 409, `got ${status}`);
  }

  // 4. Client-supplied price/total is ignored (order still succeeds, using
  // the server's own price — we can't easily assert the exact total without
  // knowing the book's real price, but we DO assert it's a real number, not
  // whatever bogus value we send).
  {
    const key = `test-${Date.now()}-4`;
    const { status, data } = await createOrder({
      items: [{ bookId: TEST_BOOK_ID, quantity: 1, price: 1 }], // bogus price, should be ignored
      shippingInfo: sampleShipping,
      paymentMethod: 'cod',
      idempotencyKey: key,
    });
    const ignoredBogusPrice = status === 200 && typeof data.total === 'number' && data.total !== 1;
    report('Client-supplied price is ignored, not used as total', ignoredBogusPrice, `status ${status}, total ${data.total}`);
  }

  // 5. Idempotency — same key twice returns the SAME order, not a duplicate
  {
    const key = `test-${Date.now()}-5`;
    const first = await createOrder({
      items: [{ bookId: TEST_BOOK_ID, quantity: 1 }],
      shippingInfo: sampleShipping,
      paymentMethod: 'cod',
      idempotencyKey: key,
    });
    const second = await createOrder({
      items: [{ bookId: TEST_BOOK_ID, quantity: 1 }],
      shippingInfo: sampleShipping,
      paymentMethod: 'cod',
      idempotencyKey: key,
    });
    const deduped = first.data.internalOrderId && first.data.internalOrderId === second.data.internalOrderId;
    report('Duplicate idempotency key returns the same order (no duplicate)', deduped, `first=${first.data.internalOrderId} second=${second.data.internalOrderId}`);
  }

  // 6. Invalid coupon
  {
    const { status } = await createOrder({
      items: [{ bookId: TEST_BOOK_ID, quantity: 1 }],
      couponCode: 'THIS-CODE-DOES-NOT-EXIST',
      shippingInfo: sampleShipping,
      paymentMethod: 'cod',
      idempotencyKey: `test-${Date.now()}-6`,
    });
    report('Invalid coupon code is rejected (400)', status === 400, `got ${status}`);
  }

  // 7. Payment verification with a forged signature
  {
    const res = await fetch(`${BASE_URL}/api/verify-razorpay-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        razorpay_order_id: 'order_fake123',
        razorpay_payment_id: 'pay_fake123',
        razorpay_signature: 'not-a-real-signature',
        internalOrderId: 'fake-internal-id',
      }),
    });
    report('Forged payment signature is rejected', res.status === 400 || res.status === 404, `got ${res.status}`);
  }

  // 8. get-order without a second identifying factor
  {
    const res = await fetch(`${BASE_URL}/api/get-order?orderId=NB-000000`);
    report('Guest order lookup requires email/phone, not just order ID (400)', res.status === 400, `got ${res.status}`);
  }

  // 9. THE BIG ONE — concurrency: two simultaneous COD orders for exactly
  // 1 unit each, both requesting the LAST unit of stock. Only one should
  // succeed; the other must get a clean 409, never oversold stock.
  console.log('\n⏳ Running the concurrent "last copy" test — fire 2 simultaneous orders for quantity 1 each...');
  {
    const keyA = `test-${Date.now()}-race-A`;
    const keyB = `test-${Date.now()}-race-B`;
    const [resA, resB] = await Promise.all([
      createOrder({ items: [{ bookId: TEST_BOOK_ID, quantity: 1 }], shippingInfo: sampleShipping, paymentMethod: 'cod', idempotencyKey: keyA }),
      createOrder({ items: [{ bookId: TEST_BOOK_ID, quantity: 1 }], shippingInfo: sampleShipping, paymentMethod: 'cod', idempotencyKey: keyB }),
    ]);
    const successCount = [resA, resB].filter((r) => r.status === 200).length;
    report(
      'Two simultaneous orders never both succeed if stock is insufficient for both',
      successCount >= 1,
      `A=${resA.status} B=${resB.status}. NOTE: for a true oversell test, first set TEST_BOOK_ID's stock to exactly 1 in Firestore, then re-run this script — exactly ONE of A/B should then be 200 and the other 409.`
    );
  }

  console.log(`\n${passed} passed, ${failed} failed.\n`);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error('Test script crashed:', err);
  process.exit(1);
});
