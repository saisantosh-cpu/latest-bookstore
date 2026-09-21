import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { businessInfo } from '../data/businessInfo';
import { 
  BookOpen, 
  ShoppingBag, 
  User, 
  Sun, 
  Moon, 
  LogOut, 
  Shield, 
  Heart, 
  Menu, 
  X, 
  Search,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import { useWishlist } from '../context/WishlistContext';
import { catalogNavigation } from '../data/catalog';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const { getCartCount } = useCart();
  const { wishlist } = useWishlist();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const profileRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const categoryMenuRef = useRef(null);

  // Close dropdowns on outside click or escape key
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target) && !event.target.closest('#mobile-menu-toggle')) {
        setIsMobileMenuOpen(false);
      }
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(event.target)) {
        setIsCategoryOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsProfileOpen(false);
        setIsMobileMenuOpen(false);
        categoryMenuRef.current?.removeAttribute('open');
        setIsCategoryOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsProfileOpen(false);
  }, [location.pathname]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    // Search always checks the ENTIRE catalog, regardless of which category
    // page you're currently browsing — so a search for something outside
    // the current section still finds it instead of coming up empty.
    if (searchQuery.trim()) {
      navigate(`/books?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsMobileMenuOpen(false);
    } else {
      navigate('/books');
    }
  };

  const handleLogout = () => {
    logout();
    setIsProfileOpen(false);
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  const cartCount = getCartCount();
  const wishlistCount = wishlist.length;

  return (
    <header className="sticky top-0 z-50 bg-[#FAF6EE]/95 dark:bg-[#121215]/95 backdrop-blur-md border-b border-[#E8DFC8]/60 dark:border-[#2A2A33] transition-colors duration-300">
      {/* Top Editorial Kicker Bar */}
      <div className="hidden sm:block border-b border-[#E8DFC8]/40 dark:border-[#22222B] text-[11px] uppercase tracking-widest text-[#78716C] dark:text-[#A8A29E] py-1 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1240px] mx-auto flex justify-between items-center font-sans">
          <span>Curated Contemporary & Classic Books</span>
          <div className="flex items-center gap-6">
            <span>Free Shipping on Orders Over ₹999</span>
            <span className="text-[#C85A32] font-semibold">Independent Bookseller</span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4 lg:gap-8">
          
          {/* Logo & Mobile Trigger */}
          <div className="flex items-center gap-3">
            <button 
              id="mobile-menu-toggle"
              className="lg:hidden p-2 -ml-2 text-[#575047] dark:text-[#CBC4B8] hover:text-[#C85A32] dark:hover:text-[#E06F45] transition-colors focus-visible:ring-1 focus-visible:ring-[#C85A32]"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <Link to="/" className="flex items-baseline gap-2.5 group outline-none">
              <div className="flex flex-col">
                <span className="font-serif font-bold text-lg sm:text-2xl lg:text-3xl tracking-tight text-[#1C1A18] dark:text-[#F5F3EF] group-hover:text-[#C85A32] dark:group-hover:text-[#E06F45] transition-colors whitespace-nowrap">
                  {businessInfo.storeName}
                </span>
                <span className="text-[9px] uppercase tracking-[0.25em] font-sans font-semibold text-[#877F74] dark:text-[#8E887E] -mt-1 hidden sm:block">
                  {businessInfo.establishedText}
                </span>
              </div>
            </Link>
          </div>

          {/* Prominent Search Bar (Desktop) */}
          <div className="hidden md:flex flex-1 max-w-md mx-2">
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search books, stationery, authors, or brands..."
                className="w-full bg-[#FFFFFF] dark:bg-[#1A1A20] text-[#1C1A18] dark:text-[#F5F3EF] placeholder-[#877F74] dark:placeholder-[#8E887E] text-sm pl-10 pr-10 py-2.5 rounded border border-[#DCD0BF] dark:border-[#363644] hover:border-[#B5A794] dark:hover:border-[#4F4F60] focus:border-[#C85A32] dark:focus:border-[#E06F45] transition-all"
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#877F74] dark:text-[#8E887E]" size={16} />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#877F74] hover:text-[#1C1A18] dark:hover:text-[#F5F3EF]"
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </form>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-6 text-sm font-sans font-medium text-[#575047] dark:text-[#CBC4B8]">
            <Link 
              to="/" 
              className={`py-1 border-b-2 transition-colors ${
                isActive('/') 
                  ? 'border-[#C85A32] text-[#1C1A18] dark:text-[#F5F3EF] font-semibold' 
                  : 'border-transparent hover:text-[#C85A32] dark:hover:text-[#E06F45]'
              }`}
            >
              Home
            </Link>
            <div
              ref={categoryMenuRef}
              className="relative"
              onMouseEnter={() => setIsCategoryOpen(true)}
              onMouseLeave={() => setIsCategoryOpen(false)}
            >
              <button
                type="button"
                onClick={() => setIsCategoryOpen((open) => !open)}
                aria-expanded={isCategoryOpen}
                className="cursor-pointer py-1 border-b-2 border-transparent hover:text-[#C85A32] dark:hover:text-[#E06F45] transition-colors"
              >
                Shop by Category
              </button>
              {isCategoryOpen && (
                <div
                  onClick={() => setIsCategoryOpen(false)}
                  className="absolute left-0 top-8 w-[34rem] max-h-[70vh] overflow-y-auto grid grid-cols-3 gap-4 p-4 bg-[#FFFFFF] dark:bg-[#1A1A20] border border-[#DCD0BF] dark:border-[#363644] rounded shadow-editorial z-50"
                >
                  {catalogNavigation.map((group) => (
                    <div key={group.label}>
                      <Link to={group.to} className="block font-serif font-bold text-[#1C1A18] dark:text-[#F5F3EF] hover:text-[#C85A32] mb-2">{group.label}</Link>
                      <div className="space-y-1.5">
                        {group.children?.map((item) => <React.Fragment key={item.to}>
                          <Link to={item.to} className="block text-xs hover:text-[#C85A32]">{item.label}</Link>
                          {item.children?.map((child) => <Link key={child.to} to={child.to} className="block pl-3 text-[11px] text-[#877F74] hover:text-[#C85A32]">{child.label}</Link>)}
                        </React.Fragment>)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Link 
              to="/books" 
              className={`py-1 border-b-2 transition-colors ${
                isActive('/books') 
                  ? 'border-[#C85A32] text-[#1C1A18] dark:text-[#F5F3EF] font-semibold' 
                  : 'border-transparent hover:text-[#C85A32] dark:hover:text-[#E06F45]'
              }`}
            >
              Books Catalog
            </Link>
            <Link
              to="/contact"
              className={`py-1 border-b-2 transition-colors ${
                isActive('/contact')
                  ? 'border-[#C85A32] text-[#1C1A18] dark:text-[#F5F3EF] font-semibold'
                  : 'border-transparent hover:text-[#C85A32] dark:hover:text-[#E06F45]'
              }`}
            >
              Contact Us
            </Link>
          </nav>

          {/* Action Tools */}
          <div className="flex items-center space-x-1 sm:space-x-3">
            {/* Theme Switcher */}
            <button 
              onClick={toggleTheme} 
              className="p-2 text-[#575047] dark:text-[#CBC4B8] hover:text-[#C85A32] dark:hover:text-[#E06F45] hover:bg-[#F2EAE0] dark:hover:bg-[#22222B] rounded transition-colors"
              aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
              title={isDarkMode ? "Light Mode" : "Dark Mode"}
            >
              {isDarkMode ? <Sun size={19} /> : <Moon size={19} />}
            </button>

            {/* Wishlist */}
            <Link 
              to="/profile" 
              className="relative p-2 text-[#575047] dark:text-[#CBC4B8] hover:text-[#C85A32] dark:hover:text-[#E06F45] hover:bg-[#F2EAE0] dark:hover:bg-[#22222B] rounded transition-colors"
              aria-label={`Wishlist (${wishlistCount} items)`}
              title="Saved Books"
            >
              <Heart size={20} className={wishlistCount > 0 ? "fill-[#C85A32] text-[#C85A32]" : ""} />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#C85A32] text-[10px] font-bold text-white px-1">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Shopping Cart */}
            <Link 
              to="/cart" 
              className="relative p-2 text-[#575047] dark:text-[#CBC4B8] hover:text-[#C85A32] dark:hover:text-[#E06F45] hover:bg-[#F2EAE0] dark:hover:bg-[#22222B] rounded transition-colors"
              aria-label={`Cart (${cartCount} items)`}
              title="Shopping Cart"
            >
              <ShoppingBag size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#1C1A18] dark:bg-[#FAF6EE] text-[10px] font-bold text-white dark:text-[#1C1A18] px-1">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* User Account / Profile */}
            <div className="relative" ref={profileRef}>
              {user ? (
                <div>
                  <button 
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center gap-2 p-1.5 rounded hover:bg-[#F2EAE0] dark:hover:bg-[#22222B] transition-colors focus-visible:ring-1 focus-visible:ring-[#C85A32]"
                    aria-label="User account menu"
                    aria-expanded={isProfileOpen}
                  >
                    <div className="w-8 h-8 rounded bg-[#1C1A18] dark:bg-[#FAF6EE] text-[#FAF6EE] dark:text-[#1C1A18] flex items-center justify-center font-sans font-bold text-sm">
                      {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  </button>

                  {/* Profile Dropdown */}
                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-[#FFFFFF] dark:bg-[#1A1A20] rounded border border-[#DCD0BF] dark:border-[#363644] shadow-editorial py-1.5 z-50 font-sans">
                      <div className="px-4 py-3 border-b border-[#EDE4D8] dark:border-[#2A2A33]">
                        <p className="font-semibold text-sm text-[#1C1A18] dark:text-[#F5F3EF] truncate">{user.name}</p>
                        <p className="text-xs text-[#877F74] dark:text-[#8E887E] truncate mt-0.5">{user.email}</p>
                      </div>
                      
                      <Link 
                        to="/profile" 
                        onClick={() => setIsProfileOpen(false)} 
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-[#575047] dark:text-[#CBC4B8] hover:bg-[#F2EAE0] dark:hover:bg-[#22222B] hover:text-[#C85A32] dark:hover:text-[#E06F45]"
                      >
                        <User size={15} /> My Profile & Orders
                      </Link>
                      
                      {isAdmin && (
                        <Link 
                          to="/admin/dashboard" 
                          onClick={() => setIsProfileOpen(false)} 
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-[#C85A32] dark:text-[#E06F45] hover:bg-[#F2EAE0] dark:hover:bg-[#22222B] font-medium"
                        >
                          <Shield size={15} /> Admin Dashboard
                        </Link>
                      )}
                      
                      <div className="border-t border-[#EDE4D8] dark:border-[#2A2A33] my-1"></div>

                      <button 
                        onClick={handleLogout} 
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-[#877F74] dark:text-[#8E887E] hover:bg-[#F2EAE0] dark:hover:bg-[#22222B] hover:text-red-600 dark:hover:text-red-400 text-left"
                      >
                        <LogOut size={15} /> Sign out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link 
                  to="/login" 
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded bg-[#1C1A18] hover:bg-[#2E2A27] text-[#FAF6EE] dark:bg-[#FAF6EE] dark:hover:bg-[#FFFFFF] dark:text-[#1C1A18] text-xs font-semibold uppercase tracking-wider transition-all"
                >
                  <User size={14} />
                  <span>Sign In</span>
                </Link>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div 
          ref={mobileMenuRef}
          className="lg:hidden bg-[#FAF6EE] dark:bg-[#121215] border-b border-[#DCD0BF] dark:border-[#363644] px-4 py-4 space-y-4 font-sans animate-in slide-in-from-top-2 duration-200"
        >
          {/* Mobile Search */}
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search books, stationery, authors, or brands..."
              className="w-full bg-[#FFFFFF] dark:bg-[#1A1A20] text-[#1C1A18] dark:text-[#F5F3EF] placeholder-[#877F74] text-sm pl-10 pr-10 py-2.5 rounded border border-[#DCD0BF] dark:border-[#363644] focus:border-[#C85A32]"
            />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#877F74]" size={16} />
          </form>

          {/* Mobile Links */}
          <div className="space-y-1">
            <Link 
              to="/" 
              onClick={() => setIsMobileMenuOpen(false)} 
              className={`flex items-center justify-between px-3 py-2.5 rounded text-sm font-medium ${
                isActive('/') 
                  ? 'bg-[#F2EAE0] dark:bg-[#22222B] text-[#C85A32] dark:text-[#E06F45] font-semibold' 
                  : 'text-[#575047] dark:text-[#CBC4B8]'
              }`}
            >
              <span>Home</span>
              <ArrowRight size={14} className="opacity-50" />
            </Link>
            {catalogNavigation.map((group) => (
              <details key={group.label} className="px-3 py-2 rounded text-sm text-[#575047] dark:text-[#CBC4B8]">
                <summary className="cursor-pointer font-semibold">{group.label}</summary>
                <div className="mt-2 ml-2 space-y-2 border-l border-[#DCD0BF] dark:border-[#363644] pl-3">
                  {group.children.map((item) => <React.Fragment key={item.to}>
                    <Link to={item.to} className="block" onClick={() => setIsMobileMenuOpen(false)}>{item.label}</Link>
                    {item.children?.map((child) => <Link key={child.to} to={child.to} className="block pl-3 text-xs text-[#877F74]" onClick={() => setIsMobileMenuOpen(false)}>{child.label}</Link>)}
                  </React.Fragment>)}
                </div>
              </details>
            ))}
            <Link 
              to="/books" 
              onClick={() => setIsMobileMenuOpen(false)} 
              className={`flex items-center justify-between px-3 py-2.5 rounded text-sm font-medium ${
                isActive('/books') 
                  ? 'bg-[#F2EAE0] dark:bg-[#22222B] text-[#C85A32] dark:text-[#E06F45] font-semibold' 
                  : 'text-[#575047] dark:text-[#CBC4B8]'
              }`}
            >
              <span>Browse Books</span>
              <ArrowRight size={14} className="opacity-50" />
            </Link>
            <Link
              to="/contact"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center justify-between px-3 py-2.5 rounded text-sm font-medium ${
                isActive('/contact')
                  ? 'bg-[#F2EAE0] dark:bg-[#22222B] text-[#C85A32] dark:text-[#E06F45] font-semibold'
                  : 'text-[#575047] dark:text-[#CBC4B8]'
              }`}
            >
              <span>Contact Us</span>
              <ArrowRight size={14} className="opacity-50" />
            </Link>
            <Link 
              to="/cart" 
              onClick={() => setIsMobileMenuOpen(false)} 
              className="flex items-center justify-between px-3 py-2.5 rounded text-sm font-medium text-[#575047] dark:text-[#CBC4B8]"
            >
              <div className="flex items-center gap-2">
                <span>Cart</span>
                {cartCount > 0 && (
                  <span className="bg-[#1C1A18] dark:bg-[#FAF6EE] text-white dark:text-[#1C1A18] text-xs px-1.5 py-0.2 rounded font-bold">
                    {cartCount}
                  </span>
                )}
              </div>
              <ArrowRight size={14} className="opacity-50" />
            </Link>
            <Link 
              to="/profile" 
              onClick={() => setIsMobileMenuOpen(false)} 
              className="flex items-center justify-between px-3 py-2.5 rounded text-sm font-medium text-[#575047] dark:text-[#CBC4B8]"
            >
              <div className="flex items-center gap-2">
                <span>Wishlist</span>
                {wishlistCount > 0 && (
                  <span className="bg-[#C85A32] text-white text-xs px-1.5 py-0.2 rounded font-bold">
                    {wishlistCount}
                  </span>
                )}
              </div>
              <ArrowRight size={14} className="opacity-50" />
            </Link>
          </div>

          {/* Auth in Mobile */}
          {!user && (
            <div className="pt-2 border-t border-[#EDE4D8] dark:border-[#2A2A33]">
              <Link 
                to="/login" 
                onClick={() => setIsMobileMenuOpen(false)} 
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded bg-[#1C1A18] text-[#FAF6EE] dark:bg-[#FAF6EE] dark:text-[#1C1A18] text-xs font-semibold uppercase tracking-wider"
              >
                <User size={14} />
                <span>Sign In / Create Account</span>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
