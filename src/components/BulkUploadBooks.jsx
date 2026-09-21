import React, { useRef, useState } from 'react';
import Papa from 'papaparse';
import { Upload, Download } from 'lucide-react';
import { useBooks } from '../context/BookContext';
import { useToast } from '../context/ToastContext';

const TEMPLATE_HEADERS = ['title', 'author', 'company', 'price', 'originalPrice', 'discountPercentage', 'stockQuantity', 'genre', 'productType', 'category', 'subcategory', 'stream', 'exams', 'image', 'description'];

const TEMPLATE_ROWS = [
  ['JEE Physics Problems', 'A. Sharma', 'Academic Press', '450', '599', '25', '30', 'Education', 'book', 'Intermediate', '', 'MPC', 'JEE|JEE Advanced', 'https://images.unsplash.com/photo-1544947950-fa07a98d237f', 'Practice problems for JEE aspirants.'],
  ['Classmate Notebook', '', 'Classmate', '80', '100', '20', '20', 'Stationery', 'stationery', 'Stationery', 'Notebooks', '', '', 'https://images.unsplash.com/photo-1544947950-fa07a98d237f', 'Everyday ruled notebook.'],
];

const downloadTemplate = () => {
  const csv = Papa.unparse([TEMPLATE_HEADERS, ...TEMPLATE_ROWS]);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'slv-books-template.csv';
  link.click();
  URL.revokeObjectURL(url);
};

const BulkUploadBooks = () => {
  const { bulkAddBooks } = useBooks();
  const toast = useToast();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const validBooks = [];
        let skipped = 0;

        results.data.forEach((row) => {
          const title = row.title?.trim();
          const author = row.author?.trim();
          const price = Number(row.price);
          const productType = row.productType?.trim() || 'book';

          if (!title || (productType === 'book' && !author) || !price || Number.isNaN(price)) {
            skipped += 1;
            return;
          }

          validBooks.push({
            title,
            author,
            company: row.company?.trim() || 'Unknown Publisher',
            price,
            originalPrice: Number(row.originalPrice) || price,
            discountPercentage: Number(row.discountPercentage) || 0,
            stockQuantity: Number(row.stockQuantity) || 0,
            genre: row.genre?.trim() || 'Fiction',
            productType,
            category: row.category?.trim() || '',
            subcategory: row.subcategory?.trim() || '',
            stream: row.stream?.trim() || '',
            exams: (row.exams || '').split('|').map((exam) => exam.trim()).filter(Boolean),
            image: row.image?.trim() || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=600',
            description: row.description?.trim() || '',
            rating: 4.5,
            dateAdded: new Date().toISOString().slice(0, 10),
          });
        });

        if (validBooks.length === 0) {
          toast?.show('No valid rows found. Check that your CSV has title, author, and price columns filled in.', 'error', 7000);
          setUploading(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
          return;
        }

        try {
          await bulkAddBooks(validBooks);
          toast?.show(
            `Added ${validBooks.length} book${validBooks.length === 1 ? '' : 's'}.` +
            (skipped > 0 ? ` Skipped ${skipped} row${skipped === 1 ? '' : 's'} missing title/author/price.` : ''),
            'success',
            7000
          );
        } catch (err) {
          console.error('Bulk upload failed:', err);
          toast?.show('Something went wrong uploading these books. Please try again.', 'error');
        }

        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      },
      error: (err) => {
        console.error('CSV parse error:', err);
        toast?.show('Could not read that CSV file. Please check the format and try again.', 'error');
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      },
    });
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={downloadTemplate}
        className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-bold text-gray-600 dark:text-gray-300 hover:text-brandAccent transition-colors"
        title="Download a sample CSV with the expected columns"
      >
        <Download size={14} /> Template
      </button>

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="flex items-center px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-darkZinc dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-sm transition-colors disabled:opacity-60"
      >
        <Upload size={16} className="mr-2" /> {uploading ? 'Uploading…' : 'Bulk Upload (CSV)'}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};

export default BulkUploadBooks;
