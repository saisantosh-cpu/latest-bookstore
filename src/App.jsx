import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Context Providers
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { BookProvider } from './context/BookContext';
import { OrderProvider } from './context/OrderContext';
import { CouponProvider } from './context/CouponContext';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Home from './pages/Home';
import BookListing from './pages/BookListing';
import BookDetail from './pages/BookDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Auth from './pages/Auth';
import UserProfile from './pages/UserProfile';
import AdminDashboard from './pages/AdminDashboard';
import AdminAnalytics from './pages/AdminAnalytics';
import OrderInvoice from './pages/OrderInvoice';
import Contact from './pages/Contact';

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <BookProvider>
            <OrderProvider>
            <CouponProvider>
              <BrowserRouter>
            <div className="flex flex-col min-h-screen bg-[#FAF6EE] dark:bg-[#121215] text-[#1C1A18] dark:text-[#F5F3EF] font-sans transition-colors duration-300">
              <div className="print:hidden">
                <Navbar />
              </div>
              <main className="flex-grow max-w-[1240px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<Home />} />
                  <Route path="/books" element={<BookListing />} />
                  {/* Explicit catalog paths take precedence over a product id. */}
                  <Route path="/books/school" element={<BookListing />} />
                  <Route path="/books/school/:schoolClass" element={<BookListing />} />
                  <Route path="/books/degree" element={<BookListing />} />
                  <Route path="/books/engineering" element={<BookListing />} />
                  <Route path="/books/medical" element={<BookListing />} />
                  <Route path="/books/medical/:equipment" element={<BookListing />} />
                  <Route path="/books/intermediate" element={<BookListing />} />
                  <Route path="/books/intermediate/:year" element={<BookListing />} />
                  <Route path="/books/intermediate/:year/:stream" element={<BookListing />} />
                  <Route path="/books/intermediate/:year/:stream/:exam" element={<BookListing />} />
                  <Route path="/books/competitive" element={<BookListing />} />
                  <Route path="/books/competitive/:exam" element={<BookListing />} />
                  <Route path="/books/competitive/:exam/:topic" element={<BookListing />} />
                  <Route path="/stationery/*" element={<BookListing />} />
                  <Route path="/essentials/*" element={<BookListing />} />
                  <Route path="/books/:id" element={<BookDetail />} />
                  <Route path="/login" element={<Auth />} />
                  <Route path="/cart" element={<Cart />} />
                  
                  {/* Checkout is open to guests too — no login required */}
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/invoice/:orderId" element={<OrderInvoice />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/profile" element={
                    <ProtectedRoute>
                      <UserProfile />
                    </ProtectedRoute>
                  } />
                  
                  {/* Protected Admin Routes */}
                  <Route path="/admin/dashboard" element={
                    <ProtectedRoute requireAdmin={true}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  } />

                  <Route path="/admin/analytics" element={
                    <ProtectedRoute requireAdmin={true}>
                      <AdminAnalytics />
                    </ProtectedRoute>
                  } />

                  {/* Catch all */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
              <div className="print:hidden">
                <Footer />
              </div>
            </div>
            </BrowserRouter>
            </CouponProvider>
            </OrderProvider>
          </BookProvider>
        </WishlistProvider>
        </CartProvider>
      </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
