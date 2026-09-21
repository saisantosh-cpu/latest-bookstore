import React, { createContext, useState, useContext, useEffect } from 'react';
const CartContext = createContext();
export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('bookstore_cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });
  useEffect(() => {
    localStorage.setItem('bookstore_cart', JSON.stringify(cart));
  }, [cart]);
  const addToCart = (book, selectedSize) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === book.id && item.selectedSize === selectedSize);
      if (existing) {
        return prev.map(item =>
          item.id === book.id && item.selectedSize === selectedSize ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...book, selectedSize, quantity: 1 }];
    });
  };
  const removeFromCart = (bookId, selectedSize) => {
    setCart(prev => prev.filter(item => !(item.id === bookId && item.selectedSize === selectedSize)));
  };
  const updateQuantity = (bookId, quantity, selectedSize) => {
    if (quantity < 1) return;
    setCart(prev => prev.map(item =>
      item.id === bookId && item.selectedSize === selectedSize ? { ...item, quantity } : item
    ));
  };
  const clearCart = () => setCart([]);
  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };
  const getCartCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  };
  return (
    <CartContext.Provider value={{
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getCartTotal,
      getCartCount
    }}>
      {children}
    </CartContext.Provider>
  );
};
export const useCart = () => useContext(CartContext);