import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { db, auth, isFirebaseConfigured } from '../firebase/config';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const OrderContext = createContext();

// Strip everything except digits so "+91 98765-43210", "9876543210" etc
// all match the same customer when searching by phone.
export const normalizePhone = (phone) => (phone || '').replace(/\D/g, '');

const LAST_SEEN_KEY = 'nova_admin_orders_last_seen';

export const OrderProvider = ({ children }) => {
  const { user, isAdmin } = useAuth();
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const toast = useToast();
  const isFirstSnapshot = useRef(true);
  const knownIds = useRef(new Set());

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setOrdersLoading(false);
      return;
    }

    // Privacy/performance: nobody except admins loads the ENTIRE orders
    // collection. A logged-in customer only ever subscribes to their own
    // orders (queried server-side by uid — not filtered client-side after
    // the fact). A guest/logged-out visitor gets no order listener at all.
    let q;
    if (isAdmin) {
      q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    } else if (user?.uid) {
      q = query(collection(db, 'orders'), where('uid', '==', user.uid), orderBy('createdAt', 'desc'));
    } else {
      setOrders([]);
      setOrdersLoading(false);
      isFirstSnapshot.current = true;
      knownIds.current = new Set();
      return;
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const nextOrders = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setOrders(nextOrders);
        setOrdersLoading(false);

        // Only admins get "new order" notifications — this used to fire for
        // every visitor watching the whole collection, which was both a
        // privacy leak and needless load.
        if (isAdmin) {
          const newlyArrived = nextOrders.filter((o) => !knownIds.current.has(o.id));
          nextOrders.forEach((o) => knownIds.current.add(o.id));

          if (!isFirstSnapshot.current && newlyArrived.length > 0) {
            newlyArrived.forEach((o) => {
              toast?.show(
                `New order from ${o.name || 'a customer'} — ₹${(o.total || 0).toLocaleString('en-IN')}`,
                'info'
              );
            });
            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
              newlyArrived.forEach((o) => {
                new Notification('New book order', {
                  body: `${o.name || 'A customer'} just placed an order for ₹${(o.total || 0).toLocaleString('en-IN')}`,
                });
              });
            }
          }
          isFirstSnapshot.current = false;

          const lastSeen = Number(localStorage.getItem(LAST_SEEN_KEY) || 0);
          const unread = nextOrders.filter((o) => {
            const createdMs = o.createdAt?.toMillis ? o.createdAt.toMillis() : 0;
            return createdMs > lastSeen;
          }).length;
          setUnreadCount(unread);
        }
      },
      (error) => {
        console.error('Failed to subscribe to orders:', error);
        setOrdersLoading(false);
      }
    );

    return () => unsubscribe();
  }, [isAdmin, user?.uid]);

  // Calls the server-side order-creation endpoint. Price, stock, and coupon
  // validity are all recalculated there from Firestore — nothing the client
  // sends for price/discount/total is trusted.
  const createOrder = async ({ items, couponCode, shippingInfo, paymentMethod, idempotencyKey }) => {
    const headers = { 'Content-Type': 'application/json' };
    if (auth?.currentUser) {
      const idToken = await auth.currentUser.getIdToken();
      headers.Authorization = `Bearer ${idToken}`;
    }
    const res = await fetch('/api/create-order', {
      method: 'POST',
      headers,
      body: JSON.stringify({ items, couponCode, shippingInfo, paymentMethod, idempotencyKey }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Could not place your order.');
    }
    return data; // { internalOrderId, orderId, status, total, razorpayOrderId?, razorpayKeyId?, demo? }
  };

  // Calls the server to independently verify a Razorpay payment before the
  // order is ever marked as paid.
  const verifyPayment = async ({ razorpay_order_id, razorpay_payment_id, razorpay_signature, internalOrderId }) => {
    const res = await fetch('/api/verify-razorpay-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ razorpay_order_id, razorpay_payment_id, razorpay_signature, internalOrderId }),
    });
    const data = await res.json();
    if (!res.ok || !data.verified) {
      throw new Error(data.error || 'Payment could not be verified.');
    }
    return data;
  };

  const updateOrderStatus = async (orderId, status) => {
    // Cancellation ALWAYS goes through the server, for customers and admins
    // alike: it has to restore book stock and (for paid orders) issue a
    // Razorpay refund, both of which are Admin-SDK-only operations.
    // Firestore rules now reject ALL client-side order updates from
    // non-admins, so a customer has no other path — they cannot flip their
    // own order to 'cancelled' from the browser console to skip the refund.
    if (status === 'cancelled') {
      const headers = { 'Content-Type': 'application/json' };
      if (auth?.currentUser) {
        const idToken = await auth.currentUser.getIdToken();
        headers.Authorization = `Bearer ${idToken}`;
      }
      const res = await fetch('/api/cancel-order', {
        method: 'POST',
        headers,
        body: JSON.stringify({ internalOrderId: orderId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Could not cancel the order.');
      }
      return data;
    }

    // Everything else (shipped, delivered, etc) is admin-only — the rules
    // reject this write for any non-admin caller.
    await updateDoc(doc(db, 'orders', orderId), { status });
  };

  const markOrdersSeen = () => {
    localStorage.setItem(LAST_SEEN_KEY, String(Date.now()));
    setUnreadCount(0);
  };

  const getOrdersByPhone = (phone) => {
    const target = normalizePhone(phone);
    if (!target) return [];
    return orders.filter((o) => (o.phoneNormalized || normalizePhone(o.phone)).includes(target));
  };

  return (
    <OrderContext.Provider
      value={{
        orders,
        ordersLoading,
        unreadCount,
        createOrder,
        verifyPayment,
        updateOrderStatus,
        markOrdersSeen,
        getOrdersByPhone,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => useContext(OrderContext);
