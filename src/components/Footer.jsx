import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { businessInfo } from '../data/businessInfo';

const Footer = () => {
  return (
    <footer className="bg-[#F2EAE0] dark:bg-[#18181D] border-t border-[#DCD0BF] dark:border-[#2A2A33] pt-14 pb-10 mt-auto transition-colors font-sans">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-[#DCD0BF]/70 dark:border-[#2A2A33]">
          
          {/* Brand Col */}
          <div className="md:col-span-4">
            <Link to="/" className="inline-flex items-baseline gap-2 group mb-4 outline-none">
              <span className="font-serif font-bold text-2xl tracking-tight text-[#1C1A18] dark:text-[#F5F3EF] group-hover:text-[#C85A32] dark:group-hover:text-[#E06F45] transition-colors">
                {businessInfo.storeName}
              </span>
              <span className="text-[9px] uppercase tracking-[0.25em] font-semibold text-[#877F74] dark:text-[#8E887E] whitespace-nowrap">
                Est. {businessInfo.establishedYear}
              </span>
            </Link>
            <p className="text-sm text-[#575047] dark:text-[#CBC4B8] leading-relaxed max-w-sm mb-6">
              An independent bookstore dedicated to the art of reading. Discover carefully curated contemporary literature, timeless classics, and thought-provoking non-fiction.
            </p>
            <p className="text-xs text-[#877F74] dark:text-[#8E887E]">
              Dedicated to readers, writers, and independent publishing.
            </p>
          </div>
          
          {/* Catalog Col */}
          <div className="md:col-span-3">
            <h3 className="font-serif font-semibold text-base text-[#1C1A18] dark:text-[#F5F3EF] mb-4">Explore Catalog</h3>
            <ul className="space-y-2.5 text-sm text-[#575047] dark:text-[#CBC4B8]">
              <li><Link to="/books" className="hover:text-[#C85A32] dark:hover:text-[#E06F45] transition-colors">All Books</Link></li>
              <li><Link to="/books?filter=featured" className="hover:text-[#C85A32] dark:hover:text-[#E06F45] transition-colors">Featured Editions</Link></li>
              <li><Link to="/books?filter=bestseller" className="hover:text-[#C85A32] dark:hover:text-[#E06F45] transition-colors">Popular Titles</Link></li>
              <li><Link to="/cart" className="hover:text-[#C85A32] dark:hover:text-[#E06F45] transition-colors">Shopping Cart</Link></li>
            </ul>
          </div>

          {/* Categories Col */}
          <div className="md:col-span-3">
            <h3 className="font-serif font-semibold text-base text-[#1C1A18] dark:text-[#F5F3EF] mb-4">Genres & Subjects</h3>
            <ul className="space-y-2.5 text-sm text-[#575047] dark:text-[#CBC4B8]">
              <li><Link to="/books?category=Science" className="hover:text-[#C85A32] dark:hover:text-[#E06F45] transition-colors">Science & Nature</Link></li>
              <li><Link to="/books?category=Fiction" className="hover:text-[#C85A32] dark:hover:text-[#E06F45] transition-colors">Literary Fiction</Link></li>
              <li><Link to="/books?category=Fantasy" className="hover:text-[#C85A32] dark:hover:text-[#E06F45] transition-colors">Fantasy & Sci-Fi</Link></li>
              <li><Link to="/books?category=Education" className="hover:text-[#C85A32] dark:hover:text-[#E06F45] transition-colors">Education & Technology</Link></li>
            </ul>
          </div>

          {/* Account Col */}
          <div className="md:col-span-2">
            <h3 className="font-serif font-semibold text-base text-[#1C1A18] dark:text-[#F5F3EF] mb-4">Customer Care</h3>
            <ul className="space-y-2.5 text-sm text-[#575047] dark:text-[#CBC4B8]">
              <li><Link to="/profile" className="hover:text-[#C85A32] dark:hover:text-[#E06F45] transition-colors">My Account</Link></li>
              <li><Link to="/profile" className="hover:text-[#C85A32] dark:hover:text-[#E06F45] transition-colors">Saved Wishlist</Link></li>
              <li><Link to="/profile" className="hover:text-[#C85A32] dark:hover:text-[#E06F45] transition-colors">Order History</Link></li>
              <li><Link to="/profile" className="hover:text-[#C85A32] dark:hover:text-[#E06F45] transition-colors">Order Tracking</Link></li>
              <li><Link to="/contact" className="hover:text-[#C85A32] dark:hover:text-[#E06F45] transition-colors">Contact Us</Link></li>
              <li><Link to="/login" className="hover:text-[#C85A32] dark:hover:text-[#E06F45] transition-colors">Sign In</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#877F74] dark:text-[#8E887E]">
          <div>
            &copy; {new Date().getFullYear()} {businessInfo.storeName}. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <span>Crafted for Book Lovers</span>
            <span>•</span>
            <span>Paper, Ink & Typography</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
