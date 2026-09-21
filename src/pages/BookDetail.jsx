import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, 
  Star, 
  ArrowLeft, 
  Truck, 
  ShieldCheck, 
  Heart, 
  Plus, 
  Minus, 
  BookOpen, 
  Check, 
  MessageSquarePlus,
  Bookmark
} from 'lucide-react';
import { useBooks } from '../context/BookContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import BookCard from '../components/BookCard';

const BookDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { books } = useBooks();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('');
  const [sizeRequiredError, setSizeRequiredError] = useState(false);
  const [addedToast, setAddedToast] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [userRating, setUserRating] = useState(5);
  const [userName, setUserName] = useState('');
  const [userComment, setUserComment] = useState('');
  const [userTitle, setUserTitle] = useState('');
  const [reviewsList, setReviewsList] = useState([]);

  const book = books.find(b => b.id === id);

  // SEO & scroll
  useEffect(() => {
    if (book) {
      document.title = `${book.title} — S LV BOOK CENTER`;
    } else {
      document.title = 'Book Not Found — S LV BOOK CENTER';
    }
    window.scrollTo(0, 0);
    setQuantity(1);
  }, [book, id]);

  // Initial reviews
  useEffect(() => {
    if (book) {
      setReviewsList([
        {
          id: 'r1',
          name: 'Sarah Jenkins',
          rating: 5,
          date: '2 weeks ago',
          title: 'Exquisitely written and deeply thought-provoking',
          comment: 'The narrative pacing and thematic depth made this impossible to put down. An essential addition to any thoughtful reader’s library.'
        },
        {
          id: 'r2',
          name: 'David Thorne',
          rating: 4,
          date: '1 month ago',
          title: 'Remarkable research and character craftsmanship',
          comment: 'Rich in detail and compelling from start to finish. A rewarding reading experience that stays with you long after the final chapter.'
        }
      ]);
    }
  }, [book]);

  if (!book) {
    return (
      <div className="text-center py-24 bg-[#FFFFFF] dark:bg-[#1A1A20] rounded border border-[#EDE4D8] dark:border-[#2A2A33] p-8 max-w-lg mx-auto font-sans">
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1C1A18] dark:text-[#F5F3EF] mb-3">Book not found</h2>
        <p className="text-sm text-[#575047] dark:text-[#CBC4B8] mb-6">The requested volume does not exist or has been retired from the catalog.</p>
        <Link to="/books" className="inline-block px-6 py-2.5 bg-[#1C1A18] text-[#FAF6EE] dark:bg-[#FAF6EE] dark:text-[#1C1A18] text-xs font-semibold uppercase tracking-wider rounded">
          Browse The Collection
        </Link>
      </div>
    );
  }

  const isWishlisted = isInWishlist(book.id);
  const isBook = !book.productType || book.productType === 'book';
  const detailType = isBook ? 'Book' : book.productType === 'stationery' ? 'Stationery' : book.productType === 'engineering_essential' ? 'Engineering Essential' : 'College Essential';
  const relatedBooks = books
    .filter(b => b.genre === book.genre && b.id !== book.id)
    .slice(0, 4);

  const hasDiscount = book.discountPercentage > 0 || (book.originalPrice && book.originalPrice > book.price);
  const discountVal = book.discountPercentage || (book.originalPrice ? Math.round(((book.originalPrice - book.price) / book.originalPrice) * 100) : 0);

  const handleAddToCart = () => {
    if (Array.isArray(book.sizes) && book.sizes.length > 0 && !selectedSize) {
      setSizeRequiredError(true);
      return;
    }
    setSizeRequiredError(false);
    for (let i = 0; i < quantity; i++) {
      addToCart(book, selectedSize || undefined);
    }
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2500);
  };

  const handleBuyNow = () => {
    if (Array.isArray(book.sizes) && book.sizes.length > 0 && !selectedSize) {
      setSizeRequiredError(true);
      return;
    }
    setSizeRequiredError(false);
    addToCart(book, selectedSize || undefined);
    navigate('/checkout');
  };

  const handleReviewSubmit = (e) => {
    e.preventDefault();
    if (!userName.trim() || !userComment.trim()) return;

    const newReview = {
      id: `r-${Date.now()}`,
      name: userName.trim(),
      rating: Number(userRating),
      date: 'Just now',
      title: userTitle.trim() || 'Reader Review',
      comment: userComment.trim()
    };

    setReviewsList([newReview, ...reviewsList]);
    setUserName('');
    setUserTitle('');
    setUserComment('');
    setShowReviewForm(false);
  };

  return (
    <div className="pb-24 lg:pb-16 space-y-16 font-sans">
      
      {/* Breadcrumb / Back Link */}
      <nav className="flex items-center gap-2 text-xs text-[#877F74] dark:text-[#8E887E]">
        <button 
          onClick={() => navigate(-1)} 
          className="hover:text-[#C85A32] dark:hover:text-[#E06F45] transition-colors inline-flex items-center gap-1 font-medium"
        >
          <ArrowLeft size={13} /> Back
        </button>
        <span>/</span>
        <Link to="/books" className="hover:text-[#C85A32] transition-colors">Catalog</Link>
        <span>/</span>
        <span className="text-[#1C1A18] dark:text-[#F5F3EF] truncate max-w-xs">{book.title}</span>
      </nav>

      {/* Main Book Detail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14">
        
        {/* Left Column: Physical Book Cover Presentation */}
        <div className="lg:col-span-5 max-w-md mx-auto lg:mx-0 w-full">
          <div className="sticky top-24">
            <div className="relative bg-[#FFFFFF] dark:bg-[#1A1A20] p-6 sm:p-8 rounded border border-[#EDE4D8] dark:border-[#2A2A33] shadow-book">
              
              {/* Cover Aspect Container */}
              <div className="relative aspect-[2/3] w-full rounded-sm overflow-hidden book-spine shadow-book-hover bg-[#FAF6EE] dark:bg-[#121215]">
                <img 
                  src={book.image} 
                  alt={book.title} 
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Badges on Cover Box */}
              {hasDiscount && discountVal > 0 && (
                <div className="absolute top-9 left-9 z-20 bg-[#1C1A18] text-[#FAF6EE] dark:bg-[#FAF6EE] dark:text-[#1C1A18] text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider shadow-sm">
                  Save {discountVal}%
                </div>
              )}

              {/* Wishlist Button */}
              <button 
                onClick={() => toggleWishlist(book)}
                className="absolute top-8 right-8 p-2.5 rounded bg-white/90 dark:bg-[#1A1A20]/90 backdrop-blur-sm border border-[#EDE4D8] dark:border-[#363644] text-[#78716C] hover:text-[#C85A32] dark:text-[#A8A29E] dark:hover:text-[#E06F45] transition-all shadow-sm"
                aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
              >
                <Heart size={18} className={isWishlisted ? "fill-[#C85A32] text-[#C85A32]" : ""} />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Information, Purchasing & Specs */}
        <div className="lg:col-span-7 flex flex-col">
          
          {/* Genre / Badges */}
          <div className="flex items-center gap-2 mb-3">
            {book.genre && (
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#C85A32] dark:text-[#E06F45]">
                {book.genre}
              </span>
            )}
            {book.featured && (
              <span className="text-[10px] uppercase tracking-wider font-semibold text-[#877F74] dark:text-[#8E887E] bg-[#F2EAE0] dark:bg-[#22222B] px-2 py-0.5 rounded">
                Editor's Selection
              </span>
            )}
          </div>

          {/* Title & Author */}
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1C1A18] dark:text-[#F5F3EF] leading-tight mb-2">
            {book.title}
          </h1>
          {(isBook ? book.author : (book.brand || book.company)) && <p className="text-sm sm:text-base text-[#575047] dark:text-[#CBC4B8] mb-4">
            {isBook ? 'By' : 'Brand'} <span className="font-semibold text-[#1C1A18] dark:text-[#F5F3EF]">{isBook ? book.author : (book.brand || book.company)}</span>
          </p>}

          {/* Ratings & Metadata Summary */}
          <div className="flex flex-wrap items-center gap-4 text-xs pb-6 mb-6 border-b border-[#EDE4D8] dark:border-[#2A2A33]">
            <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-500">
              <Star size={15} className="fill-current" />
              <span className="font-bold text-[#1C1A18] dark:text-[#F5F3EF]">{book.rating || '4.5'}</span>
            </div>
            <span className="text-[#DCD0BF]">•</span>
            <span className="text-[#877F74] dark:text-[#8E887E]">
              {book.reviewsCount || 142} verified reader reviews
            </span>
            {book.company && (
              <>
                <span className="text-[#DCD0BF]">•</span>
                <span className="text-[#877F74] dark:text-[#8E887E]">
                  Publisher: <span className="font-medium text-[#1C1A18] dark:text-[#F5F3EF]">{book.company}</span>
                </span>
              </>
            )}
          </div>

          {/* Price & Stock Box */}
          <div className="bg-[#FFFFFF] dark:bg-[#1A1A20] p-6 rounded border border-[#EDE4D8] dark:border-[#2A2A33] mb-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 mb-6">
              <div className="flex items-baseline gap-3">
                <span className="font-serif font-bold text-3xl text-[#1C1A18] dark:text-[#F5F3EF]">
                  ₹{Number(book.price).toLocaleString('en-IN')}
                </span>
                {book.originalPrice && book.originalPrice > book.price && (
                  <span className="text-sm text-[#877F74] dark:text-[#8E887E] line-through">
                    ₹{Number(book.originalPrice).toLocaleString('en-IN')}
                  </span>
                )}
              </div>

              {/* Stock status indicator */}
              <div>
                {book.stockQuantity === 0 ? (
                  <span className="text-xs font-semibold text-red-600 bg-red-50 dark:bg-red-950/40 px-2 py-1 rounded">
                    Currently Out of Stock
                  </span>
                ) : book.stockQuantity <= 5 ? (
                  <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded">
                    Limited Supply: Only {book.stockQuantity} remaining
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-[#2E7D32] dark:text-green-400 bg-green-50 dark:bg-green-950/40 px-2.5 py-1 rounded inline-flex items-center gap-1">
                    <Check size={12} /> Available in Stock
                  </span>
                )}
              </div>
            </div>

            {/* Size Selector (apparel products only, e.g. Medical Aprons) */}
            {Array.isArray(book.sizes) && book.sizes.length > 0 && (
              <div className="flex items-center gap-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#877F74]">Size:</span>
                <div className="flex flex-wrap gap-2">
                  {book.sizes.map(size => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => { setSelectedSize(size); setSizeRequiredError(false); }}
                      className={`px-3.5 py-1.5 text-xs font-bold rounded border transition-colors ${selectedSize === size ? 'bg-[#1C1A18] text-[#FAF6EE] border-[#1C1A18] dark:bg-[#FAF6EE] dark:text-[#1C1A18] dark:border-[#FAF6EE]' : 'bg-transparent text-[#1C1A18] dark:text-[#F5F3EF] border-[#DCD0BF] dark:border-[#363644] hover:border-[#C85A32]'}`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {sizeRequiredError && (
              <p className="text-xs font-semibold text-red-600">Please select a size before continuing.</p>
            )}

            {/* Quantity Selector & Purchase Actions */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#877F74]">Quantity:</span>
                <div className="inline-flex items-center bg-[#FAF6EE] dark:bg-[#121215] border border-[#DCD0BF] dark:border-[#363644] rounded">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="p-2 text-[#575047] hover:text-[#1C1A18] disabled:opacity-30"
                    aria-label="Decrease quantity"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-8 text-center text-xs font-bold font-mono text-[#1C1A18] dark:text-[#F5F3EF]">
                    {quantity}
                  </span>
                  <button 
                    onClick={() => setQuantity(quantity + 1)}
                    disabled={book.stockQuantity !== undefined && quantity >= book.stockQuantity}
                    className="p-2 text-[#575047] hover:text-[#1C1A18] disabled:opacity-30"
                    aria-label="Increase quantity"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button 
                  onClick={handleAddToCart}
                  disabled={book.stockQuantity === 0}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-6 bg-[#FAF6EE] hover:bg-[#C85A32] text-[#1C1A18] hover:text-[#FAF6EE] dark:bg-[#22222B] dark:text-[#F5F3EF] dark:hover:bg-[#C85A32] dark:hover:text-white border border-[#DCD0BF] hover:border-transparent dark:border-[#363644] text-xs font-semibold uppercase tracking-wider rounded transition-all disabled:opacity-40"
                >
                  <ShoppingBag size={15} />
                  <span>Add To Cart</span>
                </button>

                <button 
                  onClick={handleBuyNow}
                  disabled={book.stockQuantity === 0}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-6 bg-[#1C1A18] hover:bg-[#2E2A27] text-[#FAF6EE] dark:bg-[#FAF6EE] dark:hover:bg-[#FFFFFF] dark:text-[#1C1A18] text-xs font-semibold uppercase tracking-wider rounded transition-all disabled:opacity-40 shadow-sm"
                >
                  <span>Instant Purchase</span>
                </button>
              </div>

              {addedToast && (
                <div className="p-2 text-center text-xs font-medium text-[#2E7D32] bg-green-50 dark:bg-green-950/40 rounded border border-green-200 dark:border-green-900/40 animate-in fade-in duration-200">
                  ✓ Added {quantity} {quantity === 1 ? 'copy' : 'copies'} of "{book.title}" to your cart.
                </div>
              )}
            </div>

            {/* Guarantee / Perks */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-6 mt-6 border-t border-[#EDE4D8] dark:border-[#2A2A33] text-xs text-[#575047] dark:text-[#CBC4B8]">
              <div className="flex items-center gap-2">
                <Truck size={15} className="text-[#C85A32]" />
                <span>Complimentary Delivery over ₹999</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck size={15} className="text-[#2E7D32]" />
                <span>Carefully Packaged in Protective Wrap</span>
              </div>
            </div>
          </div>

          {/* Book Synopsis & Description */}
          <div className="space-y-4 mb-8">
            <h2 className="font-serif text-xl font-bold text-[#1C1A18] dark:text-[#F5F3EF]">
              About This {detailType}
            </h2>
            <div className="prose dark:prose-invert max-w-none text-sm text-[#575047] dark:text-[#CBC4B8] leading-relaxed space-y-3 font-normal">
              <p>{book.description}</p>
              <p>
                An engaging work that illuminates its subject with narrative clarity and intellectual depth. Carefully produced with acid-free paper, crisp typography, and enduring binding.
              </p>
            </div>
          </div>

          {/* Book Specifications Table */}
          <div className="border border-[#EDE4D8] dark:border-[#2A2A33] rounded overflow-hidden mb-12">
            <div className="bg-[#FAF6EE] dark:bg-[#18181D] px-4 py-2.5 border-b border-[#EDE4D8] dark:border-[#2A2A33]">
              <h3 className="font-serif font-bold text-sm text-[#1C1A18] dark:text-[#F5F3EF]">
                {isBook ? 'Publication Specifications' : 'Product Specifications'}
              </h3>
            </div>
            <dl className="grid grid-cols-1 sm:grid-cols-2 text-xs">
              <div className="p-3 border-b sm:border-r border-[#EDE4D8] dark:border-[#2A2A33] flex justify-between">
                <dt className="text-[#877F74]">{isBook ? 'ISBN-13' : 'Category'}</dt>
                <dd className="font-mono font-medium text-[#1C1A18] dark:text-[#F5F3EF]">{isBook ? (book.isbn || '978-0-141-98782-9') : (book.subcategory || detailType)}</dd>
              </div>
              <div className="p-3 border-b border-[#EDE4D8] dark:border-[#2A2A33] flex justify-between">
                <dt className="text-[#877F74]">{isBook ? 'Genre' : 'Product type'}</dt>
                <dd className="font-medium text-[#1C1A18] dark:text-[#F5F3EF]">{isBook ? book.genre : detailType}</dd>
              </div>
              <div className="p-3 border-b sm:border-b-0 sm:border-r border-[#EDE4D8] dark:border-[#2A2A33] flex justify-between">
                <dt className="text-[#877F74]">Publisher</dt>
                <dd className="font-medium text-[#1C1A18] dark:text-[#F5F3EF]">{book.company || 'Independent Publishing Group'}</dd>
              </div>
              <div className="p-3 flex justify-between">
                <dt className="text-[#877F74]">Format</dt>
                <dd className="font-medium text-[#1C1A18] dark:text-[#F5F3EF]">Trade Paperback</dd>
              </div>
            </dl>
          </div>

        </div>
      </div>

      {/* Reader Reviews & Evaluation Section */}
      <section className="pt-10 border-t border-[#DCD0BF]/70 dark:border-[#2A2A33]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1C1A18] dark:text-[#F5F3EF]">
              Reader Reviews & Thoughts
            </h2>
            <p className="text-xs sm:text-sm text-[#877F74] dark:text-[#8E887E] mt-0.5">
              Verified readers sharing reflections on {book.title}
            </p>
          </div>

          <button
            onClick={() => setShowReviewForm(!showReviewForm)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-transparent hover:bg-[#F2EAE0] dark:hover:bg-[#22222B] text-[#C85A32] dark:text-[#E06F45] border border-[#C85A32]/40 rounded text-xs font-semibold uppercase tracking-wider transition-colors w-fit"
          >
            <MessageSquarePlus size={14} />
            <span>{showReviewForm ? 'Cancel Review' : 'Write a Review'}</span>
          </button>
        </div>

        {/* Review Form Drawer */}
        {showReviewForm && (
          <form onSubmit={handleReviewSubmit} className="bg-[#FFFFFF] dark:bg-[#1A1A20] p-6 rounded border border-[#EDE4D8] dark:border-[#2A2A33] mb-8 space-y-4 max-w-xl animate-in fade-in duration-200">
            <h3 className="font-serif font-bold text-base text-[#1C1A18] dark:text-[#F5F3EF]">
              Submit Your Review
            </h3>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#877F74] mb-1">Rating</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setUserRating(star)}
                    className="p-1 text-amber-500 hover:scale-110 transition-transform"
                    aria-label={`${star} Stars`}
                  >
                    <Star size={20} className={star <= userRating ? "fill-current" : "text-gray-300 dark:text-gray-600"} />
                  </button>
                ))}
                <span className="text-xs font-bold text-[#1C1A18] dark:text-[#F5F3EF] ml-2">{userRating} / 5 Stars</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#877F74] mb-1">Your Name</label>
                <input
                  required
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="e.g., Jane Austen"
                  className="w-full bg-[#FAF6EE] dark:bg-[#121215] text-[#1C1A18] dark:text-[#F5F3EF] text-xs p-2.5 rounded border border-[#DCD0BF] dark:border-[#363644] outline-none focus:border-[#C85A32]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#877F74] mb-1">Review Headline</label>
                <input
                  type="text"
                  value={userTitle}
                  onChange={(e) => setUserTitle(e.target.value)}
                  placeholder="e.g., A masterpiece of prose"
                  className="w-full bg-[#FAF6EE] dark:bg-[#121215] text-[#1C1A18] dark:text-[#F5F3EF] text-xs p-2.5 rounded border border-[#DCD0BF] dark:border-[#363644] outline-none focus:border-[#C85A32]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#877F74] mb-1">Your Thoughts & Impressions</label>
              <textarea
                required
                rows={3}
                value={userComment}
                onChange={(e) => setUserComment(e.target.value)}
                placeholder="Share your experience reading this book..."
                className="w-full bg-[#FAF6EE] dark:bg-[#121215] text-[#1C1A18] dark:text-[#F5F3EF] text-xs p-2.5 rounded border border-[#DCD0BF] dark:border-[#363644] outline-none focus:border-[#C85A32]"
              />
            </div>

            <button
              type="submit"
              className="px-5 py-2 bg-[#1C1A18] text-[#FAF6EE] dark:bg-[#FAF6EE] dark:text-[#1C1A18] text-xs font-semibold uppercase tracking-wider rounded hover:bg-[#2E2A27]"
            >
              Post Review
            </button>
          </form>
        )}

        {/* Reviews List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reviewsList.map((review) => (
            <div 
              key={review.id} 
              className="bg-[#FFFFFF] dark:bg-[#1A1A20] p-5 rounded border border-[#EDE4D8] dark:border-[#2A2A33] shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-semibold text-xs text-[#1C1A18] dark:text-[#F5F3EF]">{review.name}</span>
                  <div className="flex items-center text-amber-600 dark:text-amber-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star 
                        key={i} 
                        size={12} 
                        className={i < review.rating ? "fill-current" : "text-gray-200 dark:text-gray-700"} 
                      />
                    ))}
                  </div>
                </div>
                <h4 className="font-serif font-bold text-sm text-[#1C1A18] dark:text-[#F5F3EF] mb-1">
                  "{review.title}"
                </h4>
                <p className="text-xs text-[#575047] dark:text-[#CBC4B8] leading-relaxed">
                  {review.comment}
                </p>
              </div>
              <div className="text-[10px] text-[#877F74] dark:text-[#8E887E] mt-3 pt-2 border-t border-[#EDE4D8]/50 dark:border-[#2A2A33]">
                {review.date}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Related Books in Genre */}
      {relatedBooks.length > 0 && (
        <section className="pt-10 border-t border-[#DCD0BF]/70 dark:border-[#2A2A33]">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-6">
            <div>
              <h2 className="font-serif text-2xl font-bold text-[#1C1A18] dark:text-[#F5F3EF]">
                Volumes in the Same Subject
              </h2>
              <p className="text-xs text-[#877F74] dark:text-[#8E887E] mt-0.5">
                Explore adjacent titles in the {book.genre} category
              </p>
            </div>
            <Link 
              to={`/books?category=${encodeURIComponent(book.genre)}`} 
              className="text-xs font-semibold uppercase tracking-wider text-[#C85A32] dark:text-[#E06F45] hover:underline"
            >
              View More {book.genre} &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedBooks.map(b => (
              <BookCard key={b.id} book={b} />
            ))}
          </div>
        </section>
      )}

      {/* Mobile Sticky Purchasing Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-3 bg-[#FAF6EE]/95 dark:bg-[#121215]/95 backdrop-blur-md border-t border-[#DCD0BF] dark:border-[#363644] z-40 flex items-center justify-between gap-3 shadow-lg">
        <div>
          <span className="text-[10px] text-[#877F74] block">Price</span>
          <span className="font-serif font-bold text-lg text-[#1C1A18] dark:text-[#F5F3EF]">
            ₹{Number(book.price).toLocaleString('en-IN')}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={handleAddToCart}
            disabled={book.stockQuantity === 0}
            className="py-2.5 px-4 bg-[#FAF6EE] text-[#1C1A18] dark:bg-[#22222B] dark:text-[#F5F3EF] border border-[#DCD0BF] dark:border-[#363644] text-xs font-semibold uppercase rounded"
          >
            Add
          </button>
          <button 
            onClick={handleBuyNow}
            disabled={book.stockQuantity === 0}
            className="py-2.5 px-5 bg-[#1C1A18] text-[#FAF6EE] dark:bg-[#FAF6EE] dark:text-[#1C1A18] text-xs font-semibold uppercase tracking-wider rounded shadow-sm disabled:opacity-40"
          >
            {book.stockQuantity === 0 ? 'Out of Stock' : 'Buy Now'}
          </button>
        </div>
      </div>

    </div>
  );
};

export default BookDetail;
