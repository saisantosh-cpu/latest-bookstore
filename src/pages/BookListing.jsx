import React, { useState, useMemo, useEffect } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { Filter, Search, X, SlidersHorizontal, ArrowUpDown, BookOpen } from 'lucide-react';
import { useBooks } from '../context/BookContext';
import { mockCategories } from '../data/mockData';
import BookCard from '../components/BookCard';
import { getCatalogCriteria, findNavNode } from '../data/catalog';

// Editorial Skeleton Loader
const SkeletonCard = () => (
  <div className="bg-[#FFFFFF] dark:bg-[#1A1A20] rounded border border-[#EDE4D8] dark:border-[#2A2A33] overflow-hidden animate-pulse flex flex-col h-[380px]">
    <div className="w-full aspect-[2/3] bg-[#EAE0D1] dark:bg-[#22222B]"></div>
    <div className="p-4 flex flex-col flex-grow">
      <div className="h-2.5 w-1/3 bg-[#EAE0D1] dark:bg-[#22222B] rounded mb-3"></div>
      <div className="h-4 w-3/4 bg-[#EAE0D1] dark:bg-[#22222B] rounded mb-2"></div>
      <div className="h-3 w-1/2 bg-[#EAE0D1] dark:bg-[#22222B] rounded mb-4"></div>
      <div className="mt-auto pt-3 border-t border-[#EDE4D8]/50 dark:border-[#2A2A33] flex justify-between items-center">
        <div className="h-5 w-1/4 bg-[#EAE0D1] dark:bg-[#22222B] rounded"></div>
        <div className="h-8 w-24 bg-[#EAE0D1] dark:bg-[#22222B] rounded"></div>
      </div>
    </div>
  </div>
);

