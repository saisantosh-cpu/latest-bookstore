import React from 'react';

const STATUS_CONFIG = {
  pending_payment: { label: 'Pending Payment', className: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border-amber-200 dark:border-amber-800/50' },
  confirmed: { label: 'Confirmed', className: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800/50' },
  shipped: { label: 'Shipped', className: 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400 border-purple-200 dark:border-purple-800/50' },
  delivered: { label: 'Delivered', className: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800/50' },
  cancelled: { label: 'Cancelled', className: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-800/50' },
  stock_conflict_needs_refund: { label: 'Needs Refund', className: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-800/50' },
};

/**
 * Consistent order-status pill used across Order History, Admin Orders,
 * and the invoice page — same colors/labels everywhere instead of each
 * page inventing its own.
 */
const StatusBadge = ({ status, size = 'sm' }) => {
  const config = STATUS_CONFIG[status] || { label: (status || 'Unknown').replace(/_/g, ' '), className: 'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700' };
  const sizeClasses = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span className={`inline-flex items-center font-bold uppercase tracking-wider rounded border ${sizeClasses} ${config.className}`}>
      {config.label}
    </span>
  );
};

export default StatusBadge;
