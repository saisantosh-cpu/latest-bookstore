import React from 'react';

const shimmer = 'animate-pulse bg-[#EAE0D1] dark:bg-[#2A2A33]';

/** Matches BookCard's layout so the grid doesn't jump when real data arrives. */
export const BookCardSkeleton = () => (
  <div className="flex flex-col">
    <div className={`aspect-[2/3] rounded ${shimmer}`} />
    <div className={`h-3 w-3/4 rounded mt-3 ${shimmer}`} />
    <div className={`h-2.5 w-1/2 rounded mt-2 ${shimmer}`} />
    <div className={`h-3 w-1/3 rounded mt-2 ${shimmer}`} />
  </div>
);

export const BookGridSkeleton = ({ count = 8 }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6">
    {Array.from({ length: count }).map((_, i) => <BookCardSkeleton key={i} />)}
  </div>
);

/** A generic row skeleton for admin tables / order lists. */
export const RowSkeleton = ({ height = 'h-16' }) => (
  <div className={`w-full ${height} ${shimmer} rounded-xl`} />
);

export const TableSkeleton = ({ rows = 5 }) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, i) => <RowSkeleton key={i} />)}
  </div>
);

/** Small stat-card skeleton, used on dashboards/analytics. */
export const StatCardSkeleton = () => (
  <div className="bg-white dark:bg-darkZincAlt rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
    <div className={`h-3 w-16 rounded mb-3 ${shimmer}`} />
    <div className={`h-6 w-20 rounded ${shimmer}`} />
  </div>
);
