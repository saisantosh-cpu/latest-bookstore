import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
  query,
  orderBy,
  limit,
  startAfter,
  getDocs,
  where,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase/config';
import { mockBooks } from '../data/mockData';
import { matchesCatalogCriteria } from '../data/catalog';

// NOTE: this project's Firebase project already had an unrelated "books"
// collection from an earlier experiment (different field names — isbn,
// avgRating, imageUrl, etc). To avoid colliding with that old data, the
// live catalog for this app lives in its own collection, "store_books".
const BOOKS_COLLECTION = 'store_books';
const PAGE_SIZE = 24;

const BookContext = createContext();

export const BookProvider = ({ children }) => {
  const [books, setBooks] = useState(() => {
    if (isFirebaseConfigured) return []; // will be filled by the Firestore listener below
    const savedBooks = localStorage.getItem('nova_books');
    return savedBooks ? JSON.parse(savedBooks) : mockBooks;
  });
  const [booksLoading, setBooksLoading] = useState(isFirebaseConfigured);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [lastDoc, setLastDoc] = useState(null);
  const [catalogBooks, setCatalogBooks] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogLoadingMore, setCatalogLoadingMore] = useState(false);
  const [catalogHasMore, setCatalogHasMore] = useState(false);
  const [catalogLastDoc, setCatalogLastDoc] = useState(null);
  const [catalogCriteria, setCatalogCriteria] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    if (!isFirebaseConfigured) return; // stay on the localStorage fallback above

    // Only the FIRST page is a live listener (so new/edited books still show
    // up instantly without a refresh). Pages loaded via "Load more" are
    // one-time reads — a deliberate, documented tradeoff so we're not
    // holding open a growing number of realtime listeners as the catalog
    // grows. Note: because seeding is no longer automatic (see
    // scripts/seed-books.mjs), an empty collection here is a genuinely
    // empty store, not a "needs seeding" signal.
    const firstPageQuery = query(collection(db, BOOKS_COLLECTION), orderBy('createdAt', 'desc'), limit(PAGE_SIZE));

    const unsubscribe = onSnapshot(
      firstPageQuery,
      (snapshot) => {
        const nextBooks = snapshot.docs.map((d) => ({ ...d.data(), id: d.id }));
        setBooks(nextBooks);
        setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
        setHasMore(snapshot.docs.length === PAGE_SIZE);
        setBooksLoading(false);
      },
      (error) => {
        console.error('Failed to subscribe to books:', error);
        setBooksLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const loadMoreBooks = useCallback(async () => {
    if (!isFirebaseConfigured || !lastDoc || loadingMore) return;
    setLoadingMore(true);
    try {
      const nextPageQuery = query(
        collection(db, BOOKS_COLLECTION),
        orderBy('createdAt', 'desc'),
        startAfter(lastDoc),
        limit(PAGE_SIZE)
      );
      const snapshot = await getDocs(nextPageQuery);
      const nextBooks = snapshot.docs.map((d) => ({ ...d.data(), id: d.id }));
      setBooks((prev) => [...prev, ...nextBooks]);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === PAGE_SIZE);
    } catch (err) {
      console.error('Failed to load more books:', err);
    }
    setLoadingMore(false);
  }, [lastDoc, loadingMore]);

  // Category listings get their own paginated Firestore query. This avoids
  // downloading the full catalog merely to filter a navigation branch.
  useEffect(() => {
    if (!catalogCriteria) {
      setCatalogBooks([]);
      setCatalogHasMore(false);
      setCatalogLastDoc(null);
      return undefined;
    }
    if (!isFirebaseConfigured) {
      setCatalogBooks(books.filter((book) => matchesCatalogCriteria(book, catalogCriteria)));
      setCatalogHasMore(false);
      return undefined;
    }

    const constraints = [];
    // Old documents have no productType and intentionally remain visible in
    // the unfiltered catalog; category pages only return explicitly tagged data.
    constraints.push(where('productType', '==', catalogCriteria.productType));
    if (catalogCriteria.category) constraints.push(where('category', '==', catalogCriteria.category));
    if (catalogCriteria.subcategory) constraints.push(where('subcategory', '==', catalogCriteria.subcategory));
    if (catalogCriteria.stream) constraints.push(where('stream', '==', catalogCriteria.stream));
    if (catalogCriteria.schoolClass) constraints.push(where('schoolClass', '==', catalogCriteria.schoolClass));
    if (catalogCriteria.interYear) constraints.push(where('interYear', '==', catalogCriteria.interYear));
    if (catalogCriteria.exam) constraints.push(where('exams', 'array-contains', catalogCriteria.exam));
    constraints.push(orderBy('createdAt', 'desc'), limit(PAGE_SIZE));

    setCatalogLoading(true);
    const unsubscribe = onSnapshot(query(collection(db, BOOKS_COLLECTION), ...constraints), (snapshot) => {
      setCatalogBooks(snapshot.docs.map((d) => ({ ...d.data(), id: d.id })));
      setCatalogLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setCatalogHasMore(snapshot.docs.length === PAGE_SIZE);
      setCatalogLoading(false);
    }, (error) => {
      console.error('Failed to load category catalog:', error);
      setCatalogLoading(false);
    });
    return () => unsubscribe();
  }, [catalogCriteria, books]);

  const loadMoreCatalogBooks = useCallback(async () => {
    if (!isFirebaseConfigured || !catalogCriteria || !catalogLastDoc || catalogLoadingMore) return;
    setCatalogLoadingMore(true);
    try {
      const constraints = [where('productType', '==', catalogCriteria.productType)];
      if (catalogCriteria.category) constraints.push(where('category', '==', catalogCriteria.category));
      if (catalogCriteria.subcategory) constraints.push(where('subcategory', '==', catalogCriteria.subcategory));
      if (catalogCriteria.stream) constraints.push(where('stream', '==', catalogCriteria.stream));
      if (catalogCriteria.schoolClass) constraints.push(where('schoolClass', '==', catalogCriteria.schoolClass));
      if (catalogCriteria.interYear) constraints.push(where('interYear', '==', catalogCriteria.interYear));
      if (catalogCriteria.exam) constraints.push(where('exams', 'array-contains', catalogCriteria.exam));
      constraints.push(orderBy('createdAt', 'desc'), startAfter(catalogLastDoc), limit(PAGE_SIZE));
      const snapshot = await getDocs(query(collection(db, BOOKS_COLLECTION), ...constraints));
      setCatalogBooks((previous) => [...previous, ...snapshot.docs.map((d) => ({ ...d.data(), id: d.id }))]);
      setCatalogLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setCatalogHasMore(snapshot.docs.length === PAGE_SIZE);
    } catch (error) {
      console.error('Failed to load more category products:', error);
    } finally {
      setCatalogLoadingMore(false);
    }
  }, [catalogCriteria, catalogLastDoc, catalogLoadingMore]);

  // Global search — checks EVERY product in the store, not just whatever
  // page/category happens to be loaded. Firestore has no built-in text
  // search, so for a catalog this size we fetch the whole collection once
  // per search and match client-side; fine for hundreds/low-thousands of
  // products, and far more reliable than only searching loaded pages.
  const runSearch = useCallback(async (searchText) => {
    const lowerQuery = searchText.toLowerCase().trim();
    if (!lowerQuery) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    try {
      let allProducts;
      if (!isFirebaseConfigured) {
        allProducts = books;
      } else {
        const snapshot = await getDocs(collection(db, BOOKS_COLLECTION));
        allProducts = snapshot.docs.map((d) => ({ ...d.data(), id: d.id }));
      }
      const matches = allProducts.filter((b) =>
        (b.title || '').toLowerCase().includes(lowerQuery) ||
        (b.author || '').toLowerCase().includes(lowerQuery) ||
        (b.genre && b.genre.toLowerCase().includes(lowerQuery)) ||
        (b.company && b.company.toLowerCase().includes(lowerQuery)) ||
        (b.category && b.category.toLowerCase().includes(lowerQuery)) ||
        (b.subcategory && b.subcategory.toLowerCase().includes(lowerQuery))
      );
      setSearchResults(matches);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, [books]);

  const addBook = async (book) => {
    const id = book.id || Date.now().toString();
    if (!isFirebaseConfigured) {
      setBooks((prev) => {
        const next = [{ ...book, id }, ...prev];
        localStorage.setItem('nova_books', JSON.stringify(next));
        return next;
      });
      return;
    }
    await setDoc(doc(db, BOOKS_COLLECTION, id), { ...book, id, createdAt: serverTimestamp() });
  };

  const updateBook = async (updatedBook) => {
    if (!isFirebaseConfigured) {
      setBooks((prev) => {
        const next = prev.map((b) => (b.id === updatedBook.id ? updatedBook : b));
        localStorage.setItem('nova_books', JSON.stringify(next));
        return next;
      });
      return;
    }
    await setDoc(doc(db, BOOKS_COLLECTION, updatedBook.id), updatedBook, { merge: true });
  };

  const deleteBook = async (id) => {
    if (!isFirebaseConfigured) {
      setBooks((prev) => {
        const next = prev.filter((b) => b.id !== id);
        localStorage.setItem('nova_books', JSON.stringify(next));
        return next;
      });
      return;
    }
    await deleteDoc(doc(db, BOOKS_COLLECTION, id));
  };

  // Adds many books at once (used by the CSV bulk-upload feature).
  // Firestore batches max out at 500 writes, so large uploads are chunked.
  const bulkAddBooks = async (booksArray) => {
    if (!isFirebaseConfigured) {
      setBooks((prev) => {
        const next = [...booksArray, ...prev];
        localStorage.setItem('nova_books', JSON.stringify(next));
        return next;
      });
      return;
    }
    const chunkSize = 450;
    for (let i = 0; i < booksArray.length; i += chunkSize) {
      const chunk = booksArray.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      chunk.forEach((book) => {
        const id = book.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        batch.set(doc(db, BOOKS_COLLECTION, id), { ...book, id, createdAt: serverTimestamp() });
      });
      await batch.commit();
    }
  };

  // Derived filters — note these only reflect books currently LOADED, not
  // the entire catalog, once pagination is in play. See BookListing.jsx.
  const authors = [...new Set(books.map((b) => b.author))];
  const companies = [...new Set(books.map((b) => b.company))];

  return (
    <BookContext.Provider
      value={{
        books,
        booksLoading,
        loadingMore,
        hasMore,
        loadMoreBooks,
        catalogBooks,
        catalogLoading,
        catalogLoadingMore,
        catalogHasMore,
        setCatalogCriteria,
        loadMoreCatalogBooks,
        searchResults,
        searchLoading,
        runSearch,
        addBook,
        updateBook,
        deleteBook,
        bulkAddBooks,
        authors,
        companies,
      }}
    >
      {children}
    </BookContext.Provider>
  );
};

export const useBooks = () => {
  const context = useContext(BookContext);
  if (!context) {
    throw new Error('useBooks must be used within a BookProvider');
  }
  return context;
};
