import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Phone, Package, Bell, ChevronDown, Printer } from 'lucide-react';
import { useOrders } from '../context/OrderContext';
import { isFirebaseConfigured } from '../firebase/config';
import { TableSkeleton } from './Skeleton';
import StatusBadge from './StatusBadge';

// "pending_payment" is a transitional state the server sets while waiting
// on Razorpay — it's never something the admin should manually pick.
const STATUS_OPTIONS = ['confirmed', 'shipped', 'delivered', 'cancelled'];

const formatDate = (createdAt) => {
  if (createdAt?.toDate) {
    return createdAt.toDate().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  }
  return 'Just now';
};

const AdminOrders = () => {
  const { orders, ordersLoading, markOrdersSeen, getOrdersByPhone, updateOrderStatus } = useOrders();
  const [phoneQuery, setPhoneQuery] = useState('');
  const [notifPermission, setNotifPermission] = useState(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported'
  );

  useEffect(() => {
    // Opening the Orders tab counts as "seen" — clears the unread badge.
    markOrdersSeen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const requestNotifications = async () => {
    if (!('Notification' in window)) return;
    const permission = await Notification.requestPermission();
    setNotifPermission(permission);
  };

  const displayedOrders = useMemo(() => {
    if (!phoneQuery.trim()) return orders;
    return getOrdersByPhone(phoneQuery);
  }, [phoneQuery, orders, getOrdersByPhone]);

  if (!isFirebaseConfigured) {
    return (
      <div className="bg-white dark:bg-darkZincAlt rounded-3xl border border-gray-100 dark:border-gray-800 p-10 text-center">
        <Package className="mx-auto mb-4 text-gray-400" size={32} />
        <p className="font-bold text-gray-900 dark:text-white text-lg">Orders aren't connected yet</p>
        <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
          Add your Firebase project keys to a <code className="font-mono bg-gray-100 dark:bg-darkZinc px-1.5 py-0.5 rounded">.env</code> file
          (see <code className="font-mono bg-gray-100 dark:bg-darkZinc px-1.5 py-0.5 rounded">.env.example</code>) to start receiving and viewing customer orders here.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Customer Orders</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-0.5 text-sm font-medium">
            Live — new orders appear here automatically.
          </p>
        </div>

        {notifPermission !== 'unsupported' && notifPermission !== 'granted' && (
          <button
            onClick={requestNotifications}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-darkZinc dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-bold transition-colors"
          >
            <Bell size={15} /> Enable desktop alerts
          </button>
        )}
        {notifPermission === 'granted' && (
          <span className="flex items-center gap-1.5 text-xs font-bold text-green-600 dark:text-green-400">
            <Bell size={14} /> Desktop alerts on
          </span>
        )}
      </div>

      {/* Phone search */}
      <div className="bg-white dark:bg-darkZincAlt rounded-2xl border border-gray-100 dark:border-gray-800 p-4 mb-5">
        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
          Look up a customer's order history by phone number
        </label>
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Phone size={16} />
          </div>
          <input
            type="tel"
            value={phoneQuery}
            onChange={(e) => setPhoneQuery(e.target.value)}
            placeholder="Enter phone number..."
            className="pl-10 block w-full bg-gray-50 dark:bg-darkZinc border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-brandAccent focus:outline-none font-medium"
          />
        </div>
        {phoneQuery.trim() && (
          <p className="text-xs text-gray-500 mt-2 font-semibold">
            {displayedOrders.length} order{displayedOrders.length === 1 ? '' : 's'} found for this number
          </p>
        )}
      </div>

      {/* Orders list */}
      <div className="bg-white dark:bg-darkZincAlt rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        {ordersLoading ? (
          <div className="p-5"><TableSkeleton rows={4} /></div>
        ) : displayedOrders.length === 0 ? (
          <div className="p-16 text-center">
            <Package className="mx-auto mb-4 text-gray-400" size={28} />
            <p className="font-bold text-gray-900 dark:text-white">
              {phoneQuery.trim() ? 'No orders found for that number.' : 'No orders yet.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {displayedOrders.map((order) => (
              <div key={order.id} className="p-5 sm:p-6 hover:bg-gray-50/60 dark:hover:bg-darkZinc/40 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs text-gray-500">{order.orderId}</span>
                      <StatusBadge status={order.status} />
                    </div>
                    <p className="font-bold text-gray-900 dark:text-white mt-1">{order.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {order.phone} • {order.email}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{order.address}, {order.city}, {order.zip}</p>
                    <p className="text-[11px] text-gray-400 mt-1">{formatDate(order.createdAt)}</p>
                  </div>

                  <div className="flex flex-col items-start sm:items-end gap-2">
                    <span className="font-black text-lg text-gray-900 dark:text-white">
                      ₹{(order.total || 0).toLocaleString('en-IN')}
                    </span>
                    <div className="relative">
                      <select
                        value={order.status || 'pending'}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                        className="appearance-none pl-3 pr-8 py-1.5 text-xs font-bold bg-gray-50 dark:bg-darkZinc border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg focus:ring-2 focus:ring-brandAccent focus:outline-none cursor-pointer"
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                        ))}
                      </select>
                      <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                  {(order.items || []).map((item, idx) => (
                    <span key={idx}>
                      <span className="font-mono text-gray-400">{item.quantity}x</span> {item.title}{item.selectedSize ? ` (Size: ${item.selectedSize})` : ''}
                    </span>
                  ))}
                </div>

                <div className="mt-3">
                  <Link
                    to={`/invoice/${order.orderId}?email=${encodeURIComponent(order.email)}`}
                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 hover:text-brandAccent"
                  >
                    <Printer size={13} /> View / print invoice
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOrders;
