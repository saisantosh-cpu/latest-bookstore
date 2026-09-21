import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Consistent empty state: icon, short message, optional CTA. Used for empty
 * cart/wishlist, no search results, no orders, no admin data, etc.
 */
const EmptyState = ({ icon: Icon, title, description, actionLabel, actionTo, onAction }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4">
      {Icon && (
        <div className="w-14 h-14 rounded-full bg-[#F2EAE0] dark:bg-[#22222B] flex items-center justify-center mb-4">
          <Icon size={24} className="text-[#877F74] dark:text-[#8E887E]" />
        </div>
      )}
      <p className="font-serif text-lg font-semibold text-[#1C1A18] dark:text-[#F5F3EF]">{title}</p>
      {description && (
        <p className="text-sm text-[#877F74] dark:text-[#8E887E] mt-1.5 max-w-xs">{description}</p>
      )}
      {actionLabel && (actionTo || onAction) && (
        actionTo ? (
          <Link
            to={actionTo}
            className="mt-6 inline-flex items-center px-6 py-2.5 bg-[#1C1A18] hover:bg-[#2E2A27] dark:bg-[#F5F3EF] dark:hover:bg-white text-[#FAF6EE] dark:text-[#1C1A18] text-xs font-semibold uppercase tracking-wider rounded transition-colors"
          >
            {actionLabel}
          </Link>
        ) : (
          <button
            onClick={onAction}
            className="mt-6 inline-flex items-center px-6 py-2.5 bg-[#1C1A18] hover:bg-[#2E2A27] dark:bg-[#F5F3EF] dark:hover:bg-white text-[#FAF6EE] dark:text-[#1C1A18] text-xs font-semibold uppercase tracking-wider rounded transition-colors"
          >
            {actionLabel}
          </button>
        )
      )}
    </div>
  );
};

export default EmptyState;
