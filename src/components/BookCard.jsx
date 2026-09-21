import React from 'react';
import { Link } from 'react-router-dom';
import { Star, ShoppingBag, Heart, Minus, Plus } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

const BookCard = ({ book }) => {
  const { cart, addToCart, updateQuantity, removeFromCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  if (!book) return null;

  const cartItem = cart.find((item) => item.id === book.id);

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(book);
  };

  const handleIncrease = (e) => {
    e.preventDefault();
    e.stopPropagation();
    updateQuantity(book.id, cartItem.quantity + 1);
  };

  const handleDecrease = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (cartItem.quantity <= 1) {
      removeFromCart(book.id);
    } else {
      updateQuantity(book.id, cartItem.quantity - 1);
    }
  };

  const handleWishlistToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(book);
  };

  const inWishlist = isInWishlist(book.id);
  const isBook = !book.productType || book.productType === 'book';
  const itemKind = isBook ? (book.genre || book.category) : (book.subcategory || (book.productType === 'stationery' ? 'Stationery' : 'College Essential'));
  const contributor = isBook ? book.author : (book.brand || book.company);
  const hasDiscount = book.discountPercentage > 0 || (book.originalPrice && book.originalPrice > book.price);
  const discountVal = book.discountPercentage || (book.originalPrice ? Math.round(((book.originalPrice - book.price) / book.originalPrice) * 100) : 0);

  return (
    <article className="group relative bg-[#FFFFFF] dark:bg-[#1A1A20] rounded border border-[#EDE4D8] dark:border-[#2A2A33] overflow-hidden flex flex-col h-full shadow-book hover:shadow-book-hover transition-all duration-300 hover:-translate-y-1 focus-within:ring-2 focus-within:ring-[#C85A32] dark:focus-within:ring-[#E06F45]">
      
      {/* Book Cover Container with physical realistic aspect ratio (2:3) */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-[#FAF6EE] dark:bg-[#121215] border-b border-[#EDE4D8]/60 dark:border-[#2A2A33]">
        <Link 
          to={`/books/${book.id}`} 
          className="block w-full h-full relative book-spine outline-none"
          tabIndex={-1}
        >
          <img 
            src={book.image} 
            alt={book.title} 
            loading="lazy"
            className="w-full h-full object-cover object-center transform group-hover:scale-[1.03] transition-transform duration-500 ease-out"
          />
          {/* Subtle paper texture overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/5 opacity-40 group-hover:opacity-20 transition-opacity duration-300 pointer-events-none" />
        </Link>

        {/* Discount Badge */}
        {hasDiscount && discountVal > 0 && (
          <div className="absolute top-2.5 left-2.5 z-20 bg-[#1C1A18] text-[#FAF6EE] dark:bg-[#FAF6EE] dark:text-[#1C1A18] text-[10px] font-sans font-bold px-2 py-0.5 rounded-sm tracking-wider uppercase shadow-sm">
            Save {discountVal}%
          </div>
        )}

        {/* Wishlist Button */}
        <button 
          onClick={handleWishlistToggle}
          className="absolute top-2.5 right-2.5 z-20 p-2 rounded bg-white/90 dark:bg-[#1A1A20]/90 backdrop-blur-sm text-[#78716C] hover:text-[#C85A32] dark:text-[#A8A29E] dark:hover:text-[#E06F45] border border-[#EDE4D8] dark:border-[#363644] transition-colors focus-visible:ring-1 focus-visible:ring-[#C85A32]"
          aria-label={inWishlist ? `Remove "${book.title}" from wishlist` : `Add "${book.title}" to wishlist`}
          title={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart size={16} className={inWishlist ? "fill-[#C85A32] text-[#C85A32]" : ""} />
        </button>
      </div>

      {/* Book Metadata & Body */}
      <div className="p-4 sm:p-4.5 flex flex-col flex-grow font-sans bg-[#FFFFFF] dark:bg-[#1A1A20]">
        
        {/* Genre & Author Header */}
        <div className="flex items-center justify-between gap-2 mb-1.5">
          {itemKind && (
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#C85A32] dark:text-[#E06F45] truncate">
              {itemKind}
            </span>
          )}
          {book.stockQuantity !== undefined && book.stockQuantity <= 5 && book.stockQuantity > 0 && (
            <span className="text-[10px] font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.2 rounded text-right whitespace-nowrap">
              Only {book.stockQuantity} left
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-serif font-bold text-base sm:text-lg text-[#1C1A18] dark:text-[#F5F3EF] line-clamp-2 leading-snug group-hover:text-[#C85A32] dark:group-hover:text-[#E06F45] transition-colors mb-1">
          <Link to={`/books/${book.id}`} className="outline-none">
            {book.title}
          </Link>
        </h3>

        {contributor && <p className="text-xs text-[#575047] dark:text-[#CBC4B8] mb-2 truncate">
          <span className="text-[#877F74] dark:text-[#8E887E]">{isBook ? 'By' : 'Brand'}</span> {contributor}
        </p>}

        {/* Rating */}
        <div className="flex items-center gap-1.5 mb-3 text-xs">
          <div className="flex items-center text-amber-600 dark:text-amber-500">
            <Star size={13} className="fill-current" />
          </div>
          <span className="font-semibold text-[#1C1A18] dark:text-[#F5F3EF]">
            {book.rating ? book.rating.toFixed(1) : '4.5'}
          </span>
          {book.reviewsCount && (
            <span className="text-[11px] text-[#877F74] dark:text-[#8E887E]">
              ({book.reviewsCount.toLocaleString()})
            </span>
          )}
        </div>

        {/* Pricing and Add to Cart Section */}
        <div className="mt-auto pt-3 border-t border-[#EDE4D8]/70 dark:border-[#2A2A33] flex flex-col gap-2.5">
          <div className="flex items-baseline gap-2">
            <span className="font-serif font-bold text-lg sm:text-xl text-[#1C1A18] dark:text-[#F5F3EF]">
              ₹{Number(book.price).toLocaleString('en-IN')}
            </span>
            {book.originalPrice && book.originalPrice > book.price && (
              <span className="text-xs text-[#877F74] dark:text-[#8E887E] line-through font-normal">
                ₹{Number(book.originalPrice).toLocaleString('en-IN')}
              </span>
            )}
          </div>

          {/* Add to Cart Button / Quantity Stepper */}
          {cartItem ? (
            <div
              className="w-full flex items-center justify-between gap-2 py-1.5 px-2 rounded bg-[#C85A32] text-white border border-transparent"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            >
              <button
                onClick={handleDecrease}
                className="w-7 h-7 flex items-center justify-center rounded bg-white/15 hover:bg-white/25 transition-colors"
                aria-label={cartItem.quantity <= 1 ? `Remove "${book.title}" from cart` : `Decrease quantity of "${book.title}"`}
              >
                <Minus size={14} />
              </button>
              <span className="text-xs font-bold uppercase tracking-wider">
                {cartItem.quantity} in cart
              </span>
              <button
                onClick={handleIncrease}
                disabled={book.stockQuantity !== undefined && cartItem.quantity >= book.stockQuantity}
                className="w-7 h-7 flex items-center justify-center rounded bg-white/15 hover:bg-white/25 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label={`Increase quantity of "${book.title}"`}
              >
                <Plus size={14} />
              </button>
            </div>
          ) : (
            <button 
              onClick={handleAddToCart}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded bg-[#FAF6EE] hover:bg-[#C85A32] text-[#1C1A18] hover:text-[#FAF6EE] dark:bg-[#22222B] dark:text-[#F5F3EF] dark:hover:bg-[#C85A32] dark:hover:text-white border border-[#DCD0BF] hover:border-transparent dark:border-[#363644] dark:hover:border-transparent text-xs font-semibold uppercase tracking-wider transition-all duration-200 focus-visible:ring-1 focus-visible:ring-[#C85A32]"
              aria-label={`Add "${book.title}" to cart`}
            >
              <ShoppingBag size={14} />
              <span>Add to Cart</span>
            </button>
          )}
        </div>

      </div>
    </article>
  );
};

export default BookCard;
