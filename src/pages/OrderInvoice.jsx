import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { Printer, ArrowLeft } from 'lucide-react';
import { businessInfo } from '../data/businessInfo';

const formatDate = (createdAtMs) => {
  if (!createdAtMs) return new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
  return new Date(createdAtMs).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
};

const OrderInvoice = () => {
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const emailFromLink = searchParams.get('email');

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lookupValue, setLookupValue] = useState('');

  const fetchOrder = async (email) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/get-order?orderId=${encodeURIComponent(orderId)}&email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not find that order.');
        setOrder(null);
      } else {
        setOrder(data);
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (emailFromLink) fetchOrder(emailFromLink);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, emailFromLink]);

  const handleLookupSubmit = (e) => {
    e.preventDefault();
    if (lookupValue.trim()) fetchOrder(lookupValue.trim());
  };

  if (loading) {
    return <div className="p-16 text-center text-gray-500 font-medium">Loading invoice…</div>;
  }

  if (!order) {
    return (
      <div className="max-w-sm mx-auto p-8 text-center">
        <p className="font-bold text-gray-900 dark:text-white mb-1">View invoice for {orderId}</p>
        <p className="text-sm text-gray-500 mb-5">Enter the email address used on this order to view it.</p>
        <form onSubmit={handleLookupSubmit} className="flex gap-2">
          <input
            type="email"
            value={lookupValue}
            onChange={(e) => setLookupValue(e.target.value)}
            placeholder="you@example.com"
            required
            className="flex-1 p-2.5 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-darkZinc dark:text-white text-sm focus:ring-2 focus:ring-brandAccent focus:outline-none"
          />
          <button type="submit" className="px-4 py-2.5 bg-[#1C1A18] dark:bg-[#F5F3EF] text-[#FAF6EE] dark:text-[#1C1A18] rounded text-sm font-semibold">
            View
          </button>
        </form>
        {error && <p className="text-xs text-red-500 mt-3">{error}</p>}
        <Link to="/" className="inline-block mt-6 text-sm font-semibold text-brandAccent">Back to home</Link>
      </div>
    );
  }

  const itemsTotal = (order.items || []).reduce((sum, i) => sum + (i.price || 0) * (i.quantity || 0), 0);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6 print:hidden">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-brandAccent">
          <ArrowLeft size={15} /> Back home
        </Link>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#1C1A18] dark:bg-[#F5F3EF] text-[#FAF6EE] dark:text-[#1C1A18] rounded text-sm font-semibold"
        >
          <Printer size={15} /> Print
        </button>
      </div>

      <div className="bg-white dark:bg-[#1A1A20] border border-gray-200 dark:border-gray-800 rounded-sm p-8 print:border-0 print:p-0">
        <div className="flex justify-between items-start pb-6 border-b border-gray-200 dark:border-gray-800 mb-6">
          <div>
            <h1 className="font-serif text-2xl font-bold text-gray-900 dark:text-white">{businessInfo.storeName}</h1>
            <p className="text-xs text-gray-500 mt-1">{businessInfo.establishedText}</p>
          </div>
          <div className="text-right">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">INVOICE</h2>
            <p className="text-xs text-gray-500 mt-1">{order.orderId}</p>
            <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8 text-sm">
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400 mb-1">Billed To</p>
            <p className="font-semibold text-gray-900 dark:text-white">{order.name}</p>
            <p className="text-gray-500">{order.email}</p>
            <p className="text-gray-500">{order.phone}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400 mb-1">Ship To</p>
            <p className="text-gray-500">{order.address}</p>
            <p className="text-gray-500">{order.city}, {order.zip}</p>
          </div>
        </div>

        <table className="w-full text-sm mb-6">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-800 text-[10px] uppercase font-bold tracking-wider text-gray-400">
              <th className="text-left py-2">Item</th>
              <th className="text-center py-2">Qty</th>
              <th className="text-right py-2">Price</th>
              <th className="text-right py-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {(order.items || []).map((item, idx) => (
              <tr key={idx} className="border-b border-gray-100 dark:border-gray-900">
                <td className="py-2.5 text-gray-900 dark:text-white">{item.title}{item.selectedSize ? ` (Size: ${item.selectedSize})` : ''}</td>
                <td className="py-2.5 text-center text-gray-500">{item.quantity}</td>
                <td className="py-2.5 text-right text-gray-500">₹{(item.price || 0).toLocaleString('en-IN')}</td>
                <td className="py-2.5 text-right font-medium text-gray-900 dark:text-white">
                  ₹{((item.price || 0) * (item.quantity || 0)).toLocaleString('en-IN')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="w-56 space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span>
              <span>₹{(order.subtotal ?? itemsTotal).toLocaleString('en-IN')}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-green-600 dark:text-green-400">
                <span>Discount {order.couponCode ? `(${order.couponCode})` : ''}</span>
                <span>−₹{order.discountAmount.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-500">
              <span>Tax</span>
              <span>₹{(order.tax || 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between font-bold text-base text-gray-900 dark:text-white pt-1.5 border-t border-gray-200 dark:border-gray-800">
              <span>Total</span>
              <span>₹{(order.total || 0).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-800 text-xs text-gray-500 flex justify-between">
          <span>Payment: {order.paymentMethod === 'cod' ? 'Cash on Delivery' : (order.paymentMethod || '—').toUpperCase()}</span>
          <span className="capitalize">Status: {(order.status || 'pending').replace(/_/g, ' ')}</span>
        </div>
      </div>
    </div>
  );
};

export default OrderInvoice;
