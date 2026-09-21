import React, { useState, useMemo, useEffect } from 'react';
import { Book, Plus, Edit, Trash2, Search, X, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Package, LayoutGrid, Upload, Tag, Eye, ImageOff } from 'lucide-react';
import { useBooks } from '../context/BookContext';
import { useOrders } from '../context/OrderContext';
import { useToast } from '../context/ToastContext';
import { uploadBookCoverImage } from '../services/storage';
import { mockCategories } from '../data/mockData';
import { BOOK_CATEGORIES, EXAMS, APRON_SIZES, MEDICAL_ESSENTIAL_CATEGORIES, ENGINEERING_ESSENTIAL_CATEGORIES, PRODUCT_TYPES, STATIONERY_CATEGORIES, STREAMS, SCHOOL_CLASSES, INTER_YEARS } from '../data/catalog';
import AdminOrders from '../components/AdminOrders';
import BulkUploadBooks from '../components/BulkUploadBooks';
import AdminCoupons from '../components/AdminCoupons';

const AdminDashboard = () => {
  const { books, addBook, updateBook, deleteBook, booksLoading, hasMore, loadingMore, loadMoreBooks } = useBooks();
  const { unreadCount } = useOrders();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('books'); // 'books' | 'orders'
  const [search, setSearch] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);
  const [imageLoadFailed, setImageLoadFailed] = useState(false);
  // Debounce the preview so it only tries to load the image after typing
  // pauses, instead of firing a new load attempt on every single keystroke
  // (which is what was making the field feel like it was hanging).
  const [debouncedImageUrl, setDebouncedImageUrl] = useState('');
  const [localPreviewUrl, setLocalPreviewUrl] = useState(null);
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedImageUrl(formData.image);
      setImageLoadFailed(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [formData.image]);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Sorting State
  const [sortConfig, setSortConfig] = useState({ key: 'title', direction: 'asc' });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '', author: '', company: '', price: '', originalPrice: '', discountPercentage: '', genre: 'Fantasy', productType: 'book', category: '', subcategory: '', stream: '', exams: [], sizes: [], image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=600'
  });

  const handleDelete = async (id) => {
    if(window.confirm('Are you sure you want to delete this book?')) {
      try {
        await deleteBook(id);
        // Adjust page if necessary
        if (currentItems.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        }
      } catch (err) {
        console.error('Failed to delete book:', err);
        toast?.show('Could not delete the book. Please try again.', 'error');
      }
    }
  };

  const handleOpenAdd = () => {
    setEditingBook(null);
    const defaults = { title: '', author: '', company: '', price: '', originalPrice: '', discountPercentage: '', stockQuantity: '', genre: 'Fantasy', productType: 'book', category: '', subcategory: '', schoolClass: '', interYear: '', stream: '', exams: [], sizes: [], image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=600' };
    setFormData(defaults);
    setDebouncedImageUrl(defaults.image);
    setImageLoadFailed(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (book) => {
    setEditingBook(book);
    const merged = { productType: 'book', category: '', subcategory: '', schoolClass: '', interYear: '', stream: '', exams: [], sizes: [], ...book };
    setFormData(merged);
    setDebouncedImageUrl(merged.image || '');
    setImageLoadFailed(false);
    setIsModalOpen(true);
  };

  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Show the picked photo immediately, straight from the device — no
    // waiting on the network to see what was selected.
    const objectUrl = URL.createObjectURL(file);
    setLocalPreviewUrl(objectUrl);
    setImageLoadFailed(false);
    setIsUploadingImage(true);
    try {
      const url = await uploadBookCoverImage(file);
      setFormData((prev) => ({ ...prev, image: url }));
      setDebouncedImageUrl(url);
      setImageLoadFailed(false);
      toast?.show('Cover image uploaded.', 'success');
    } catch (err) {
      console.error('Cover image upload failed:', err);
      toast?.show(err.message || 'Could not upload the image. Please try again.', 'error');
    } finally {
      setIsUploadingImage(false);
      URL.revokeObjectURL(objectUrl);
      setLocalPreviewUrl(null);
      e.target.value = ''; // allow re-selecting the same file later
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newBook = {
      ...formData,
      price: Number(formData.price),
      originalPrice: Number(formData.originalPrice),
      discountPercentage: Number(formData.discountPercentage),
      stockQuantity: Number(formData.stockQuantity) || 0,
      exams: formData.exams || [],
      rating: editingBook ? editingBook.rating : 4.5,
      id: editingBook ? editingBook.id : Date.now().toString()
    };

    try {
      if (editingBook) {
        await updateBook(newBook);
      } else {
        await addBook(newBook);
      }
      toast?.show(editingBook ? 'Book updated.' : 'Book published — visible to all customers now.', 'success');
    } catch (err) {
      console.error('Failed to save book:', err);
      toast?.show('Could not save the book. Please try again.', 'error');
      return;
    }
    
    setIsModalOpen(false);
  };

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // 1. Filter
  const filteredBooks = useMemo(() => {
    return books.filter(b => 
      b.title.toLowerCase().includes(search.toLowerCase()) || 
      b.author.toLowerCase().includes(search.toLowerCase())
    );
  }, [books, search]);

  // 2. Sort
  const sortedBooks = useMemo(() => {
    let sortableItems = [...filteredBooks];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (typeof aValue === 'string') aValue = aValue.toLowerCase();
        if (typeof bValue === 'string') bValue = bValue.toLowerCase();

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [filteredBooks, sortConfig]);

  // 3. Paginate
  const totalPages = Math.ceil(sortedBooks.length / itemsPerPage);
  const currentItems = sortedBooks.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) {
      return <div className="flex flex-col ml-1 opacity-20"><ChevronUp size={10} className="-mb-1"/><ChevronDown size={10}/></div>;
    }
    return sortConfig.direction === 'asc' 
      ? <ChevronUp size={14} className="ml-1 text-brandAccent" /> 
      : <ChevronDown size={14} className="ml-1 text-brandAccent" />;
  };

  return (
    <div className="pb-16 relative font-roboto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Backend Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium">Manage your bookstore inventory and operations.</p>
        </div>
        
        {activeTab === 'books' && (
          <div className="flex items-center gap-2 flex-wrap">
            <BulkUploadBooks />
            <button onClick={handleOpenAdd} className="flex items-center px-5 py-2.5 bg-brandAccent hover:bg-amber-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-brandAccent/30 hover:-translate-y-0.5 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brandAccent">
              <Plus size={18} className="mr-2" /> Add New Book
            </button>
          </div>
        )}
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={() => setActiveTab('books')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'books'
              ? 'border-brandAccent text-brandAccent'
              : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
        >
          <LayoutGrid size={16} /> Books
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`relative flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'orders'
              ? 'border-brandAccent text-brandAccent'
              : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
        >
          <Package size={16} /> Orders
          {unreadCount > 0 && (
            <span className="ml-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full">
              {unreadCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('coupons')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'coupons'
              ? 'border-brandAccent text-brandAccent'
              : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
        >
          <Tag size={16} /> Coupons
        </button>
      </div>

      {activeTab === 'orders' ? (
        <AdminOrders />
      ) : activeTab === 'coupons' ? (
        <AdminCoupons />
      ) : (
      <div className="bg-white dark:bg-darkZincAlt rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden relative">
        {/* Table Toolbar */}
        <div className="p-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-darkZincAlt flex justify-between items-center flex-wrap gap-4">
          <div className="relative w-full sm:max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <Search size={18} />
            </div>
            <input 
              type="text" 
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="pl-10 block w-full bg-white border border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-brandAccent focus:outline-none p-3 dark:border-gray-700 dark:bg-darkZinc dark:text-white font-medium" 
              placeholder="Search by title or author..." 
            />
          </div>
          <div className="text-sm font-bold text-gray-500">
            Total Inventory: <span className="text-gray-900 dark:text-white">{filteredBooks.length}</span> items
          </div>
        </div>
        
        {/* Table */}
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-500 uppercase tracking-wider bg-gray-50/80 dark:bg-darkZinc border-b border-gray-100 dark:border-gray-800">
              <tr>
                <th scope="col" className="px-6 py-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" onClick={() => requestSort('title')}>
                  <div className="flex items-center font-bold">Book Details <SortIcon columnKey="title" /></div>
                </th>
                <th scope="col" className="px-6 py-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" onClick={() => requestSort('genre')}>
                  <div className="flex items-center font-bold">Genre <SortIcon columnKey="genre" /></div>
                </th>
                <th scope="col" className="px-6 py-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" onClick={() => requestSort('category')}>
                  <div className="flex items-center font-bold">Category <SortIcon columnKey="category" /></div>
                </th>
                <th scope="col" className="px-6 py-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" onClick={() => requestSort('price')}>
                  <div className="flex items-center font-bold">Price <SortIcon columnKey="price" /></div>
                </th>
                <th scope="col" className="px-6 py-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" onClick={() => requestSort('rating')}>
                  <div className="flex items-center font-bold">Rating <SortIcon columnKey="rating" /></div>
                </th>
                <th scope="col" className="px-6 py-4 font-bold">Status</th>
                <th scope="col" className="px-6 py-4 text-right font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {booksLoading && (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan="7" className="px-6 py-4">
                      <div className="h-12 w-full bg-[#EAE0D1] dark:bg-[#2A2A33] rounded-lg animate-pulse" />
                    </td>
                  </tr>
                ))
              )}
              {!booksLoading && currentItems.map((book) => (
                <tr key={book.id} className="bg-white dark:bg-darkZincAlt hover:bg-gray-50 dark:hover:bg-darkZinc/60 transition-colors group">
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                    <div className="flex items-center gap-4">
                      <img src={book.image} alt={book.title} className="w-12 h-16 object-cover rounded-md shadow-sm border border-gray-200 dark:border-gray-700" />
                      <div>
                         <div className="font-bold line-clamp-1 text-base group-hover:text-brandAccent transition-colors">{book.title}</div>
                        <div className="text-gray-500 dark:text-gray-400 text-sm font-medium mt-0.5">{book.author}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium">
                    <span className="px-2.5 py-1 bg-gray-100 dark:bg-darkZinc text-gray-700 dark:text-gray-300 rounded uppercase tracking-wider text-[10px] border border-gray-200 dark:border-gray-700">
                      {book.genre}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium">
                    <span className="px-2.5 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded uppercase tracking-wider text-[10px] border border-blue-200 dark:border-blue-800">
                      {book.category || book.subcategory || (book.exams && book.exams.length > 0 ? book.exams.join(', ') : '—')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                     <span className="font-black text-[15px] text-gray-900 dark:text-white">₹{book.price.toLocaleString('en-IN')}</span>
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-700 dark:text-gray-300">
                    <span className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 px-2 py-1 w-fit rounded-lg border border-amber-200/50 dark:border-amber-800/50">
                      {book.rating}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1.5">
                       {book.featured && <span className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">Featured</span>}
                       {book.discountPercentage > 0 && <span className="bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">Sale</span>}
                       {!book.featured && !book.discountPercentage && <span className="text-gray-400 font-medium italic text-xs">Standard</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 text-gray-400">
                      <button onClick={() => handleOpenEdit(book)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500 hover:text-brandAccent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brandAccent" aria-label="Edit">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleDelete(book.id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-gray-500 hover:text-red-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500" aria-label="Delete">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!booksLoading && currentItems.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-20 text-center text-gray-500">
                     <div className="bg-gray-50 dark:bg-darkZinc w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                       <Book className="text-gray-400 dark:text-gray-500" size={24} />
                     </div>
                    <p className="font-bold text-gray-900 dark:text-white text-lg">No entries found.</p>
                    <p className="text-sm mt-1">Try tweaking your search.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {hasMore && (
          <div className="text-center py-4 border-t border-gray-100 dark:border-gray-800">
            <button
              onClick={loadMoreBooks}
              disabled={loadingMore}
              className="text-sm font-bold text-brandAccent hover:underline disabled:opacity-60"
            >
              {loadingMore ? 'Loading…' : `Load more books (currently showing ${books.length})`}
            </button>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-darkZincAlt">
            <span className="text-sm font-bold text-gray-500">
              Showing <span className="text-gray-900 dark:text-white">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-gray-900 dark:text-white">{Math.min(currentPage * itemsPerPage, filteredBooks.length)}</span> of <span className="text-gray-900 dark:text-white">{filteredBooks.length}</span>
            </span>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg bg-white dark:bg-darkZinc border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous Page"
              >
                <ChevronLeft size={16} />
              </button>
              
              <div className="flex gap-1">
                {Array.from({length: totalPages}).map((_, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setCurrentPage(idx + 1)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold transition-colors ${currentPage === idx + 1 ? 'bg-brandAccent text-white border-brandAccent shadow-sm' : 'bg-white dark:bg-darkZinc border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>

              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg bg-white dark:bg-darkZinc border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Next Page"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-darkZincAlt rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-gray-800 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 sm:p-8 border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white/95 dark:bg-darkZincAlt/95 backdrop-blur z-10">
              <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{editingBook ? 'Edit Inventory Item' : 'New Inventory Item'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-500 hover:text-red-500 bg-gray-100 hover:bg-red-50 dark:bg-darkZinc dark:hover:bg-red-900/20 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500">
                <X size={20}/>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Product Name</label>
                <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-darkZinc dark:text-white focus:ring-2 focus:ring-brandAccent focus:outline-none font-medium" />
              </div>
              
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Author</label>
                <input required={formData.productType === 'book'} type="text" value={formData.author} onChange={e => setFormData({...formData, author: e.target.value})} placeholder={formData.productType === 'book' ? '' : 'Not required for this product type'} className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-darkZinc dark:text-white focus:ring-2 focus:ring-brandAccent focus:outline-none font-medium" />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Publisher / Company</label>
                <input required type="text" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-darkZinc dark:text-white focus:ring-2 focus:ring-brandAccent focus:outline-none font-medium" />
              </div>
              
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Selling Price (₹)</label>
                <input required type="number" min="0" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-darkZinc dark:text-white focus:ring-2 focus:ring-brandAccent focus:outline-none font-medium" />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Original Price (₹) <span className="font-normal normal-case text-gray-400">(Optional)</span></label>
                <input type="number" min="0" value={formData.originalPrice} onChange={e => setFormData({...formData, originalPrice: e.target.value})} className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-darkZinc dark:text-white focus:ring-2 focus:ring-brandAccent focus:outline-none font-medium" />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Discount Percentage</label>
                <input type="number" min="0" max="100" value={formData.discountPercentage} onChange={e => setFormData({...formData, discountPercentage: e.target.value})} className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-darkZinc dark:text-white focus:ring-2 focus:ring-brandAccent focus:outline-none font-medium" />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Stock Quantity</label>
                <input required type="number" min="0" value={formData.stockQuantity} onChange={e => setFormData({...formData, stockQuantity: e.target.value})} className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-darkZinc dark:text-white focus:ring-2 focus:ring-brandAccent focus:outline-none font-medium" />
                <p className="text-[11px] text-gray-400 mt-1.5">Decreases automatically as orders come in; restored if an order is cancelled.</p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Genre</label>
                <select value={formData.genre} onChange={e => setFormData({...formData, genre: e.target.value})} className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-darkZinc dark:text-white focus:ring-2 focus:ring-brandAccent focus:outline-none font-medium">
                  {mockCategories.filter(c => c !== 'All').map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Product Type</label>
                <select value={formData.productType} onChange={e => setFormData({...formData, productType: e.target.value, category: '', subcategory: '', schoolClass: '', interYear: '', stream: '', exams: []})} className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-darkZinc dark:text-white focus:ring-2 focus:ring-brandAccent focus:outline-none font-medium">
                  {PRODUCT_TYPES.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Main Category</label>
                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value, schoolClass: '', interYear: '', stream: '', exams: []})} className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-darkZinc dark:text-white focus:ring-2 focus:ring-brandAccent focus:outline-none font-medium">
                  <option value="">Select category</option>
                  {(formData.productType === 'book' ? BOOK_CATEGORIES : formData.productType === 'stationery' ? ['Stationery'] : formData.productType === 'engineering_essential' ? ['Engineering Essentials'] : ['Medical / College Essentials']).map(category => <option key={category} value={category}>{category}</option>)}
                </select>
              </div>

              {formData.productType !== 'book' && <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Subcategory</label>
                <select value={formData.subcategory} onChange={e => setFormData({...formData, subcategory: e.target.value, sizes: e.target.value === 'Medical Aprons' ? (formData.sizes || []) : []})} className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-darkZinc dark:text-white focus:ring-2 focus:ring-brandAccent focus:outline-none font-medium">
                  <option value="">Select subcategory</option>
                  {(formData.productType === 'stationery' ? STATIONERY_CATEGORIES : formData.productType === 'engineering_essential' ? ENGINEERING_ESSENTIAL_CATEGORIES : MEDICAL_ESSENTIAL_CATEGORIES).map(category => <option key={category} value={category}>{category}</option>)}
                </select>
              </div>}

              {formData.productType === 'book' && formData.category === 'School' && <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Class</label>
                <select value={formData.schoolClass || ''} onChange={e => setFormData({...formData, schoolClass: e.target.value})} className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-darkZinc dark:text-white focus:ring-2 focus:ring-brandAccent focus:outline-none font-medium">
                  <option value="">Select class</option>
                  {SCHOOL_CLASSES.map(cls => <option key={cls} value={cls}>{cls}</option>)}
                </select>
              </div>}

              {formData.productType === 'book' && formData.category === 'Intermediate' && <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Year</label>
                <select value={formData.interYear || ''} onChange={e => setFormData({...formData, interYear: e.target.value})} className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-darkZinc dark:text-white focus:ring-2 focus:ring-brandAccent focus:outline-none font-medium">
                  <option value="">Select year</option>
                  {INTER_YEARS.map(year => <option key={year} value={year}>{year}</option>)}
                </select>
              </div>}

              {formData.productType === 'book' && formData.category === 'Intermediate' && <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Stream</label>
                <select value={formData.stream} onChange={e => setFormData({...formData, stream: e.target.value})} className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-darkZinc dark:text-white focus:ring-2 focus:ring-brandAccent focus:outline-none font-medium"><option value="">Select stream</option>{STREAMS.map(stream => <option key={stream} value={stream}>{stream}</option>)}</select>
              </div>}

              {formData.productType === 'book' && <fieldset className="md:col-span-2">
                <legend className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Exam tags <span className="normal-case font-normal">(select all that apply)</span></legend>
                <div className="flex flex-wrap gap-3">{EXAMS.map(exam => <label key={exam} className="inline-flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300"><input type="checkbox" checked={(formData.exams || []).includes(exam)} onChange={e => setFormData({...formData, exams: e.target.checked ? [...(formData.exams || []), exam] : (formData.exams || []).filter(value => value !== exam)})} />{exam}</label>)}</div>
              </fieldset>}

              {formData.subcategory === 'Medical Aprons' && <fieldset className="md:col-span-2">
                <legend className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Available sizes <span className="normal-case font-normal">(select all that apply)</span></legend>
                <div className="flex flex-wrap gap-3">{APRON_SIZES.map(size => <label key={size} className="inline-flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300"><input type="checkbox" checked={(formData.sizes || []).includes(size)} onChange={e => setFormData({...formData, sizes: e.target.checked ? [...(formData.sizes || []), size] : (formData.sizes || []).filter(value => value !== size)})} />{size}</label>)}</div>
              </fieldset>}

              <div className="md:col-span-2">
                 <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Cover Image</label>
                 <div className="flex gap-4 items-start">
                    <div className="relative w-16 h-20 flex-shrink-0 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-darkZinc flex items-center justify-center overflow-hidden">
                      {(localPreviewUrl || debouncedImageUrl) && !imageLoadFailed ? (
                        <img src={localPreviewUrl || debouncedImageUrl} alt="Preview" className="w-full h-full object-cover" onLoad={() => setImageLoadFailed(false)} onError={() => setImageLoadFailed(true)} />
                      ) : (
                        <ImageOff size={18} className="text-gray-300 dark:text-gray-600" />
                      )}
                      {isUploadingImage && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 w-full space-y-2">
                      <input
                        required
                        type="url"
                        value={formData.image}
                        onChange={e => setFormData({...formData, image: e.target.value})}
                        className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-darkZinc dark:text-white focus:ring-2 focus:ring-brandAccent focus:outline-none font-medium"
                        placeholder="https://example.com/image.jpg"
                      />
                      {imageLoadFailed && debouncedImageUrl === formData.image && (
                        <p className="text-xs font-semibold text-red-600">Couldn't load an image from this URL — double-check it's a direct link to an image file.</p>
                      )}
                      <div className="flex flex-wrap gap-2">
                        <label className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold cursor-pointer transition-colors ${isUploadingImage ? 'bg-gray-100 dark:bg-darkZinc text-gray-400 cursor-not-allowed' : 'bg-gray-100 dark:bg-darkZinc hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'}`}>
                          <Upload size={14} />
                          {isUploadingImage ? 'Uploading…' : 'Or upload from your device'}
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            className="hidden"
                            disabled={isUploadingImage}
                            onChange={handleImageFileChange}
                          />
                        </label>
                        <button
                          type="button"
                          disabled={!(localPreviewUrl || debouncedImageUrl) || imageLoadFailed}
                          onClick={() => setIsImagePreviewOpen(true)}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-gray-100 dark:bg-darkZinc hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <Eye size={14} />
                          Preview
                        </button>
                      </div>
                    </div>
                 </div>
              </div>

              {isImagePreviewOpen && (
                <div className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-6" onClick={() => setIsImagePreviewOpen(false)}>
                  <div className="relative max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
                    <button type="button" onClick={() => setIsImagePreviewOpen(false)} className="absolute -top-10 right-0 text-white/80 hover:text-white">
                      <X size={28} />
                    </button>
                    <img src={localPreviewUrl || debouncedImageUrl} alt="Full preview" className="w-full max-h-[80vh] object-contain rounded-xl shadow-2xl bg-white" onError={() => { setImageLoadFailed(true); setIsImagePreviewOpen(false); }} />
                  </div>
                </div>
              )}

              <div className="md:col-span-2 mt-6 flex justify-end gap-3 pt-8 border-t border-gray-100 dark:border-gray-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-3.5 font-bold text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-darkZinc rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300">
                  Cancel
                </button>
                <button type="submit" disabled={isUploadingImage} className="px-8 py-3.5 bg-brandAccent text-white font-bold rounded-xl hover:bg-amber-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-lg shadow-brandAccent/30 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brandAccent">
                  {isUploadingImage ? 'Uploading image…' : editingBook ? 'Save Changes' : 'Publish Book'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
