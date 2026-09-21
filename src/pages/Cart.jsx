import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowRight, AlertCircle, ShoppingBag, BookOpen, ShieldCheck } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useBooks } from '../context/BookContext';
import BookCard from '../components/BookCard';

const Cart = () => {
  const { cart, removeFromCart, updateQuantity, getCartTotal, clearCart } = useCart();
  const { books } = useBooks();
  const navigate = useNavigate();

  // Recommendations: top 3 trending books not in cart
  const recommendations = books
    .filter(b => b.trending && !cart.some(cartItem => cartItem.id === b.id))
    .slice(0, 3);

  if (cart.length === 0) {
    return (
      <div className="py-20 max-w-lg mx-auto text-center font-sans">
        <div className="w-16 h-16 bg-[#F2EAE0] dark:bg-[#1A1A20] rounded-full flex items-center justify-center mx-auto mb-5 text-[#877F74]">
          <ShoppingBag size={28} />
        </div>
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1C1A18] dark:text-[#F5F3EF] mb-2">
          Your book satchel is empty
        </h2>
        <p className="text-xs sm:text-sm text-[#575047] dark:text-[#CBC4B8] mb-6 leading-relaxed max-w-sm mx-auto">
          No volumes have been added yet. Browse our curated stacks to discover titles worthy of your reading table.
        </p>
        <Link 
          to="/books" 
          className="inline-flex items-center justify-center px-6 py-3 bg-[#1C1A18] hover:bg-[#2E2A27] text-[#FAF6EE] dark:bg-[#FAF6EE] dark:hover:bg-[#FFFFFF] dark:text-[#1C1A18] text-xs font-semibold uppercase tracking-wider rounded transition-colors shadow-sm"
        >
          <span>Explore The Catalog</span>
          <ArrowRight size={14} className="ml-2" />
        </Link>
      </div>
    );
  }

  const subtotal = getCartTotal();
  const tax = Math.round(subtotal * 0.08); // 8% tax calculation
  const total = subtotal + tax;

  // Calculate savings
  const totalOriginalPrice = cart.reduce((acc, item) => acc + ((item.originalPrice || item.price) * item.quantity), 0);
  const savings = totalOriginalPrice > subtotal ? totalOriginalPrice - subtotal : 0;
  const itemCount = cart.reduce((total, item) => total + item.quantity, 0);

  return (
    <div className="pb-20 font-sans">
      
      {/* Header */}
      <div className="mb-8 pb-4 border-b border-[#DCD0BF]/70 dark:border-[#2A2A33]">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#1C1A18] dark:text-[#F5F3EF]">
          Shopping Cart
        </h1>
        <p className="text-xs sm:text-sm text-[#877F74] dark:text-[#8E887E] mt-0.5">
          Review your selected volumes before proceeding to checkout ({itemCount} {itemCount === 1 ? 'item' : 'items'})
        </p>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
        
        {/* Cart Items List */}
        <div className="w-full lg:w-2/3 space-y-4">
          {cart.map((item) => {
            const itemTotal = item.price * item.quantity;
            const hasItemDiscount = item.originalPrice && item.originalPrice > item.price;
            const itemSavings = hasItemDiscount ? (item.originalPrice - item.price) * item.quantity : 0;

            return (
              <div 
                key={`${item.id}-${item.selectedSize || ''}`} 
                className="flex flex-col sm:flex-row bg-[#FFFFFF] dark:bg-[#1A1A20] rounded border border-[#EDE4D8] dark:border-[#2A2A33] p-4 sm:p-5 gap-4 sm:gap-6 shadow-sm"
              >
                {/* Book Thumbnail */}
                <Link to={`/books/${item.id}`} className="flex-shrink-0 self-start">
                  <div className="w-20 h-28 sm:w-24 sm:h-36 rounded-sm overflow-hidden book-spine shadow-book bg-[#FAF6EE] dark:bg-[#121215]">
                    <img 
                      src={item.image} 
                      alt={item.title} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </Link>
                
                {/* Details & Controls */}
                <div className="flex-grow flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start gap-4 mb-1">
                      <Link to={`/books/${item.id}`} className="group">
                        <h3 className="font-serif font-bold text-base sm:text-lg text-[#1C1A18] dark:text-[#F5F3EF] group-hover:text-[#C85A32] dark:group-hover:text-[#E06F45] transition-colors line-clamp-2">
                          {item.title}
                        </h3>
                      </Link>
                      
                      <div className="text-right whitespace-nowrap">
                        <span className="font-serif font-bold text-base sm:text-lg text-[#1C1A18] dark:text-[#F5F3EF] block">
                          ₹{itemTotal.toLocaleString('en-IN')}
                        </span>
                        {hasItemDiscount && (
                          <span className="text-[11px] text-[#2E7D32] dark:text-green-400 block font-medium">
                            Saved ₹{itemSavings.toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-[#575047] dark:text-[#CBC4B8] mb-2">By {item.author}{item.selectedSize && <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded border border-[#DCD0BF] dark:border-[#363644] text-[10px] font-bold text-[#1C1A18] dark:text-[#F5F3EF] align-middle">Size: {item.selectedSize}</span>}</p>
                    
                    {/* Low Stock Indicator */}
                    {item.stockQuantity !== undefined && item.stockQuantity <= 5 && item.stockQuantity > 0 && (
                      <div className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded">
                        <AlertCircle size={12} /> Only {item.stockQuantity} copies remaining
                      </div>
                    )}
                  </div>
                  
                  {/* Quantity and Remove Toolbar */}
                  <div className="flex justify-between items-center pt-4 mt-2 border-t border-[#EDE4D8]/60 dark:border-[#2A2A33]">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#877F74]">Qty:</span>
                      <div className="inline-flex items-center bg-[#FAF6EE] dark:bg-[#121215] border border-[#DCD0BF] dark:border-[#363644] rounded">
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity - 1, item.selectedSize)}
                          className="p-1.5 text-[#575047] hover:text-[#1C1A18] disabled:opacity-30"
                          disabled={item.quantity <= 1}
                          aria-label="Decrease quantity"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-6 text-center text-xs font-bold font-mono text-[#1C1A18] dark:text-[#F5F3EF]">
                          {item.quantity}
                        </span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1, item.selectedSize)}
                          className="p-1.5 text-[#575047] hover:text-[#1C1A18] disabled:opacity-30"
                          disabled={item.stockQuantity !== undefined && item.quantity >= item.stockQuantity}
                          aria-label="Increase quantity"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => removeFromCart(item.id, item.selectedSize)}
                      className="inline-flex items-center text-xs text-[#877F74] hover:text-red-600 dark:hover:text-red-400 transition-colors p-1"
                    >
                      <Trash2 size={13} className="mr-1" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          
          <div className="flex justify-end pt-3">
            <button 
              onClick={clearCart}
              className="text-xs text-[#877F74] hover:text-red-600 transition-colors underline underline-offset-2"
            >
              Empty entire cart
            </button>
          </div>
        </div>

        {/* Order Summary Card */}
        <div className="w-full lg:w-1/3">
          <div className="bg-[#FFFFFF] dark:bg-[#1A1A20] rounded border border-[#EDE4D8] dark:border-[#2A2A33] p-6 sticky top-24 shadow-sm space-y-5">
            <h2 className="font-serif font-bold text-lg text-[#1C1A18] dark:text-[#F5F3EF] pb-3 border-b border-[#EDE4D8] dark:border-[#2A2A33]">
              Order Summary
            </h2>
            
            <div className="space-y-3 text-xs text-[#575047] dark:text-[#CBC4B8]">
              <div className="flex justify-between">
                <span>Items Subtotal ({itemCount})</span>
                <span className="font-medium text-[#1C1A18] dark:text-[#F5F3EF]">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Packaging & Tax (8%)</span>
                <span className="font-medium text-[#1C1A18] dark:text-[#F5F3EF]">₹{tax.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>Standard Delivery</span>
                <span className="font-medium text-[#2E7D32] dark:text-green-400">FREE</span>
              </div>
            </div>
            
            {savings > 0 && (
              <div className="bg-[#FAF6EE] dark:bg-[#121215] border border-[#DCD0BF] dark:border-[#363644] rounded p-3 text-xs text-[#575047] dark:text-[#CBC4B8]">
                <span className="font-semibold text-[#2E7D32] dark:text-green-400 block mb-0.5">
                  Promotional Savings: ₹{savings.toLocaleString('en-IN')}
                </span>
                <span>You scored publisher discounts on your selected volumes.</span>
              </div>
            )}

            <div className="border-t border-[#EDE4D8] dark:border-[#2A2A33] pt-4">
              <div className="flex justify-between items-baseline mb-4">
                <span className="font-serif font-bold text-base text-[#1C1A18] dark:text-[#F5F3EF]">Estimated Total</span>
                <span className="font-serif font-bold text-2xl text-[#C85A32] dark:text-[#E06F45]">
                  ₹{total.toLocaleString('en-IN')}
                </span>
              </div>

              <button 
                onClick={() => navigate('/checkout')}
                className="w-full py-3 bg-[#1C1A18] hover:bg-[#2E2A27] text-[#FAF6EE] dark:bg-[#FAF6EE] dark:hover:bg-[#FFFFFF] dark:text-[#1C1A18] text-xs font-semibold uppercase tracking-wider rounded flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight size={14} />
              </button>
            </div>
            
            <div className="pt-2 text-center">
              <Link 
                to="/books" 
                className="text-xs text-[#877F74] hover:text-[#C85A32] transition-colors inline-block"
              >
                &larr; Continue browsing catalog
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Cross-sell Recommendations */}
      {recommendations.length > 0 && (
        <section className="mt-20 pt-10 border-t border-[#DCD0BF]/70 dark:border-[#2A2A33]">
          <div className="mb-6">
            <h2 className="font-serif text-2xl font-bold text-[#1C1A18] dark:text-[#F5F3EF]">
              Readers Also Considered
            </h2>
            <p className="text-xs sm:text-sm text-[#877F74] dark:text-[#8E887E] mt-0.5">
              Popular additions to complement your reading list
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendations.map(book => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default Cart;
