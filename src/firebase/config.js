import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

// These values come from your Firebase project settings
// (Project settings -> General -> Your apps -> SDK setup and configuration).
// Locally, put them in a .env file (see .env.example).
// On Vercel, set them as Environment Variables in the project settings.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const missingKeys = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingKeys.length > 0) {
  // Don't crash the whole app at import time — log clearly instead, so the
  // rest of the site (books, cart, etc.) still works even before Firebase
  // is configured. Anything that touches Firestore will fail loudly when used.
  console.warn(
    `[firebase] Missing config values: ${missingKeys.join(', ')}. ` +
    `Orders / admin notifications will not work until you add your Firebase ` +
    `project keys to a .env file (see .env.example).`
  );
}

export const firebaseApp = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const db = getFirestore(firebaseApp);
export const storage = getStorage(firebaseApp);
export const auth = getAuth(firebaseApp);
export const isFirebaseConfigured = missingKeys.length === 0;
