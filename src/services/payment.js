let scriptLoadingPromise = null;

const loadRazorpayScript = () => {
  if (window.Razorpay) return Promise.resolve(true);
  if (scriptLoadingPromise) return scriptLoadingPromise;

  scriptLoadingPromise = new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

  return scriptLoadingPromise;
};

/**
 * Opens the Razorpay checkout popup for an order that the SERVER has
 * already created (see OrderContext.createOrder / api/create-order.js) —
 * the amount, currency, and Razorpay order id all come from that response,
 * never recalculated or supplied by this client code.
 *
 * Resolves with { success: true, razorpay_order_id, razorpay_payment_id,
 * razorpay_signature } once Razorpay's popup reports success (still not
 * treated as "paid" until the server independently verifies it), or
 * { success: false, reason } if cancelled/failed.
 */
export const openRazorpayCheckout = async ({ razorpayOrderId, razorpayKeyId, amount, name, email, phone }) => {
  const scriptLoaded = await loadRazorpayScript();
  if (!scriptLoaded) {
    return { success: false, reason: 'script_failed' };
  }

  return new Promise((resolve) => {
    const options = {
      key: razorpayKeyId,
      amount: Math.round(amount * 100),
      currency: 'INR',
      name: 'S LV BOOK CENTER',
      description: 'Book order payment',
      order_id: razorpayOrderId,
      prefill: { name, email, contact: phone },
      theme: { color: '#C85A32' },
      handler: (response) => {
        resolve({
          success: true,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        });
      },
      modal: {
        ondismiss: () => resolve({ success: false, reason: 'cancelled' }),
      },
    };

    const razorpayInstance = new window.Razorpay(options);
    razorpayInstance.on('payment.failed', () => {
      resolve({ success: false, reason: 'payment_failed' });
    });
    razorpayInstance.open();
  });
};
