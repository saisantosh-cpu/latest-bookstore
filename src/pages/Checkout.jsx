import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  CheckCircle, 
  CreditCard, 
  QrCode, 
  Wallet, 
  ArrowRight, 
  ArrowLeft, 
  ShieldCheck, 
  Lock, 
  BookOpen,
  PackageCheck,
  Banknote
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useOrders } from '../context/OrderContext';
import { useToast } from '../context/ToastContext';
import { sendOrderConfirmationEmail } from '../services/email';
import { openRazorpayCheckout } from '../services/payment';
import { useCoupons } from '../context/CouponContext';

const Checkout = () => {
  const { cart, getCartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const { createOrder, verifyPayment } = useOrders();
  const { validateCoupon } = useCoupons();
  const toast = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1: Address, 2: Payment, 3: Confirmation
  const [orderSummaryData, setOrderSummaryData] = useState(null);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  // Stable for the lifetime of this checkout page load — a retry (network
  // blip, double-click) reuses it so the server can safely dedupe; a fresh
  // page load gets a fresh one.
  const [idempotencyKey] = useState(() =>
    (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`
  );
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null); // { code, percent, label }
  const [couponError, setCouponError] = useState('');

  const handleApplyCoupon = () => {
    const match = validateCoupon(couponInput);
    if (match) {
      setAppliedCoupon({ code: couponInput.trim().toUpperCase(), ...match });
      setCouponError('');
    } else {
      setAppliedCoupon(null);
      setCouponError('That coupon code is not valid.');
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponError('');
  };

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    address: '',
    city: '',
    state: '',
    zip: '',
    phone: '',
    paymentMethod: 'card',
    cardNumber: '',
    cardExpiry: '',
    cardCvc: '',
    upiId: '',
  });

  const [formErrors, setFormErrors] = useState({});

  if (cart.length === 0 && step !== 3) {
    navigate('/cart');
    return null;
  }

  const subtotal = getCartTotal();
  const discountAmount = appliedCoupon ? Math.round(subtotal * (appliedCoupon.percent / 100)) : 0;
  const discountedSubtotal = subtotal - discountAmount;
  const tax = Math.round(discountedSubtotal * 0.08);
  const total = discountedSubtotal + tax;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (formErrors[e.target.name]) {
      setFormErrors({ ...formErrors, [e.target.name]: '' });
    }
  };

  const handleZipChange = (e) => {
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 6);
    setFormData({ ...formData, zip: digitsOnly });
    if (formErrors.zip) {
      setFormErrors({ ...formErrors, zip: '' });
    }
  };

  const handleAddressSubmit = (e) => {
    e.preventDefault();
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Full name is required';
    if (!formData.email.trim()) errors.email = 'Email address is required';
    if (!formData.address.trim()) errors.address = 'Street address is required';
    if (!formData.city.trim()) errors.city = 'City is required';
    if (!formData.zip.trim()) {
      errors.zip = 'PIN code is required';
    } else if (formData.zip.trim().length !== 6) {
      errors.zip = 'PIN code must be exactly 6 digits';
    }
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (formData.phone.replace(/\D/g, '').length < 10) {
      errors.phone = 'Enter a valid phone number (at least 10 digits)';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setStep(2);
    window.scrollTo(0, 0);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setIsPlacingOrder(true);

    const shippingInfo = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      city: formData.city,
      zip: formData.zip,
    };

    // Step 1: ask the SERVER to create the order. It re-fetches real prices
    // and stock from Firestore and re-validates the coupon — nothing about
    // price/discount/total that the browser computed is trusted here.
    let created;
    try {
      created = await createOrder({
        items: cart.map((i) => ({ bookId: i.id, quantity: i.quantity, selectedSize: i.selectedSize || null })),
        couponCode: appliedCoupon?.code || null,
        shippingInfo,
        paymentMethod: formData.paymentMethod === 'cod' ? 'cod' : 'razorpay',
        idempotencyKey,
      });
    } catch (err) {
      setIsPlacingOrder(false);
      toast?.show(err.message || 'Could not place your order. Please try again.', 'error', 7000);
      return;
    }

    let paymentId = null;

    // Step 2: if this needs online payment, open Razorpay using the
    // order/amount the SERVER already created — the client never supplies
    // or edits the amount at this stage.
    if (created.status === 'pending_payment' && created.razorpayOrderId) {
      const paymentResult = await openRazorpayCheckout({
        razorpayOrderId: created.razorpayOrderId,
        razorpayKeyId: created.razorpayKeyId,
        amount: created.total,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
      });

      if (!paymentResult.success) {
        setIsPlacingOrder(false);
        const messages = {
          cancelled: 'Payment was cancelled.',
          payment_failed: 'Payment failed. Please try again.',
          script_failed: 'Could not load the payment gateway. Check your connection and try again.',
        };
        toast?.show(messages[paymentResult.reason] || 'Payment was not completed.', 'error');
        return;
      }

      // Step 3: the SERVER independently verifies the signature, re-checks
      // the payment with Razorpay directly, and only then finalizes the
      // order (decrements stock, marks it paid).
      try {
        await verifyPayment({
          razorpay_order_id: paymentResult.razorpay_order_id,
          razorpay_payment_id: paymentResult.razorpay_payment_id,
          razorpay_signature: paymentResult.razorpay_signature,
          internalOrderId: created.internalOrderId,
        });
        paymentId = paymentResult.razorpay_payment_id;
      } catch (err) {
        setIsPlacingOrder(false);
        toast?.show(err.message || 'Payment could not be verified. If money was deducted, contact support with your order ID.', 'error', 9000);
        return;
      }
    } else if (created.demo) {
      toast?.show('Payment gateway not set up yet — order placed in demo mode (no real charge).', 'info', 6000);
    } else if (formData.paymentMethod === 'cod') {
      toast?.show('Order placed — pay in cash when it arrives.', 'success');
    }

    const orderRecord = {
      orderId: created.orderId,
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      items: [...cart],
      subtotal,
      discountAmount,
      couponCode: appliedCoupon?.code || null,
      tax,
      total: created.total, // server-authoritative amount, not the client's local calc
      shippingAddress: shippingInfo,
      paymentMethod: formData.paymentMethod,
      paymentId,
    };

    // Local copy for this browser's "My Orders" fallback view only — the
    // real record of truth is the Firestore document the server created.
    try {
      const existingOrders = JSON.parse(localStorage.getItem('nova_orders') || '[]');
      localStorage.setItem('nova_orders', JSON.stringify([orderRecord, ...existingOrders]));
    } catch (err) {
      // safe fallback
    }

    // Best-effort email confirmation — never blocks checkout if it fails or
    // if EmailJS hasn't been configured yet (see README.md).
    sendOrderConfirmationEmail({
      toEmail: formData.email,
      toName: formData.name,
      orderId: created.orderId,
      total: created.total,
      itemsSummary: cart.map((i) => `${i.quantity}x ${i.title}${i.selectedSize ? ` (${i.selectedSize})` : ''}`).join(', '),
    }).catch((err) => console.error('Order confirmation email failed:', err));

    setIsPlacingOrder(false);
    setOrderSummaryData(orderRecord);
    clearCart();
    setStep(3);
    window.scrollTo(0, 0);
  };

  // Step 3: Order Confirmation
  if (step === 3 && orderSummaryData) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 font-sans animate-in fade-in duration-300">
        <div className="bg-[#FFFFFF] dark:bg-[#1A1A20] p-8 sm:p-10 rounded border border-[#EDE4D8] dark:border-[#2A2A33] shadow-sm text-center">
          
          <div className="w-16 h-16 bg-green-50 dark:bg-green-950/40 text-[#2E7D32] dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-200 dark:border-green-900/40">
            <CheckCircle size={32} />
          </div>

          <span className="text-[10px] font-mono uppercase tracking-widest text-[#877F74] block mb-1">
            Order Reference: {orderSummaryData.orderId}
          </span>

          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#1C1A18] dark:text-[#F5F3EF] mb-3">
            Order Confirmed
          </h1>

          <p className="text-xs sm:text-sm text-[#575047] dark:text-[#CBC4B8] max-w-md mx-auto mb-8 leading-relaxed">
            Thank you, <span className="font-semibold text-[#1C1A18] dark:text-[#F5F3EF]">{orderSummaryData.shippingAddress.name}</span>. Your order has been placed and scheduled for careful parceling and dispatch.
          </p>

          {/* Ordered Volumes List */}
          <div className="border-t border-b border-[#EDE4D8] dark:border-[#2A2A33] py-5 mb-6 text-left">
            <h3 className="font-serif font-bold text-sm text-[#1C1A18] dark:text-[#F5F3EF] mb-3">
              Purchased Volumes ({orderSummaryData.items.reduce((s, i) => s + i.quantity, 0)})
            </h3>
            <div className="space-y-3 max-h-48 overflow-y-auto pr-1 custom-scrollbar text-xs">
              {orderSummaryData.items.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-[#575047] dark:text-[#CBC4B8]">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[#877F74]">{item.quantity}x</span>
                    <span className="font-medium text-[#1C1A18] dark:text-[#F5F3EF] line-clamp-1 max-w-[280px]">{item.title}{item.selectedSize ? ` (Size: ${item.selectedSize})` : ''}</span>
                  </div>
                  <span className="font-mono">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-[#EDE4D8]/60 dark:border-[#2A2A33] mt-4 pt-3 flex justify-between items-baseline font-serif font-bold text-sm text-[#1C1A18] dark:text-[#F5F3EF]">
              <span>Total Paid</span>
              <span className="text-base text-[#C85A32] dark:text-[#E06F45]">₹{orderSummaryData.total.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Shipping Summary */}
          <div className="bg-[#FAF6EE] dark:bg-[#121215] p-4 rounded text-left text-xs text-[#575047] dark:text-[#CBC4B8] mb-8">
            <span className="font-semibold text-[#1C1A18] dark:text-[#F5F3EF] block mb-1">Dispatch Destination:</span>
            <p>{orderSummaryData.shippingAddress.address}, {orderSummaryData.shippingAddress.city}, {orderSummaryData.shippingAddress.zip}</p>
            <p className="text-[#877F74] mt-1">Recipient: {orderSummaryData.shippingAddress.email}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center flex-wrap">
            {user && (
              <Link 
                to="/profile" 
                className="px-6 py-2.5 bg-[#FAF6EE] hover:bg-[#EAE0D1] text-[#1C1A18] dark:bg-[#22222B] dark:text-[#F5F3EF] dark:hover:bg-[#2C2C36] text-xs font-semibold uppercase tracking-wider rounded border border-[#DCD0BF] dark:border-[#363644] transition-colors"
              >
                View in My Orders
              </Link>
            )}
            <Link
              to={`/invoice/${orderSummaryData.orderId}?email=${encodeURIComponent(orderSummaryData.shippingAddress.email)}`}
              className="px-6 py-2.5 bg-[#FAF6EE] hover:bg-[#EAE0D1] text-[#1C1A18] dark:bg-[#22222B] dark:text-[#F5F3EF] dark:hover:bg-[#2C2C36] text-xs font-semibold uppercase tracking-wider rounded border border-[#DCD0BF] dark:border-[#363644] transition-colors"
            >
              Print Invoice
            </Link>
            <Link 
              to="/books" 
              className="px-6 py-2.5 bg-[#1C1A18] hover:bg-[#2E2A27] text-[#FAF6EE] dark:bg-[#FAF6EE] dark:hover:bg-[#FFFFFF] dark:text-[#1C1A18] text-xs font-semibold uppercase tracking-wider rounded transition-colors shadow-sm"
            >
              Continue Browsing Stacks
            </Link>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-20 font-sans">
      
      {/* 3-Step Progress Header */}
      <div className="mb-10">
        <div className="flex items-center justify-between max-w-md mx-auto mb-4 text-xs font-semibold">
          
          <div className={`flex items-center gap-2 ${step >= 1 ? 'text-[#C85A32] dark:text-[#E06F45]' : 'text-[#877F74]'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-mono ${step >= 1 ? 'bg-[#C85A32] text-white' : 'bg-[#EDE4D8] text-[#877F74]'}`}>
              1
            </span>
            <span>Shipping</span>
          </div>

          <div className={`h-0.5 flex-1 mx-3 ${step >= 2 ? 'bg-[#C85A32]' : 'bg-[#EDE4D8] dark:bg-[#2A2A33]'}`}></div>

          <div className={`flex items-center gap-2 ${step >= 2 ? 'text-[#C85A32] dark:text-[#E06F45]' : 'text-[#877F74]'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-mono ${step >= 2 ? 'bg-[#C85A32] text-white' : 'bg-[#EDE4D8] text-[#877F74]'}`}>
              2
            </span>
            <span>Payment</span>
          </div>

          <div className={`h-0.5 flex-1 mx-3 ${step >= 3 ? 'bg-[#C85A32]' : 'bg-[#EDE4D8] dark:bg-[#2A2A33]'}`}></div>

          <div className={`flex items-center gap-2 ${step === 3 ? 'text-[#C85A32] dark:text-[#E06F45]' : 'text-[#877F74]'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-mono ${step === 3 ? 'bg-[#C85A32] text-white' : 'bg-[#EDE4D8] text-[#877F74]'}`}>
              3
            </span>
            <span>Confirmation</span>
          </div>

        </div>

        <h1 className="font-serif text-3xl font-bold text-[#1C1A18] dark:text-[#F5F3EF] text-center">
          {step === 1 ? 'Shipping & Delivery Details' : 'Payment & Order Review'}
        </h1>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Main Step Form Area */}
        <div className="w-full md:w-2/3">
          
          {/* STEP 1: Shipping Address Form */}
          {step === 1 && (
            <form onSubmit={handleAddressSubmit} className="bg-[#FFFFFF] dark:bg-[#1A1A20] p-6 sm:p-8 rounded border border-[#EDE4D8] dark:border-[#2A2A33] shadow-sm space-y-4">
              <h2 className="font-serif font-bold text-lg text-[#1C1A18] dark:text-[#F5F3EF] pb-3 border-b border-[#EDE4D8] dark:border-[#2A2A33]">
                Delivery Address
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="sm:col-span-2">
                  <label className="block font-semibold uppercase tracking-wider text-[#877F74] mb-1">Full Recipient Name *</label>
                  <input
                    required
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Eleanor Vance"
                    className="w-full bg-[#FAF6EE] dark:bg-[#121215] text-[#1C1A18] dark:text-[#F5F3EF] p-2.5 rounded border border-[#DCD0BF] dark:border-[#363644] focus:border-[#C85A32] outline-none"
                  />
                  {formErrors.name && <span className="text-red-500 mt-1 block">{formErrors.name}</span>}
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold uppercase tracking-wider text-[#877F74] mb-1">Email Address *</label>
                  <input
                    required
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="e.g. reader@domain.com"
                    className="w-full bg-[#FAF6EE] dark:bg-[#121215] text-[#1C1A18] dark:text-[#F5F3EF] p-2.5 rounded border border-[#DCD0BF] dark:border-[#363644] focus:border-[#C85A32] outline-none"
                  />
                  {formErrors.email && <span className="text-red-500 mt-1 block">{formErrors.email}</span>}
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold uppercase tracking-wider text-[#877F74] mb-1">Phone Number *</label>
                  <input
                    required
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="e.g. 98765 43210"
                    className="w-full bg-[#FAF6EE] dark:bg-[#121215] text-[#1C1A18] dark:text-[#F5F3EF] p-2.5 rounded border border-[#DCD0BF] dark:border-[#363644] focus:border-[#C85A32] outline-none"
                  />
                  <p className="mt-1 text-[10px] text-[#877F74] normal-case tracking-normal font-normal">
                    Used for delivery updates and to look up your order history.
                  </p>
                  {formErrors.phone && <span className="text-red-500 mt-1 block">{formErrors.phone}</span>}
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold uppercase tracking-wider text-[#877F74] mb-1">Street Address *</label>
                  <input
                    required
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Apartment, suite, unit, street"
                    className="w-full bg-[#FAF6EE] dark:bg-[#121215] text-[#1C1A18] dark:text-[#F5F3EF] p-2.5 rounded border border-[#DCD0BF] dark:border-[#363644] focus:border-[#C85A32] outline-none"
                  />
                  {formErrors.address && <span className="text-red-500 mt-1 block">{formErrors.address}</span>}
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider text-[#877F74] mb-1">City *</label>
                  <input
                    required
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="City"
                    className="w-full bg-[#FAF6EE] dark:bg-[#121215] text-[#1C1A18] dark:text-[#F5F3EF] p-2.5 rounded border border-[#DCD0BF] dark:border-[#363644] focus:border-[#C85A32] outline-none"
                  />
                  {formErrors.city && <span className="text-red-500 mt-1 block">{formErrors.city}</span>}
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider text-[#877F74] mb-1">PIN / Postal Code *</label>
                  <input
                    required
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    name="zip"
                    value={formData.zip}
                    onChange={handleZipChange}
                    placeholder="e.g. 560001"
                    className="w-full bg-[#FAF6EE] dark:bg-[#121215] text-[#1C1A18] dark:text-[#F5F3EF] p-2.5 rounded border border-[#DCD0BF] dark:border-[#363644] focus:border-[#C85A32] outline-none font-mono"
                  />
                  {formErrors.zip && <span className="text-red-500 mt-1 block">{formErrors.zip}</span>}
                </div>
              </div>

              <div className="pt-4 flex justify-between items-center">
                <Link to="/cart" className="text-xs text-[#877F74] hover:text-[#C85A32] inline-flex items-center gap-1">
                  <ArrowLeft size={13} /> Back to Cart
                </Link>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#1C1A18] hover:bg-[#2E2A27] text-[#FAF6EE] dark:bg-[#FAF6EE] dark:hover:bg-[#FFFFFF] dark:text-[#1C1A18] text-xs font-semibold uppercase tracking-wider rounded inline-flex items-center gap-1.5 shadow-sm"
                >
                  <span>Continue to Payment</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: Payment Method & Details Form */}
          {step === 2 && (
            <form onSubmit={handlePaymentSubmit} className="bg-[#FFFFFF] dark:bg-[#1A1A20] p-6 sm:p-8 rounded border border-[#EDE4D8] dark:border-[#2A2A33] shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#EDE4D8] dark:border-[#2A2A33]">
                <h2 className="font-serif font-bold text-lg text-[#1C1A18] dark:text-[#F5F3EF]">
                  Select Payment Method
                </h2>
                <span className="text-[11px] text-[#877F74] flex items-center gap-1">
                  <Lock size={12} /> Encrypted Session
                </span>
              </div>

              {/* Payment Methods Selection */}
              <div className="space-y-2 text-xs">
                {/* Card Option */}
                <label className={`flex items-center justify-between p-3.5 rounded border cursor-pointer transition-colors ${formData.paymentMethod === 'card' ? 'border-[#C85A32] bg-[#FAF6EE] dark:bg-[#22222B]' : 'border-[#DCD0BF] dark:border-[#363644]'}`}>
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={formData.paymentMethod === 'card'}
                      onChange={handleChange}
                      className="text-[#C85A32] focus:ring-[#C85A32]"
                    />
                    <div>
                      <span className="font-semibold text-[#1C1A18] dark:text-[#F5F3EF] block">Credit or Debit Card</span>
                      <span className="text-[11px] text-[#877F74]">Visa, Mastercard, RuPay</span>
                    </div>
                  </div>
                  <CreditCard size={18} className="text-[#877F74]" />
                </label>

                {/* UPI Option */}
                <label className={`flex items-center justify-between p-3.5 rounded border cursor-pointer transition-colors ${formData.paymentMethod === 'upi' ? 'border-[#C85A32] bg-[#FAF6EE] dark:bg-[#22222B]' : 'border-[#DCD0BF] dark:border-[#363644]'}`}>
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="upi"
                      checked={formData.paymentMethod === 'upi'}
                      onChange={handleChange}
                      className="text-[#C85A32] focus:ring-[#C85A32]"
                    />
                    <div>
                      <span className="font-semibold text-[#1C1A18] dark:text-[#F5F3EF] block">UPI / QR Code</span>
                      <span className="text-[11px] text-[#877F74]">Google Pay, PhonePe, Paytm, BHIM</span>
                    </div>
                  </div>
                  <QrCode size={18} className="text-[#877F74]" />
                </label>

                {/* Digital Wallet Option */}
                <label className={`flex items-center justify-between p-3.5 rounded border cursor-pointer transition-colors ${formData.paymentMethod === 'wallet' ? 'border-[#C85A32] bg-[#FAF6EE] dark:bg-[#22222B]' : 'border-[#DCD0BF] dark:border-[#363644]'}`}>
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="wallet"
                      checked={formData.paymentMethod === 'wallet'}
                      onChange={handleChange}
                      className="text-[#C85A32] focus:ring-[#C85A32]"
                    />
                    <div>
                      <span className="font-semibold text-[#1C1A18] dark:text-[#F5F3EF] block">Net Banking & Wallets</span>
                      <span className="text-[11px] text-[#877F74]">Direct Bank Transfer / Digital Wallet</span>
                    </div>
                  </div>
                  <Wallet size={18} className="text-[#877F74]" />
                </label>

                <label className={`flex items-center justify-between p-3.5 rounded border cursor-pointer transition-colors ${formData.paymentMethod === 'cod' ? 'border-[#C85A32] bg-[#FAF6EE] dark:bg-[#22222B]' : 'border-[#DCD0BF] dark:border-[#363644]'}`}>
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={formData.paymentMethod === 'cod'}
                      onChange={handleChange}
                      className="text-[#C85A32] focus:ring-[#C85A32]"
                    />
                    <div>
                      <span className="font-semibold text-[#1C1A18] dark:text-[#F5F3EF] block">Cash on Delivery</span>
                      <span className="text-[11px] text-[#877F74]">Pay in cash when your order arrives</span>
                    </div>
                  </div>
                  <Banknote size={18} className="text-[#877F74]" />
                </label>
              </div>

              {/* Card Inputs */}
              {formData.paymentMethod === 'card' && (
                <div className="p-4 bg-[#FAF6EE] dark:bg-[#121215] rounded border border-[#DCD0BF] dark:border-[#363644] space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold uppercase tracking-wider text-[#877F74] mb-1">Card Number</label>
                    <input
                      required
                      type="text"
                      name="cardNumber"
                      value={formData.cardNumber}
                      onChange={handleChange}
                      placeholder="4000 1234 5678 9010"
                      className="w-full bg-[#FFFFFF] dark:bg-[#1A1A20] text-[#1C1A18] dark:text-[#F5F3EF] p-2.5 rounded border border-[#DCD0BF] dark:border-[#363644] font-mono outline-none focus:border-[#C85A32]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold uppercase tracking-wider text-[#877F74] mb-1">Expiry (MM/YY)</label>
                      <input
                        required
                        type="text"
                        name="cardExpiry"
                        value={formData.cardExpiry}
                        onChange={handleChange}
                        placeholder="08/28"
                        className="w-full bg-[#FFFFFF] dark:bg-[#1A1A20] text-[#1C1A18] dark:text-[#F5F3EF] p-2.5 rounded border border-[#DCD0BF] dark:border-[#363644] font-mono outline-none focus:border-[#C85A32]"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold uppercase tracking-wider text-[#877F74] mb-1">CVV / CVC</label>
                      <input
                        required
                        type="password"
                        maxLength="4"
                        name="cardCvc"
                        value={formData.cardCvc}
                        onChange={handleChange}
                        placeholder="•••"
                        className="w-full bg-[#FFFFFF] dark:bg-[#1A1A20] text-[#1C1A18] dark:text-[#F5F3EF] p-2.5 rounded border border-[#DCD0BF] dark:border-[#363644] font-mono outline-none focus:border-[#C85A32]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* UPI QR Code Container with Actual Order Total */}
              {formData.paymentMethod === 'upi' && (
                <div className="p-5 bg-[#FAF6EE] dark:bg-[#121215] rounded border border-[#DCD0BF] dark:border-[#363644] text-center space-y-3">
                  <div className="text-xs text-[#575047] dark:text-[#CBC4B8]">
                    Scan QR code or enter your VPA / UPI ID to authorize exact payment:
                  </div>

                  <div className="w-40 h-40 mx-auto bg-white p-2.5 rounded border border-[#DCD0BF] shadow-sm flex flex-col items-center justify-center">
                    <QrCode size={110} className="text-[#1C1A18]" />
                    <span className="text-[10px] font-mono font-bold text-[#1C1A18] mt-1">
                      ₹{total.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="max-w-xs mx-auto text-xs">
                    <label className="block font-semibold text-[#877F74] mb-1">Or enter UPI ID</label>
                    <input
                      type="text"
                      name="upiId"
                      value={formData.upiId}
                      onChange={handleChange}
                      placeholder="username@okhdfcbank"
                      className="w-full bg-white dark:bg-[#1A1A20] text-[#1C1A18] dark:text-[#F5F3EF] p-2 rounded border border-[#DCD0BF] dark:border-[#363644] font-mono text-center outline-none focus:border-[#C85A32]"
                    />
                  </div>
                </div>
              )}

              {/* Form Navigation Controls */}
              <div className="pt-4 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs text-[#877F74] hover:text-[#C85A32] inline-flex items-center gap-1"
                >
                  <ArrowLeft size={13} /> Edit Address
                </button>

                <button
                  type="submit"
                  disabled={isPlacingOrder}
                  className="px-6 py-2.5 bg-[#C85A32] hover:bg-[#AF4A25] disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-semibold uppercase tracking-wider rounded inline-flex items-center gap-1.5 shadow-sm"
                >
                  <span>{isPlacingOrder ? 'Processing…' : formData.paymentMethod === 'cod' ? 'Place Order (Pay on Delivery)' : `Pay ₹${total.toLocaleString('en-IN')} & Place Order`}</span>
                  <CheckCircle size={14} />
                </button>
              </div>

            </form>
          )}

        </div>

        {/* Right Column: Order Summary Preview */}
        <div className="w-full md:w-1/3">
          <div className="bg-[#FFFFFF] dark:bg-[#1A1A20] rounded border border-[#EDE4D8] dark:border-[#2A2A33] p-5 sticky top-24 shadow-sm space-y-4">
            <h2 className="font-serif font-bold text-base text-[#1C1A18] dark:text-[#F5F3EF] pb-2 border-b border-[#EDE4D8] dark:border-[#2A2A33]">
              Review Order ({cart.reduce((s, i) => s + i.quantity, 0)} items)
            </h2>
            
            <div className="max-h-56 overflow-y-auto pr-1 space-y-3 text-xs custom-scrollbar">
              {cart.map(item => (
                <div key={item.id} className="flex justify-between items-start gap-2 text-[#575047] dark:text-[#CBC4B8]">
                  <div className="flex gap-2">
                    <span className="font-mono text-[#877F74]">{item.quantity}x</span>
                    <span className="line-clamp-2 text-[#1C1A18] dark:text-[#F5F3EF]">{item.title}{item.selectedSize ? ` (Size: ${item.selectedSize})` : ''}</span>
                  </div>
                  <span className="font-mono font-medium whitespace-nowrap">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-[#EDE4D8] dark:border-[#2A2A33]">
              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded px-3 py-2 text-xs">
                  <span className="font-semibold text-green-700 dark:text-green-400">
                    "{appliedCoupon.code}" applied — {appliedCoupon.percent}% off
                  </span>
                  <button type="button" onClick={handleRemoveCoupon} className="text-green-700 dark:text-green-400 underline text-[11px] font-semibold">
                    Remove
                  </button>
                </div>
              ) : (
                <div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      placeholder="Coupon code"
                      className="flex-1 bg-[#FAF6EE] dark:bg-[#121215] text-[#1C1A18] dark:text-[#F5F3EF] text-xs p-2 rounded border border-[#DCD0BF] dark:border-[#363644] focus:border-[#C85A32] outline-none uppercase"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      className="px-3 py-2 text-xs font-semibold bg-[#1C1A18] dark:bg-[#F5F3EF] text-[#FAF6EE] dark:text-[#1C1A18] rounded hover:opacity-90"
                    >
                      Apply
                    </button>
                  </div>
                  {couponError && <p className="text-[11px] text-red-500 mt-1">{couponError}</p>}
                </div>
              )}
            </div>

            <div className="space-y-2 pt-3 border-t border-[#EDE4D8] dark:border-[#2A2A33] text-xs text-[#575047] dark:text-[#CBC4B8]">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-medium text-[#1C1A18] dark:text-[#F5F3EF]">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-green-700 dark:text-green-400">
                  <span>Discount ({appliedCoupon.percent}%)</span>
                  <span className="font-medium">−₹{discountAmount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Tax (8%)</span>
                <span className="font-medium text-[#1C1A18] dark:text-[#F5F3EF]">₹{tax.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="font-medium text-[#2E7D32] dark:text-green-400">FREE</span>
              </div>
            </div>
            
            <div className="pt-3 border-t border-[#EDE4D8] dark:border-[#2A2A33] flex justify-between items-baseline">
              <span className="font-serif font-bold text-sm text-[#1C1A18] dark:text-[#F5F3EF]">Total Amount</span>
              <span className="font-serif font-bold text-xl text-[#C85A32] dark:text-[#E06F45]">
                ₹{total.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Checkout;
