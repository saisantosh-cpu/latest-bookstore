// One-time seed script — run manually, NOT automatically by the app.
//
// Usage:
//   node scripts/seed-books.mjs
//
// Requires the same 3 FIREBASE_ADMIN_* env vars used by the /api functions
// to be set in your shell (or in a .env file loaded via `node --env-file`,
// on Node 20+). This script will NOT overwrite existing books — it only
// adds the starter catalog if the store_books collection is currently empty.
import admin from 'firebase-admin';

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!projectId || !clientEmail || !privateKey) {
  console.error('Missing FIREBASE_ADMIN_PROJECT_ID / FIREBASE_ADMIN_CLIENT_EMAIL / FIREBASE_ADMIN_PRIVATE_KEY in your environment.');
  console.error('Set them in your shell, or run with: node --env-file=.env scripts/seed-books.mjs (Node 20+)');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
});

const db = admin.firestore();

const starterBooks = [
  { id: '1', title: 'The Enigma of Reason', author: 'Hugo Mercier', company: 'Penguin Books', originalPrice: 1500, price: 1200, discountPercentage: 20, rating: 4.8, reviewsCount: 1243, stockQuantity: 45, genre: 'Science', image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=600&fm=webp', description: 'A fascinating exploration into human reasoning and how it evolved.' },
  { id: '2', title: 'Atomic Habits', author: 'James Clear', company: 'Random House', originalPrice: 599, price: 450, discountPercentage: 25, rating: 4.9, reviewsCount: 5231, stockQuantity: 60, genre: 'Self-Help', image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=600&fm=webp', description: 'Tiny changes, remarkable results.' },
  { id: '3', title: '1984', author: 'George Orwell', company: 'Penguin Books', originalPrice: 450, price: 350, discountPercentage: 22, rating: 4.7, reviewsCount: 8102, stockQuantity: 20, genre: 'Fiction', image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=600&fm=webp', description: 'A dystopian classic.' },
];

async function seed() {
  const existing = await db.collection('store_books').limit(1).get();
  if (!existing.empty) {
    console.log('store_books already has data — not seeding, to avoid duplicates. Delete the collection first if you want to reseed.');
    process.exit(0);
  }

  const batch = db.batch();
  starterBooks.forEach((book) => {
    batch.set(db.collection('store_books').doc(book.id), { ...book, createdAt: admin.firestore.FieldValue.serverTimestamp() });
  });
  await batch.commit();
  console.log(`Seeded ${starterBooks.length} starter books into store_books.`);
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
