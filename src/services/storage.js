import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase/config';

const MAX_FILE_SIZE_MB = 5;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const isCloudinaryConfigured = Boolean(CLOUDINARY_CLOUD_NAME && CLOUDINARY_UPLOAD_PRESET);

/**
 * Uploads a book cover image and returns its public URL.
 *
 * Prefers Cloudinary when it's configured (works on Firebase's free Spark
 * plan, no billing card needed). Falls back to Firebase Storage otherwise —
 * useful once/if the project is on Blaze.
 */
export const uploadBookCoverImage = async (file) => {
  if (!file) throw new Error('No file selected.');
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Please choose a JPG, PNG, WEBP, or GIF image.');
  }
  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    throw new Error(`Image is too large — please choose one under ${MAX_FILE_SIZE_MB}MB.`);
  }

  if (isCloudinaryConfigured) {
    const form = new FormData();
    form.append('file', file);
    form.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    form.append('folder', 'book-covers');

    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: form,
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error?.message || 'Image upload failed. Please try again.');
    }
    return data.secure_url;
  }

  // Fallback: Firebase Storage (requires the project to be on the Blaze plan).
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const path = `book-covers/${Date.now()}-${safeName}`;
  const storageRef = ref(storage, path);
  const snapshot = await uploadBytes(storageRef, file);
  return getDownloadURL(snapshot.ref);
};
