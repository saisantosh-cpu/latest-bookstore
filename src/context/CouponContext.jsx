import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase/config';

const CouponContext = createContext();
const COUPONS_COLLECTION = 'coupons';

const DEFAULT_COUPONS = [
  { code: 'FIRST10', percent: 10, label: '10% off — first order', active: true, firstOrderOnly: true, usageCount: 0 },
  { code: 'WELCOME50', percent: 50, label: '50% off — welcome offer', active: true, firstOrderOnly: true, usageCount: 0 },
  { code: 'BOOKLOVER20', percent: 20, label: '20% off — book lover special', active: true, usageCount: 0 },
];

export const CouponProvider = ({ children }) => {
  const [coupons, setCoupons] = useState(() => {
    if (isFirebaseConfigured) return [];
    const saved = localStorage.getItem('nova_coupons');
    return saved ? JSON.parse(saved) : DEFAULT_COUPONS;
  });
  const [couponsLoading, setCouponsLoading] = useState(isFirebaseConfigured);
  const hasSeeded = useRef(false);

  useEffect(() => {
    if (!isFirebaseConfigured) return;

    const unsubscribe = onSnapshot(
      collection(db, COUPONS_COLLECTION),
      async (snapshot) => {
        if (snapshot.empty && !hasSeeded.current) {
          hasSeeded.current = true;
          const batch = writeBatch(db);
          DEFAULT_COUPONS.forEach((coupon) => {
            batch.set(doc(db, COUPONS_COLLECTION, coupon.code), { ...coupon, createdAt: serverTimestamp() });
          });
          await batch.commit().catch((err) => console.error('Failed to seed coupons:', err));
          return; // the batch write triggers another snapshot with the data
        }
        setCoupons(snapshot.docs.map((d) => ({ ...d.data(), id: d.id })));
        setCouponsLoading(false);
      },
      (error) => {
        console.error('Failed to subscribe to coupons:', error);
        setCouponsLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const addCoupon = async ({ code, percent, label, usageLimit, perUserLimit, minOrderAmount, maxDiscount, expiryDate, firstOrderOnly }) => {
    const normalizedCode = code.trim().toUpperCase();
    const newCoupon = {
      code: normalizedCode,
      percent: Number(percent),
      label: label || '',
      active: true,
      usageCount: 0,
      ...(usageLimit ? { usageLimit: Number(usageLimit) } : {}),
      ...(perUserLimit ? { perUserLimit: Number(perUserLimit) } : {}),
      ...(minOrderAmount ? { minOrderAmount: Number(minOrderAmount) } : {}),
      ...(maxDiscount ? { maxDiscount: Number(maxDiscount) } : {}),
      ...(expiryDate ? { expiryDate: new Date(expiryDate) } : {}),
      ...(firstOrderOnly ? { firstOrderOnly: true } : {}),
    };

    if (!isFirebaseConfigured) {
      setCoupons((prev) => {
        const next = [...prev.filter((c) => c.code !== normalizedCode), newCoupon];
        localStorage.setItem('nova_coupons', JSON.stringify(next));
        return next;
      });
      return;
    }
    await setDoc(doc(db, COUPONS_COLLECTION, normalizedCode), { ...newCoupon, createdAt: serverTimestamp() });
  };

  const toggleCouponActive = async (coupon) => {
    const updated = { ...coupon, active: !coupon.active };
    if (!isFirebaseConfigured) {
      setCoupons((prev) => {
        const next = prev.map((c) => (c.code === coupon.code ? updated : c));
        localStorage.setItem('nova_coupons', JSON.stringify(next));
        return next;
      });
      return;
    }
    await setDoc(doc(db, COUPONS_COLLECTION, coupon.code), updated, { merge: true });
  };

  const deleteCoupon = async (coupon) => {
    if (!isFirebaseConfigured) {
      setCoupons((prev) => {
        const next = prev.filter((c) => c.code !== coupon.code);
        localStorage.setItem('nova_coupons', JSON.stringify(next));
        return next;
      });
      return;
    }
    await deleteDoc(doc(db, COUPONS_COLLECTION, coupon.code));
  };

  const validateCoupon = (codeInput) => {
    if (!codeInput) return null;
    const target = codeInput.trim().toUpperCase();
    const match = coupons.find((c) => c.code === target && c.active);
    return match || null;
  };

  return (
    <CouponContext.Provider value={{ coupons, couponsLoading, addCoupon, toggleCouponActive, deleteCoupon, validateCoupon }}>
      {children}
    </CouponContext.Provider>
  );
};

export const useCoupons = () => useContext(CouponContext);
