import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, IndianRupee, ShoppingBag, BookOpen, TrendingUp } from 'lucide-react';
import { useOrders } from '../context/OrderContext';
import { StatCardSkeleton, TableSkeleton } from '../components/Skeleton';

const STATUS_COLORS = {
  pending: '#F59E0B',
  confirmed: '#3B82F6',
  shipped: '#A855F7',
  delivered: '#22C55E',
  cancelled: '#EF4444',
};

const dayKey = (date) => date.toISOString().slice(0, 10);

const AdminAnalytics = () => {
  const { orders, ordersLoading } = useOrders();

  const stats = useMemo(() => {
    // Only "confirmed" orders represent real, completed sales — orders
    // still awaiting payment (pending_payment) or cancelled/refund-flagged
    // never counted as revenue or units sold.
    const nonCancelled = orders.filter((o) => o.status === 'confirmed');

    const totalRevenue = nonCancelled.reduce((sum, o) => sum + (o.total || 0), 0);
    const totalOrders = orders.length;
    const totalBooksSold = nonCancelled.reduce(
      (sum, o) => sum + (o.items || []).reduce((s, i) => s + (i.quantity || 0), 0),
      0
    );
    const avgOrderValue = nonCancelled.length ? totalRevenue / nonCancelled.length : 0;

    // Today / this month breakdown
    const now = new Date();
    const todayKey = dayKey(now);
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const ordersToday = orders.filter((o) => o.createdAt?.toDate && dayKey(o.createdAt.toDate()) === todayKey);
    const ordersThisMonth = orders.filter((o) => {
      if (!o.createdAt?.toDate) return false;
      const d = o.createdAt.toDate();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === monthKey;
    });
    const revenueToday = ordersToday.filter((o) => o.status === 'confirmed').reduce((sum, o) => sum + (o.total || 0), 0);
    const revenueThisMonth = ordersThisMonth.filter((o) => o.status === 'confirmed').reduce((sum, o) => sum + (o.total || 0), 0);

    // Orders by status
    const statusCounts = {};
    orders.forEach((o) => {
      const status = o.status || 'pending';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    // Top-selling books
    const bookTotals = {};
    nonCancelled.forEach((o) => {
      (o.items || []).forEach((item) => {
        if (!bookTotals[item.title]) bookTotals[item.title] = { title: item.title, qty: 0, revenue: 0 };
        bookTotals[item.title].qty += item.quantity || 0;
        bookTotals[item.title].revenue += (item.price || 0) * (item.quantity || 0);
      });
    });
    const topBooks = Object.values(bookTotals).sort((a, b) => b.qty - a.qty).slice(0, 5);

    // Revenue for the last 14 days
    const days = [];
    const today = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      days.push({ key: dayKey(d), label: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), revenue: 0 });
    }
    const dayMap = Object.fromEntries(days.map((d) => [d.key, d]));
    nonCancelled.forEach((o) => {
      if (!o.createdAt?.toDate) return;
      const key = dayKey(o.createdAt.toDate());
      if (dayMap[key]) dayMap[key].revenue += o.total || 0;
    });

    return {
      totalRevenue,
      totalOrders,
      totalBooksSold,
      avgOrderValue,
      statusCounts,
      topBooks,
      days,
      ordersToday: ordersToday.length,
      ordersThisMonth: ordersThisMonth.length,
      revenueToday,
      revenueThisMonth,
    };
  }, [orders]);

  const maxDayRevenue = Math.max(1, ...stats.days.map((d) => d.revenue));

  if (ordersLoading) {
    return (
      <div className="pb-16 font-roboto">
        <div className="h-4 w-24 bg-[#EAE0D1] dark:bg-[#2A2A33] rounded animate-pulse mb-6" />
        <div className="h-8 w-40 bg-[#EAE0D1] dark:bg-[#2A2A33] rounded animate-pulse mb-8" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
        <TableSkeleton rows={4} />
      </div>
    );
  }

  return (
    <div className="pb-16 font-roboto">
      <Link to="/profile" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-brandAccent mb-4">
        <ArrowLeft size={15} /> Back to account
      </Link>

      <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-1">Analytics</h1>
      <p className="text-gray-500 dark:text-gray-400 font-medium mb-8">
        Store performance at a glance. Cancelled orders are excluded from revenue and books sold.
      </p>

      {/* Top metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-darkZincAlt rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
          <div className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">
            <IndianRupee size={14} /> Revenue
          </div>
          <p className="text-2xl font-black text-gray-900 dark:text-white">₹{stats.totalRevenue.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-white dark:bg-darkZincAlt rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
          <div className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">
            <ShoppingBag size={14} /> Total orders
          </div>
          <p className="text-2xl font-black text-gray-900 dark:text-white">{stats.totalOrders}</p>
        </div>
        <div className="bg-white dark:bg-darkZincAlt rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
          <div className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">
            <BookOpen size={14} /> Books sold
          </div>
          <p className="text-2xl font-black text-gray-900 dark:text-white">{stats.totalBooksSold}</p>
        </div>
        <div className="bg-white dark:bg-darkZincAlt rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
          <div className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">
            <TrendingUp size={14} /> Avg order value
          </div>
          <p className="text-2xl font-black text-gray-900 dark:text-white">₹{Math.round(stats.avgOrderValue).toLocaleString('en-IN')}</p>
        </div>
      </div>

      {/* Today / This month */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white dark:bg-darkZincAlt rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Today</p>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-[11px] text-gray-400">Orders</p>
              <p className="text-xl font-black text-gray-900 dark:text-white">{stats.ordersToday}</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-gray-400">Revenue</p>
              <p className="text-xl font-black text-gray-900 dark:text-white">₹{stats.revenueToday.toLocaleString('en-IN')}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-darkZincAlt rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">This month</p>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-[11px] text-gray-400">Orders</p>
              <p className="text-xl font-black text-gray-900 dark:text-white">{stats.ordersThisMonth}</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-gray-400">Revenue</p>
              <p className="text-xl font-black text-gray-900 dark:text-white">₹{stats.revenueThisMonth.toLocaleString('en-IN')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue chart */}
        <div className="bg-white dark:bg-darkZincAlt rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Revenue — last 14 days</h2>
          <div className="flex items-end gap-1.5 h-40">
            {stats.days.map((d) => (
              <div key={d.key} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                <div
                  className="w-full bg-brandAccent/80 hover:bg-brandAccent rounded-t transition-colors"
                  style={{ height: `${(d.revenue / maxDayRevenue) * 100}%`, minHeight: d.revenue > 0 ? '3px' : '0' }}
                  title={`${d.label}: ₹${d.revenue.toLocaleString('en-IN')}`}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-[9px] text-gray-400">
            <span>{stats.days[0]?.label}</span>
            <span>{stats.days[stats.days.length - 1]?.label}</span>
          </div>
        </div>

        {/* Orders by status */}
        <div className="bg-white dark:bg-darkZincAlt rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Orders by status</h2>
          <div className="space-y-3">
            {Object.entries(stats.statusCounts).length === 0 && (
              <p className="text-sm text-gray-400">No orders yet.</p>
            )}
            {Object.entries(stats.statusCounts).map(([status, count]) => (
              <div key={status}>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="capitalize text-gray-700 dark:text-gray-300">{status}</span>
                  <span className="text-gray-500">{count}</span>
                </div>
                <div className="w-full h-2 bg-gray-100 dark:bg-darkZinc rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(count / stats.totalOrders) * 100}%`,
                      backgroundColor: STATUS_COLORS[status] || '#9CA3AF',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top-selling books */}
        <div className="bg-white dark:bg-darkZincAlt rounded-2xl border border-gray-100 dark:border-gray-800 p-5 lg:col-span-2">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Best-selling books</h2>
          {stats.topBooks.length === 0 ? (
            <p className="text-sm text-gray-400">No sales yet.</p>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {stats.topBooks.map((book, idx) => (
                <div key={book.title} className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-3">
                    <span className="w-5 text-xs font-bold text-gray-400">{idx + 1}</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{book.title}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>{book.qty} sold</span>
                    <span className="font-bold text-gray-900 dark:text-white">₹{book.revenue.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