const BookListing = () => {
  const { books, booksLoading, hasMore, loadingMore, loadMoreBooks, catalogBooks, catalogLoading, catalogHasMore, catalogLoadingMore, setCatalogCriteria, loadMoreCatalogBooks, searchResults, searchLoading, runSearch } = useBooks();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const catalogCriteria = useMemo(() => getCatalogCriteria(location.pathname), [location.pathname]);
  const navNode = useMemo(() => findNavNode(location.pathname), [location.pathname]);

  // Search & Filter States
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const isSearching = debouncedSearch.trim().length > 0;
  // A search checks the ENTIRE catalog (via runSearch, fetched fresh below)
  // and ignores whatever category page you're currently on — searching
  // should find a match anywhere in the store, not just here.
  const activeBooks = isSearching ? searchResults : (catalogCriteria ? catalogBooks : books);
  const activeLoading = isSearching ? searchLoading : (catalogCriteria ? catalogLoading : booksLoading);
  const activeHasMore = isSearching ? false : (catalogCriteria ? catalogHasMore : hasMore);
  const activeLoadingMore = isSearching ? false : (catalogCriteria ? catalogLoadingMore : loadingMore);
  const loadMore = catalogCriteria ? loadMoreCatalogBooks : loadMoreBooks;
  const pageAuthors = useMemo(() => [...new Set(activeBooks.map((book) => book.author).filter(Boolean))], [activeBooks]);
  const pageCompanies = useMemo(() => [...new Set(activeBooks.map((book) => book.company).filter(Boolean))], [activeBooks]);

  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  const [selectedCategories, setSelectedCategories] = useState([]);
  const [maxPrice, setMaxPrice] = useState(10000);
  const [minRating, setMinRating] = useState(0);
  const [selectedAuthor, setSelectedAuthor] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [minDiscount, setMinDiscount] = useState(0); 
  const [sortBy, setSortBy] = useState('popularity');
  const [specialFilter, setSpecialFilter] = useState(''); // 'featured' | 'bestseller'

  // Read URL search params on mount or param changes
  useEffect(() => {
    const querySearch = searchParams.get('search') || '';
    const queryCat = searchParams.get('category') || '';
    const queryFilter = searchParams.get('filter') || '';
    const querySort = searchParams.get('sort') || '';

    if (querySearch) {
      setSearchInput(querySearch);
      setDebouncedSearch(querySearch);
    }
    if (queryCat) {
      setSelectedCategories([queryCat]);
    }
    if (queryFilter) {
      setSpecialFilter(queryFilter);
    }
    if (querySort) {
      setSortBy(querySort);
    }
  }, [searchParams]);

  useEffect(() => {
    setCatalogCriteria(catalogCriteria);
    return () => setCatalogCriteria(null);
  }, [catalogCriteria, setCatalogCriteria]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Run a whole-catalog search whenever the debounced query changes
  useEffect(() => {
    if (debouncedSearch.trim()) {
      runSearch(debouncedSearch.trim());
    }
  }, [debouncedSearch, runSearch]);

  // Filtered & Sorted books calculation
  const filteredBooks = useMemo(() => {
    let result = [...activeBooks];

    if (debouncedSearch.trim()) {
      const lowerQuery = debouncedSearch.toLowerCase().trim();
      result = result.filter(
        b => (b.title || '').toLowerCase().includes(lowerQuery) || 
             (b.author || '').toLowerCase().includes(lowerQuery) ||
             (b.genre && b.genre.toLowerCase().includes(lowerQuery)) ||
             (b.company && b.company.toLowerCase().includes(lowerQuery))
      );
    }

    if (selectedCategories.length > 0) {
      result = result.filter(b => selectedCategories.includes(b.genre));
    }

    if (maxPrice < 10000) {
      result = result.filter(b => b.price <= maxPrice);
    }

    if (minRating > 0) {
      result = result.filter(b => b.rating >= minRating);
    }

    if (selectedAuthor) {
      result = result.filter(b => b.author === selectedAuthor);
    }

    if (selectedCompany) {
      result = result.filter(b => b.company === selectedCompany);
    }

    if (minDiscount > 0) {
      result = result.filter(b => (b.discountPercentage || 0) >= minDiscount);
    }

    if (specialFilter === 'featured') {
      result = result.filter(b => b.featured);
    } else if (specialFilter === 'bestseller') {
      result = result.filter(b => b.trending);
    }

    // Sort
    switch (sortBy) {
      case 'price-low':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'newest':
        result.sort((a, b) => new Date(b.dateAdded || 0) - new Date(a.dateAdded || 0));
        break;
      case 'popularity':
      default:
        result.sort((a, b) => {
          const scoreA = (a.rating || 0) + (a.featured ? 0.5 : 0) + ((a.reviewsCount || 0) / 10000);
          const scoreB = (b.rating || 0) + (b.featured ? 0.5 : 0) + ((b.reviewsCount || 0) / 10000);
          return scoreB - scoreA;
        });
        break;
    }

    return result;
  }, [activeBooks, debouncedSearch, selectedCategories, maxPrice, minRating, selectedAuthor, selectedCompany, minDiscount, specialFilter, sortBy]);

  const clearFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setSelectedCategories([]);
    setMaxPrice(10000);
    setMinRating(0);
    setSelectedAuthor('');
    setSelectedCompany('');
    setMinDiscount(0);
    setSpecialFilter('');
    setSearchParams({});
  };

  const removeCategory = (cat) => {
    setSelectedCategories(prev => prev.filter(c => c !== cat));
  };

  const hasActiveFilters = 
    debouncedSearch.length > 0 || 
    selectedCategories.length > 0 || 
    maxPrice < 10000 || 
    minRating > 0 || 
    selectedAuthor || 
    selectedCompany || 
    minDiscount > 0 || 
    specialFilter;

  // Sidebar Filter Content
  const FilterContent = () => (
    <div className="space-y-6 font-sans text-sm">
      
      {/* Categories */}
      <div className="pb-5 border-b border-[#EDE4D8] dark:border-[#2A2A33]">
        <h3 className="font-serif font-bold text-base text-[#1C1A18] dark:text-[#F5F3EF] mb-3">
          Subjects & Genres
        </h3>
        <div className="space-y-2 max-h-52 overflow-y-auto pr-1 custom-scrollbar">
          {mockCategories.filter(cat => cat !== 'All').map(cat => {
            const count = activeBooks.filter(b => b.genre === cat).length;
            const isChecked = selectedCategories.includes(cat);
            return (
              <label key={cat} className="flex items-center justify-between cursor-pointer group select-none">
                <div className="flex items-center gap-2.5">
                  <input 
                    type="checkbox" 
                    checked={isChecked}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setSelectedCategories(prev => checked ? [...prev, cat] : prev.filter(c => c !== cat));
                    }}
                    className="w-4 h-4 rounded text-[#C85A32] focus:ring-[#C85A32] border-[#DCD0BF] dark:border-[#363644] bg-[#FFFFFF] dark:bg-[#1A1A20]" 
                  />
                  <span className={`text-xs sm:text-sm ${isChecked ? 'font-semibold text-[#1C1A18] dark:text-[#F5F3EF]' : 'text-[#575047] dark:text-[#CBC4B8] group-hover:text-[#1C1A18] dark:group-hover:text-[#F5F3EF]'}`}>
                    {cat}
                  </span>
                </div>
                <span className="text-[11px] text-[#877F74] dark:text-[#8E887E]">
                  {count}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Price Range */}
      <div className="pb-5 border-b border-[#EDE4D8] dark:border-[#2A2A33]">
        <div className="flex justify-between items-baseline mb-2">
          <h3 className="font-serif font-bold text-base text-[#1C1A18] dark:text-[#F5F3EF]">Max Price</h3>
          <span className="text-xs font-bold text-[#C85A32] dark:text-[#E06F45]">₹{maxPrice.toLocaleString('en-IN')}</span>
        </div>
        <input 
          type="range"
          min="500"
          max="10000"
          step="100"
          value={maxPrice}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
          className="w-full h-1.5 bg-[#EDE4D8] dark:bg-[#2A2A33] rounded appearance-none cursor-pointer accent-[#C85A32]"
        />
        <div className="flex justify-between text-[10px] text-[#877F74] dark:text-[#8E887E] mt-1">
          <span>₹500</span>
          <span>₹10,000</span>
        </div>
      </div>

      {/* Minimum Discount */}
      <div className="pb-5 border-b border-[#EDE4D8] dark:border-[#2A2A33]">
        <h3 className="font-serif font-bold text-base text-[#1C1A18] dark:text-[#F5F3EF] mb-2.5">Discounts</h3>
        <div className="grid grid-cols-2 gap-1.5">
          {[0, 10, 20, 30].map((disc) => (
            <button 
              key={disc}
              type="button"
              onClick={() => setMinDiscount(disc)}
              className={`text-xs py-1.5 px-2 rounded border transition-colors ${
                minDiscount === disc 
                  ? 'bg-[#1C1A18] text-[#FAF6EE] dark:bg-[#FAF6EE] dark:text-[#1C1A18] border-transparent font-semibold' 
                  : 'bg-transparent text-[#575047] dark:text-[#CBC4B8] border-[#DCD0BF] dark:border-[#363644] hover:border-[#877F74]'
              }`}
            >
              {disc === 0 ? 'All Editions' : `${disc}%+ Off`}
            </button>
          ))}
        </div>
      </div>

      {/* Authors Filter */}
      {pageAuthors.length > 0 && (
        <div className="pb-5 border-b border-[#EDE4D8] dark:border-[#2A2A33]">
          <h3 className="font-serif font-bold text-base text-[#1C1A18] dark:text-[#F5F3EF] mb-2">Author</h3>
          <select 
            value={selectedAuthor} 
            onChange={(e) => setSelectedAuthor(e.target.value)}
            className="w-full text-xs bg-[#FFFFFF] dark:bg-[#1A1A20] text-[#1C1A18] dark:text-[#F5F3EF] border border-[#DCD0BF] dark:border-[#363644] rounded p-2 focus:border-[#C85A32] outline-none"
          >
            <option value="">All Authors</option>
            {pageAuthors.map(author => <option key={author} value={author}>{author}</option>)}
          </select>
        </div>
      )}

      {/* Publishers Filter */}
      {pageCompanies.length > 0 && (
        <div>
          <h3 className="font-serif font-bold text-base text-[#1C1A18] dark:text-[#F5F3EF] mb-2">Publisher</h3>
          <select 
            value={selectedCompany} 
            onChange={(e) => setSelectedCompany(e.target.value)}
            className="w-full text-xs bg-[#FFFFFF] dark:bg-[#1A1A20] text-[#1C1A18] dark:text-[#F5F3EF] border border-[#DCD0BF] dark:border-[#363644] rounded p-2 focus:border-[#C85A32] outline-none"
          >
            <option value="">All Publishers</option>
            {pageCompanies.map(company => <option key={company} value={company}>{company}</option>)}
          </select>
        </div>
      )}

      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="w-full py-2 text-xs font-semibold uppercase tracking-wider text-[#C85A32] dark:text-[#E06F45] hover:bg-[#F2EAE0] dark:hover:bg-[#22222B] rounded border border-dashed border-[#C85A32]/40 transition-colors"
        >
          Reset All Filters
        </button>
      )}

    </div>
  );

  return (
    <div className="pb-20 font-sans">
      
      {/* Header Banner */}
      <div className="mb-8 pb-6 border-b border-[#DCD0BF]/70 dark:border-[#2A2A33]">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-[11px] text-[#877F74] dark:text-[#8E887E] mb-3">
          <Link to="/" className="hover:text-[#C85A32] transition-colors">Home</Link>
          <span aria-hidden="true">/</span>
          <Link to="/books" className="hover:text-[#C85A32] transition-colors">Catalog</Link>
          {catalogCriteria && <><span aria-hidden="true">/</span><span className="font-medium text-[#575047] dark:text-[#CBC4B8]">{catalogCriteria.label}</span></>}
        </nav>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest-editorial font-bold text-[#C85A32] dark:text-[#E06F45] mb-1">
              <BookOpen size={13} />
              <span>Catalog & Editions</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#1C1A18] dark:text-[#F5F3EF]">
              {catalogCriteria?.label || 'The Bookstore Collection'}
            </h1>
            <p className="text-xs sm:text-sm text-[#575047] dark:text-[#CBC4B8] mt-1">
              {catalogCriteria ? `Browse products curated for ${catalogCriteria.label}. Search and filters stay within this category.` : 'Explore our curated library of titles, searchable by subject, author, and edition'}
            </p>

            {navNode?.children && navNode.children.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#877F74] self-center mr-1">Refine:</span>
                {navNode.children.map((child) => (
                  <Link
                    key={child.to}
                    to={child.to}
                    className="px-3 py-1 text-xs font-semibold rounded-full border border-[#DCD0BF] dark:border-[#363644] text-[#575047] dark:text-[#CBC4B8] hover:border-[#C85A32] hover:text-[#C85A32] dark:hover:text-[#E06F45] transition-colors"
                  >
                    {child.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="text-xs text-[#877F74] dark:text-[#8E887E]">
            Showing <span className="font-bold text-[#1C1A18] dark:text-[#F5F3EF]">{filteredBooks.length}</span> {filteredBooks.length === 1 ? 'title' : 'titles'}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2" aria-label="Browse main catalog sections">
          <span className="text-[10px] uppercase tracking-widest font-semibold text-[#877F74] dark:text-[#8E887E] mr-1">Quick browse</span>
          {[
            ['All Books', '/books'], ['School & Exams', '/books/intermediate'], ['Degree', '/books/degree'],
            ['Stationery', '/stationery'], ['Medical Essentials', '/essentials'],
          ].map(([label, to]) => <Link key={to} to={to} className="px-3 py-1.5 rounded-full border border-[#DCD0BF] dark:border-[#363644] bg-[#FFFFFF] dark:bg-[#1A1A20] text-xs font-medium text-[#575047] dark:text-[#CBC4B8] hover:border-[#C85A32] hover:text-[#C85A32] dark:hover:text-[#E06F45] transition-colors">{label}</Link>)}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Desktop Sidebar Filters */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="bg-[#FFFFFF] dark:bg-[#1A1A20] p-5 rounded border border-[#EDE4D8] dark:border-[#2A2A33] sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#EDE4D8] dark:border-[#2A2A33]">
              <div className="flex items-center gap-2 text-sm font-bold text-[#1C1A18] dark:text-[#F5F3EF]">
                <Filter size={16} className="text-[#C85A32]" />
                <span>Refine Search</span>
              </div>
            </div>
            <FilterContent />
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-grow w-full">
          
          {/* Top Search & Sort Bar */}
          <div className="mb-6 flex flex-col sm:flex-row gap-3 justify-between items-center bg-[#FFFFFF] dark:bg-[#1A1A20] p-3.5 rounded border border-[#EDE4D8] dark:border-[#2A2A33] shadow-sm">
            
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#877F74]" size={15} />
              <input 
                type="search" 
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search catalog by title, author, genre..."
                className="w-full bg-[#FAF6EE] dark:bg-[#121215] text-[#1C1A18] dark:text-[#F5F3EF] placeholder-[#877F74] text-xs sm:text-sm pl-9 pr-8 py-2 rounded border border-[#DCD0BF] dark:border-[#363644] focus:border-[#C85A32] outline-none"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#877F74] hover:text-[#1C1A18]"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Mobile Controls / Sort Dropdown */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
              {/* Mobile Filter Button */}
              <button 
                onClick={() => setIsFilterDrawerOpen(true)}
                className="lg:hidden flex items-center gap-1.5 px-3 py-2 bg-[#FAF6EE] dark:bg-[#121215] text-[#1C1A18] dark:text-[#F5F3EF] rounded border border-[#DCD0BF] dark:border-[#363644] text-xs font-semibold"
              >
                <SlidersHorizontal size={14} />
                <span>Filters {selectedCategories.length > 0 && `(${selectedCategories.length})`}</span>
              </button>

              {/* Sort Control */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-[#877F74] whitespace-nowrap hidden sm:inline">Sort:</span>
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-[#FAF6EE] dark:bg-[#121215] text-[#1C1A18] dark:text-[#F5F3EF] border border-[#DCD0BF] dark:border-[#363644] text-xs font-medium rounded py-2 px-2.5 outline-none focus:border-[#C85A32]"
                >
                  <option value="popularity">Popularity</option>
                  <option value="newest">Newest Additions</option>
                  <option value="rating">Highest Rated</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
              </div>
            </div>

          </div>

          {/* Active Filter Indicators */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 mb-6 text-xs">
              <span className="text-[#877F74]">Active Filters:</span>
              
              {debouncedSearch && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#F2EAE0] dark:bg-[#22222B] text-[#1C1A18] dark:text-[#F5F3EF] border border-[#DCD0BF] dark:border-[#363644]">
                  Search: "{debouncedSearch}"
                  <button onClick={() => { setSearchInput(''); setDebouncedSearch(''); }} className="hover:text-[#C85A32]"><X size={12} /></button>
                </span>
              )}

              {specialFilter && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#F2EAE0] dark:bg-[#22222B] text-[#1C1A18] dark:text-[#F5F3EF] border border-[#DCD0BF] dark:border-[#363644]">
                  Filter: {specialFilter}
                  <button onClick={() => setSpecialFilter('')} className="hover:text-[#C85A32]"><X size={12} /></button>
                </span>
              )}

              {selectedCategories.map(cat => (
                <span key={cat} className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#F2EAE0] dark:bg-[#22222B] text-[#1C1A18] dark:text-[#F5F3EF] border border-[#DCD0BF] dark:border-[#363644]">
                  {cat}
                  <button onClick={() => removeCategory(cat)} className="hover:text-[#C85A32]"><X size={12} /></button>
                </span>
              ))}

              {maxPrice < 10000 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#F2EAE0] dark:bg-[#22222B] text-[#1C1A18] dark:text-[#F5F3EF] border border-[#DCD0BF] dark:border-[#363644]">
                  Under ₹{maxPrice}
                  <button onClick={() => setMaxPrice(10000)} className="hover:text-[#C85A32]"><X size={12} /></button>
                </span>
              )}

              {selectedAuthor && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#F2EAE0] dark:bg-[#22222B] text-[#1C1A18] dark:text-[#F5F3EF] border border-[#DCD0BF] dark:border-[#363644]">
                  Author: {selectedAuthor}
                  <button onClick={() => setSelectedAuthor('')} className="hover:text-[#C85A32]"><X size={12} /></button>
                </span>
              )}

              {minDiscount > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#F2EAE0] dark:bg-[#22222B] text-[#1C1A18] dark:text-[#F5F3EF] border border-[#DCD0BF] dark:border-[#363644]">
                  {minDiscount}%+ Off
                  <button onClick={() => setMinDiscount(0)} className="hover:text-[#C85A32]"><X size={12} /></button>
                </span>
              )}

              <button 
                onClick={clearFilters} 
                className="text-xs font-semibold text-[#C85A32] dark:text-[#E06F45] underline underline-offset-2 ml-1"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Book Catalog Grid */}
          {activeLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(n => <SkeletonCard key={n} />)}
            </div>
          ) : filteredBooks.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBooks.map(book => (
                  <BookCard key={book.id} book={book} />
                ))}
              </div>

              {activeHasMore && (
                <div className="text-center mt-10">
                  <button
                    onClick={loadMore}
                    disabled={activeLoadingMore}
                    className="px-8 py-3 bg-[#1C1A18] hover:bg-[#2E2A27] disabled:opacity-60 text-[#FAF6EE] dark:bg-[#FAF6EE] dark:hover:bg-white dark:text-[#1C1A18] text-xs font-semibold uppercase tracking-wider rounded transition-colors"
                  >
                    {activeLoadingMore ? 'Loading…' : 'Load More Products'}
                  </button>
                  <p className="text-[11px] text-[#877F74] mt-2">
                    Search and filters apply to the loaded portion of this paginated catalog.
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20 bg-[#FFFFFF] dark:bg-[#1A1A20] rounded border border-[#EDE4D8] dark:border-[#2A2A33] p-8 shadow-sm">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[#FAF6EE] dark:bg-[#121215] flex items-center justify-center text-[#877F74]">
                <BookOpen size={24} />
              </div>
              <h3 className="font-serif text-2xl font-bold text-[#1C1A18] dark:text-[#F5F3EF] mb-2">
                {isSearching ? `No results for "${debouncedSearch.trim()}"` : 'No volumes match your criteria'}
              </h3>
              <p className="text-xs sm:text-sm text-[#575047] dark:text-[#CBC4B8] max-w-sm mx-auto mb-6">
                {isSearching ? "We checked every product in the store and couldn't find a match. Try a different spelling or a shorter search term." : 'No products match this selection yet. Try a broader search, remove a filter, or explore another catalog section.'}
              </p>
              <button 
                onClick={clearFilters}
                className="px-5 py-2.5 bg-[#1C1A18] text-[#FAF6EE] dark:bg-[#FAF6EE] dark:text-[#1C1A18] text-xs font-semibold uppercase tracking-wider rounded hover:bg-[#2E2A27] dark:hover:bg-[#FFFFFF] transition-colors"
              >
                Clear Filters & Browse All
              </button>
            </div>
          )}

        </main>
      </div>

      {/* Mobile Filter Drawer */}
      {isFilterDrawerOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setIsFilterDrawerOpen(false)}></div>
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-[#FAF6EE] dark:bg-[#121215] h-full shadow-2xl p-6 overflow-y-auto animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-[#EDE4D8] dark:border-[#2A2A33] mb-6">
              <div className="flex items-center gap-2 font-serif font-bold text-lg text-[#1C1A18] dark:text-[#F5F3EF]">
                <Filter size={18} className="text-[#C85A32]" />
                <span>Filters</span>
              </div>
              <button 
                onClick={() => setIsFilterDrawerOpen(false)} 
                className="p-1 text-[#877F74] hover:text-[#1C1A18]"
                aria-label="Close filters"
              >
                <X size={20} />
              </button>
            </div>
            
            <FilterContent />

            <div className="mt-8 pt-4 border-t border-[#EDE4D8] dark:border-[#2A2A33]">
              <button 
                onClick={() => setIsFilterDrawerOpen(false)}
                className="w-full py-2.5 bg-[#1C1A18] text-[#FAF6EE] dark:bg-[#FAF6EE] dark:text-[#1C1A18] text-xs font-semibold uppercase tracking-wider rounded"
              >
                Show {filteredBooks.length} Books
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default BookListing;
