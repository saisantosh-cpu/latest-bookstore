import React, { useState } from 'react';
import { Tag, Plus, Trash2, Power } from 'lucide-react';
import { useCoupons } from '../context/CouponContext';
import { useToast } from '../context/ToastContext';

const AdminCoupons = () => {
  const { coupons, couponsLoading, addCoupon, toggleCouponActive, deleteCoupon } = useCoupons();
  const toast = useToast();

  const [code, setCode] = useState('');
  const [percent, setPercent] = useState('');
  const [label, setLabel] = useState('');
  const [usageLimit, setUsageLimit] = useState('');
  const [perUserLimit, setPerUserLimit] = useState('1');
  const [minOrderAmount, setMinOrderAmount] = useState('');
  const [maxDiscount, setMaxDiscount] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [firstOrderOnly, setFirstOrderOnly] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!code.trim() || !percent) {
      toast?.show('Enter a code and a discount percentage.', 'error');
      return;
    }
    const percentNum = Number(percent);
    if (percentNum <= 0 || percentNum > 100) {
      toast?.show('Percentage must be between 1 and 100.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await addCoupon({ code, percent: percentNum, label, usageLimit, perUserLimit, minOrderAmount, maxDiscount, expiryDate, firstOrderOnly });
      toast?.show(`Coupon "${code.trim().toUpperCase()}" created.`, 'success');
      setCode('');
      setPercent('');
      setLabel('');
      setUsageLimit('');
      setPerUserLimit('1');
      setMinOrderAmount('');
      setMaxDiscount('');
      setExpiryDate('');
      setFirstOrderOnly(false);
    } catch (err) {
      console.error('Failed to create coupon:', err);
      toast?.show('Could not create the coupon. Please try again.', 'error');
    }
    setSubmitting(false);
  };

  const handleDelete = async (coupon) => {
    if (!window.confirm(`Delete coupon "${coupon.code}"?`)) return;
    try {
      await deleteCoupon(coupon);
    } catch (err) {
      console.error('Failed to delete coupon:', err);
      toast?.show('Could not delete the coupon. Please try again.', 'error');
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Coupon Codes</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-0.5 text-sm font-medium">
          Create discount codes customers can apply at checkout.
        </p>
      </div>

      {/* Create form */}
      <form onSubmit={handleAdd} className="bg-white dark:bg-darkZincAlt rounded-2xl border border-gray-100 dark:border-gray-800 p-5 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Code</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. DIWALI25"
              className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-darkZinc dark:text-white text-sm focus:ring-2 focus:ring-brandAccent focus:outline-none uppercase"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Percent off</label>
            <input
              type="number"
              min="1"
              max="100"
              value={percent}
              onChange={(e) => setPercent(e.target.value)}
              placeholder="e.g. 25"
              className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-darkZinc dark:text-white text-sm focus:ring-2 focus:ring-brandAccent focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Label (optional)</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Diwali sale"
              className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-darkZinc dark:text-white text-sm focus:ring-2 focus:ring-brandAccent focus:outline-none"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-1.5 p-3 bg-brandAccent hover:bg-amber-700 disabled:opacity-60 text-white rounded-xl font-bold text-sm transition-colors"
            >
              <Plus size={16} /> Add
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Total uses (optional)</label>
            <input
              type="number" min="1" value={usageLimit} onChange={(e) => setUsageLimit(e.target.value)}
              placeholder="Unlimited"
              className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-darkZinc dark:text-white text-sm focus:ring-2 focus:ring-brandAccent focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Uses per customer</label>
            <input
              type="number" min="1" value={perUserLimit} onChange={(e) => setPerUserLimit(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-darkZinc dark:text-white text-sm focus:ring-2 focus:ring-brandAccent focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Min order (₹)</label>
            <input
              type="number" min="0" value={minOrderAmount} onChange={(e) => setMinOrderAmount(e.target.value)}
              placeholder="None"
              className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-darkZinc dark:text-white text-sm focus:ring-2 focus:ring-brandAccent focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Max discount (₹)</label>
            <input
              type="number" min="0" value={maxDiscount} onChange={(e) => setMaxDiscount(e.target.value)}
              placeholder="None"
              className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-darkZinc dark:text-white text-sm focus:ring-2 focus:ring-brandAccent focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Expires</label>
            <input
              type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-darkZinc dark:text-white text-sm focus:ring-2 focus:ring-brandAccent focus:outline-none"
            />
          </div>
        </div>

        <label className="flex items-center gap-2 mt-3 text-sm text-gray-600 dark:text-gray-300">
          <input type="checkbox" checked={firstOrderOnly} onChange={(e) => setFirstOrderOnly(e.target.checked)} className="rounded" />
          First order only (customer must have no prior orders)
        </label>
      </form>

      {/* Coupon list */}
      <div className="bg-white dark:bg-darkZincAlt rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        {couponsLoading ? (
          <div className="p-12 text-center text-gray-500 font-medium">Loading coupons…</div>
        ) : coupons.length === 0 ? (
          <div className="p-12 text-center">
            <Tag className="mx-auto mb-3 text-gray-400" size={26} />
            <p className="font-bold text-gray-900 dark:text-white">No coupons yet</p>
            <p className="text-sm text-gray-500 mt-1">Create one above to offer a discount at checkout.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {coupons.map((coupon) => (
              <div key={coupon.code} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <span className={`font-mono font-bold text-sm px-2.5 py-1 rounded ${coupon.active ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-gray-100 text-gray-400 dark:bg-gray-800'}`}>
                    {coupon.code}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{coupon.percent}% off</p>
                    {coupon.label && <p className="text-xs text-gray-500">{coupon.label}</p>}
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {coupon.usageCount || 0}{coupon.usageLimit ? ` / ${coupon.usageLimit}` : ''} used
                      {coupon.perUserLimit ? ` · ${coupon.perUserLimit}/customer` : ''}
                      {coupon.minOrderAmount ? ` · min ₹${coupon.minOrderAmount}` : ''}
                      {coupon.firstOrderOnly ? ' · first order only' : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleCouponActive(coupon)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      coupon.active
                        ? 'bg-gray-100 hover:bg-gray-200 text-gray-600 dark:bg-darkZinc dark:text-gray-300'
                        : 'bg-green-50 hover:bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                    }`}
                  >
                    <Power size={12} /> {coupon.active ? 'Disable' : 'Enable'}
                  </button>
                  <button
                    onClick={() => handleDelete(coupon)}
                    className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                    aria-label="Delete coupon"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCoupons;
