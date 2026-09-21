import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useOrders } from '../context/OrderContext';
import { useToast } from '../context/ToastContext';
import { 
  User, 
  Package, 
  Heart, 
  Settings, 
  LogOut, 
  Shield, 
  ArrowRight, 
  ShoppingBag, 
  BookOpen,
  Calendar,
  CheckCircle2,
  XCircle,
  BarChart3,
  Printer
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';
import OrderStatusTimeline from '../components/OrderStatusTimeline';

const CANCELLABLE_STATUSES = ['confirmed'];

const formatOrderDate = (createdAt) => {
  if (createdAt?.toDate) {
    return createdAt.toDate().toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
  }
  return '—';
};

const UserProfile = () => {
  const { user, logout, isAdmin } = useAuth();
  const { wishlist, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { orders: allOrders, updateOrderStatus } = useOrders();
  const toast = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('profile');

  // This customer's orders, pulled live from the same Firestore data the
  // admin dashboard uses — matched by email so it works on any device.
  const orders = useMemo(() => {
    if (!user?.email) return [];
    return allOrders.filter((o) => o.email?.toLowerCase() === user.email.toLowerCase());
  }, [allOrders, user?.email]);

  const handleCancelOrder = async (order) => {
    if (!window.confirm(`Cancel order ${order.orderId}? This can't be undone.`)) return;
    try {
      const result = await updateOrderStatus(order.id, 'cancelled');
      if (result?.refunded) {
        toast?.show('Order cancelled — your refund has been issued.', 'success', 7000);
      } else if (result?.warning) {
        toast?.show(result.warning, 'info', 8000);
      } else {
        toast?.show('Order cancelled.', 'success');
      }
    } catch (err) {
      console.error('Failed to cancel order:', err);
      toast?.show(err.message || 'Could not cancel the order. Please try again.', 'error', 6000);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleWishlistAddToCart = (book) => {
    addToCart(book);
  };

  if (!user) return null;

  return (
    <div className="max-w-5xl mx-auto pb-20 font-sans">
      
      {/* Header */}
      <div className="mb-8 pb-4 border-b border-[#DCD0BF]/70 dark:border-[#2A2A33]">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#1C1A18] dark:text-[#F5F3EF]">
          Reader Account & Settings
        </h1>
        <p className="text-xs sm:text-sm text-[#877F74] dark:text-[#8E887E] mt-0.5">
          Manage your personal details, reading wishlist, and order history
        </p>
      </div>
      
      <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
        
        {/* Account Sidebar Navigation */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <div className="bg-[#FFFFFF] dark:bg-[#1A1A20] rounded border border-[#EDE4D8] dark:border-[#2A2A33] p-5 shadow-sm space-y-6">
            
            {/* User Avatar Info */}
            <div className="flex items-center gap-3.5 pb-5 border-b border-[#EDE4D8] dark:border-[#2A2A33]">
              <div className="w-12 h-12 rounded bg-[#1C1A18] text-[#FAF6EE] dark:bg-[#FAF6EE] dark:text-[#1C1A18] flex items-center justify-center font-serif font-bold text-xl flex-shrink-0">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-serif font-bold text-base text-[#1C1A18] dark:text-[#F5F3EF] truncate">
                  {user.name}
                </h2>
                <p className="text-xs text-[#877F74] dark:text-[#8E887E] truncate">{user.email}</p>
                {isAdmin && (
                  <span className="inline-block mt-1 text-[9px] font-bold uppercase tracking-wider text-[#C85A32] bg-[#FAF6EE] dark:bg-[#22222B] px-1.5 py-0.2 rounded border border-[#C85A32]/30">
                    Administrator
                  </span>
                )}
              </div>
            </div>
            
            {/* Nav Tabs */}
            <nav className="space-y-1 text-xs font-medium">
              <button 
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center justify-between p-2.5 rounded transition-colors text-left ${
                  activeTab === 'profile' 
                    ? 'bg-[#1C1A18] text-[#FAF6EE] dark:bg-[#FAF6EE] dark:text-[#1C1A18] font-semibold' 
                    : 'text-[#575047] dark:text-[#CBC4B8] hover:bg-[#FAF6EE] dark:hover:bg-[#22222B]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <User size={15} />
                  <span>Personal Details</span>
                </div>
              </button>

              <button 
                onClick={() => setActiveTab('orders')}
                className={`w-full flex items-center justify-between p-2.5 rounded transition-colors text-left ${
                  activeTab === 'orders' 
                    ? 'bg-[#1C1A18] text-[#FAF6EE] dark:bg-[#FAF6EE] dark:text-[#1C1A18] font-semibold' 
                    : 'text-[#575047] dark:text-[#CBC4B8] hover:bg-[#FAF6EE] dark:hover:bg-[#22222B]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Package size={15} />
                  <span>Order History</span>
                </div>
                {orders.length > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#C85A32] text-white">
                    {orders.length}
                  </span>
                )}
              </button>

              <button 
                onClick={() => setActiveTab('wishlist')}
                className={`w-full flex items-center justify-between p-2.5 rounded transition-colors text-left ${
                  activeTab === 'wishlist' 
                    ? 'bg-[#1C1A18] text-[#FAF6EE] dark:bg-[#FAF6EE] dark:text-[#1C1A18] font-semibold' 
                    : 'text-[#575047] dark:text-[#CBC4B8] hover:bg-[#FAF6EE] dark:hover:bg-[#22222B]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Heart size={15} />
                  <span>Saved Wishlist</span>
                </div>
                {wishlist.length > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#C85A32] text-white">
                    {wishlist.length}
                  </span>
                )}
              </button>

              {isAdmin && (
                <Link
                  to="/admin/dashboard"
                  className="w-full flex items-center gap-2.5 p-2.5 text-[#C85A32] dark:text-[#E06F45] hover:bg-[#FAF6EE] dark:hover:bg-[#22222B] rounded transition-colors"
                >
                  <Shield size={15} />
                  <span>Admin Panel</span>
                </Link>
              )}

              {isAdmin && (
                <Link
                  to="/admin/analytics"
                  className="w-full flex items-center gap-2.5 p-2.5 text-[#C85A32] dark:text-[#E06F45] hover:bg-[#FAF6EE] dark:hover:bg-[#22222B] rounded transition-colors"
                >
                  <BarChart3 size={15} />
                  <span>View Analytics</span>
                </Link>
              )}

              <div className="pt-4 border-t border-[#EDE4D8] dark:border-[#2A2A33] my-2"></div>

              <button 
                onClick={handleLogout} 
                className="w-full flex items-center gap-2.5 p-2.5 text-[#877F74] hover:text-red-600 dark:hover:text-red-400 rounded hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors text-left"
              >
                <LogOut size={15} />
                <span>Sign Out</span>
              </button>
            </nav>

          </div>
        </aside>
        
        {/* Main Content Pane */}
        <main className="flex-1 w-full">
          
          {/* TAB 1: Profile Information */}
          {activeTab === 'profile' && (
            <div className="bg-[#FFFFFF] dark:bg-[#1A1A20] p-6 sm:p-8 rounded border border-[#EDE4D8] dark:border-[#2A2A33] shadow-sm space-y-6 animate-in fade-in duration-200">
              <h2 className="font-serif font-bold text-xl text-[#1C1A18] dark:text-[#F5F3EF] pb-3 border-b border-[#EDE4D8] dark:border-[#2A2A33]">
                Reader Profile
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="block font-semibold uppercase tracking-wider text-[#877F74] mb-1">Full Name</span>
                  <div className="p-3 bg-[#FAF6EE] dark:bg-[#121215] text-[#1C1A18] dark:text-[#F5F3EF] font-medium rounded border border-[#EDE4D8] dark:border-[#363644]">
                    {user.name}
                  </div>
                </div>

                <div>
                  <span className="block font-semibold uppercase tracking-wider text-[#877F74] mb-1">Registered Email</span>
                  <div className="p-3 bg-[#FAF6EE] dark:bg-[#121215] text-[#1C1A18] dark:text-[#F5F3EF] font-medium rounded border border-[#EDE4D8] dark:border-[#363644]">
                    {user.email}
                  </div>
                </div>

                <div>
                  <span className="block font-semibold uppercase tracking-wider text-[#877F74] mb-1">Membership Status</span>
                  <div className="p-3 bg-[#FAF6EE] dark:bg-[#121215] text-[#1C1A18] dark:text-[#F5F3EF] font-medium rounded border border-[#EDE4D8] dark:border-[#363644] flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-[#2E7D32]" />
                    <span>Active Reader</span>
                  </div>
                </div>

                <div>
                  <span className="block font-semibold uppercase tracking-wider text-[#877F74] mb-1">Account Role</span>
                  <div className="p-3 bg-[#FAF6EE] dark:bg-[#121215] text-[#1C1A18] dark:text-[#F5F3EF] font-medium rounded border border-[#EDE4D8] dark:border-[#363644]">
                    {isAdmin ? 'Store Administrator' : 'Standard Customer'}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#EDE4D8] dark:border-[#2A2A33]">
                <p className="text-xs text-[#877F74]">
                  Need help updating your account credentials? Please contact the store using the details on our Contact page.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: Order History */}
          {activeTab === 'orders' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex justify-between items-baseline pb-2 border-b border-[#DCD0BF]/70 dark:border-[#2A2A33]">
                <h2 className="font-serif font-bold text-xl text-[#1C1A18] dark:text-[#F5F3EF]">
                  Order History
                </h2>
                <span className="text-xs text-[#877F74]">{orders.length} {orders.length === 1 ? 'order' : 'orders'} placed</span>
              </div>

              {orders.length === 0 ? (
                <div className="bg-[#FFFFFF] dark:bg-[#1A1A20] p-10 rounded border border-[#EDE4D8] dark:border-[#2A2A33] text-center space-y-4 shadow-sm">
                  <div className="w-12 h-12 rounded-full bg-[#FAF6EE] dark:bg-[#121215] flex items-center justify-center text-[#877F74] mx-auto">
                    <Package size={22} />
                  </div>
                  <h3 className="font-serif font-bold text-lg text-[#1C1A18] dark:text-[#F5F3EF]">No orders placed yet</h3>
                  <p className="text-xs text-[#575047] dark:text-[#CBC4B8] max-w-sm mx-auto">
                    Your bookshelf awaits. Start exploring our collection to find your first volumes.
                  </p>
                  <Link 
                    to="/books" 
                    className="inline-block px-5 py-2.5 bg-[#1C1A18] hover:bg-[#2E2A27] text-[#FAF6EE] dark:bg-[#FAF6EE] dark:text-[#1C1A18] text-xs font-semibold uppercase tracking-wider rounded"
                  >
                    Browse The Stacks
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div 
                      key={order.id}
                      className="bg-[#FFFFFF] dark:bg-[#1A1A20] rounded border border-[#EDE4D8] dark:border-[#2A2A33] p-5 shadow-sm space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center pb-3 border-b border-[#EDE4D8] dark:border-[#2A2A33] text-xs gap-2">
                        <div>
                          <span className="font-mono font-bold text-sm text-[#1C1A18] dark:text-[#F5F3EF] block">
                            {order.orderId}
                          </span>
                          <span className="text-[#877F74] flex items-center gap-1 mt-0.5">
                            <Calendar size={12} /> Placed on {formatOrderDate(order.createdAt)}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="font-serif font-bold text-base text-[#1C1A18] dark:text-[#F5F3EF] block">
                            ₹{(order.total || 0).toLocaleString('en-IN')}
                          </span>
                          <span className="inline-block">
                            <StatusBadge status={order.status} />
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {(order.items || []).map((item) => (
                          <div key={item.id} className="flex justify-between items-center text-xs text-[#575047] dark:text-[#CBC4B8]">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[#877F74]">{item.quantity}x</span>
                              <span className="font-medium text-[#1C1A18] dark:text-[#F5F3EF]">{item.title}{item.selectedSize ? ` (Size: ${item.selectedSize})` : ''}</span>
                            </div>
                            <span className="font-mono">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-3 pb-1 border-t border-[#EDE4D8] dark:border-[#2A2A33]">
                        <OrderStatusTimeline status={order.status} />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-[#877F74] dark:text-[#8E887E] pt-1">
                        <div>
                          <span className="font-semibold text-[#575047] dark:text-[#CBC4B8]">Ship to: </span>
                          {order.address}, {order.city} {order.zip}
                        </div>
                        <div>
                          <span className="font-semibold text-[#575047] dark:text-[#CBC4B8]">Payment: </span>
                          {order.paymentMethod === 'cod' ? 'Cash on Delivery' : (order.paymentMethod || '—').toUpperCase()}
                          {' · '}
                          <span className="capitalize">{(order.paymentStatus || '—').replace(/_/g, ' ')}</span>
                        </div>
                      </div>

                      <div className="pt-1 flex items-center gap-4">
                        <Link
                          to={`/invoice/${order.orderId}?email=${encodeURIComponent(order.email)}`}
                          className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#877F74] hover:text-[#1C1A18] dark:hover:text-[#F5F3EF]"
                        >
                          <Printer size={13} /> Print invoice
                        </Link>
                        {CANCELLABLE_STATUSES.includes(order.status) && (
                          <button
                            onClick={() => handleCancelOrder(order)}
                            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <XCircle size={13} /> Cancel this order
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Saved Wishlist */}
          {activeTab === 'wishlist' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex justify-between items-baseline pb-2 border-b border-[#DCD0BF]/70 dark:border-[#2A2A33]">
                <h2 className="font-serif font-bold text-xl text-[#1C1A18] dark:text-[#F5F3EF]">
                  Saved Wishlist
                </h2>
                <span className="text-xs text-[#877F74]">{wishlist.length} {wishlist.length === 1 ? 'title' : 'titles'}</span>
              </div>

              {wishlist.length === 0 ? (
                <div className="bg-[#FFFFFF] dark:bg-[#1A1A20] p-10 rounded border border-[#EDE4D8] dark:border-[#2A2A33] text-center space-y-4 shadow-sm">
                  <div className="w-12 h-12 rounded-full bg-[#FAF6EE] dark:bg-[#121215] flex items-center justify-center text-[#877F74] mx-auto">
                    <Heart size={22} />
                  </div>
                  <h3 className="font-serif font-bold text-lg text-[#1C1A18] dark:text-[#F5F3EF]">Your reading wishlist is empty</h3>
                  <p className="text-xs text-[#575047] dark:text-[#CBC4B8] max-w-sm mx-auto">
                    Save editions you plan to read by clicking the bookmark or heart icon across the bookstore.
                  </p>
                  <Link 
                    to="/books" 
                    className="inline-block px-5 py-2.5 bg-[#1C1A18] hover:bg-[#2E2A27] text-[#FAF6EE] dark:bg-[#FAF6EE] dark:text-[#1C1A18] text-xs font-semibold uppercase tracking-wider rounded"
                  >
                    Discover Books
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {wishlist.map((book) => (
                    <div 
                      key={book.id}
                      className="bg-[#FFFFFF] dark:bg-[#1A1A20] rounded border border-[#EDE4D8] dark:border-[#2A2A33] p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <Link to={`/books/${book.id}`}>
                          <div className="w-12 h-16 rounded-sm overflow-hidden book-spine shadow-sm bg-[#FAF6EE] flex-shrink-0">
                            <img src={book.image} alt={book.title} className="w-full h-full object-cover" />
                          </div>
                        </Link>
                        <div>
                          <Link to={`/books/${book.id}`} className="hover:text-[#C85A32] transition-colors">
                            <h4 className="font-serif font-bold text-sm text-[#1C1A18] dark:text-[#F5F3EF] line-clamp-1">
                              {book.title}
                            </h4>
                          </Link>
                          <p className="text-xs text-[#877F74]">By {book.author}</p>
                          <span className="font-serif font-bold text-xs text-[#1C1A18] dark:text-[#F5F3EF] mt-0.5 block">
                            ₹{Number(book.price).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                          onClick={() => handleWishlistAddToCart(book)}
                          className="px-3.5 py-1.5 bg-[#FAF6EE] hover:bg-[#C85A32] text-[#1C1A18] hover:text-[#FAF6EE] dark:bg-[#22222B] dark:text-[#F5F3EF] dark:hover:bg-[#C85A32] dark:hover:text-white border border-[#DCD0BF] hover:border-transparent dark:border-[#363644] text-xs font-semibold uppercase rounded transition-colors inline-flex items-center gap-1.5"
                        >
                          <ShoppingBag size={13} />
                          <span>Add to Cart</span>
                        </button>
                        <button
                          onClick={() => removeFromWishlist(book.id)}
                          className="px-2.5 py-1.5 text-xs text-[#877F74] hover:text-red-600 transition-colors"
                          aria-label="Remove from wishlist"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </main>
      </div>
    </div>
  );
};

export default UserProfile;
