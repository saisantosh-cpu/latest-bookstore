import React from 'react';
import { Check, Circle, XCircle, RotateCcw } from 'lucide-react';

// These are the ONLY statuses this app actually sets (see api/create-order.js
// and api/verify-razorpay-payment.js) — the timeline below reflects the
// real order lifecycle, not a generic invented one.
const STEPS = ['confirmed', 'shipped', 'delivered'];
const STEP_LABELS = { confirmed: 'Confirmed', shipped: 'Shipped', delivered: 'Delivered' };

/**
 * Shows "Order Placed" (always complete once an order exists) followed by
 * the real fulfillment steps. Cancelled/refunded orders get a distinct
 * banner instead of a progress bar, since they're not a forward step.
 */
const OrderStatusTimeline = ({ status }) => {
  if (status === 'cancelled') {
    return (
      <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm font-semibold">
        <XCircle size={16} /> This order was cancelled.
      </div>
    );
  }

  if (status === 'stock_conflict_needs_refund') {
    return (
      <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm font-semibold">
        <RotateCcw size={16} /> A refund is being processed for this order.
      </div>
    );
  }

  const currentIndex = status === 'pending_payment' ? -1 : STEPS.indexOf(status);

  return (
    <div className="flex items-center w-full">
      <TimelineNode label="Order Placed" done />
      <Connector done={currentIndex >= 0} />
      {STEPS.map((step, idx) => (
        <React.Fragment key={step}>
          <TimelineNode label={STEP_LABELS[step]} done={currentIndex >= idx} current={currentIndex === idx} />
          {idx < STEPS.length - 1 && <Connector done={currentIndex > idx} />}
        </React.Fragment>
      ))}
    </div>
  );
};

const TimelineNode = ({ label, done, current }) => (
  <div className="flex flex-col items-center gap-1.5 shrink-0">
    <div
      className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors ${
        done
          ? 'bg-[#C85A32] border-[#C85A32] text-white'
          : 'bg-white dark:bg-[#1A1A20] border-[#DCD0BF] dark:border-[#363644] text-[#DCD0BF] dark:text-[#363644]'
      } ${current ? 'ring-4 ring-[#C85A32]/20' : ''}`}
    >
      {done ? <Check size={13} strokeWidth={3} /> : <Circle size={8} fill="currentColor" />}
    </div>
    <span className={`text-[10px] font-semibold text-center leading-tight max-w-[64px] ${done ? 'text-[#1C1A18] dark:text-[#F5F3EF]' : 'text-[#877F74] dark:text-[#8E887E]'}`}>
      {label}
    </span>
  </div>
);

const Connector = ({ done }) => (
  <div className={`flex-1 h-0.5 mb-4 min-w-[16px] ${done ? 'bg-[#C85A32]' : 'bg-[#DCD0BF] dark:bg-[#363644]'}`} />
);

export default OrderStatusTimeline;
