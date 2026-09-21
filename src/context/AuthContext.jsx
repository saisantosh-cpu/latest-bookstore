import React, { createContext, useState, useContext, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../firebase/config';
import { mockUsers } from '../data/mockData';

const AuthContext = createContext();

// Friendlier text for Firebase's auth/* error codes.
const AUTH_ERROR_MESSAGES = {
  'auth/invalid-credential': 'Incorrect email or password.',
  'auth/user-not-found': 'No account found with that email.',
  'auth/wrong-password': 'Incorrect email or password.',
  'auth/email-already-in-use': 'An account with that email already exists.',
  'auth/weak-password': 'Password should be at least 6 characters.',
  'auth/invalid-email': 'That email address looks invalid.',
  'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
};

const friendlyAuthError = (err) => AUTH_ERROR_MESSAGES[err?.code] || err?.message || 'Something went wrong. Please try again.';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      // Legacy mock login, kept only as a fallback for before Firebase is set up.
      const storedUser = localStorage.getItem('bookstore_user');
      if (storedUser) setUser(JSON.parse(storedUser));
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }
      try {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        const profile = userDoc.exists() ? userDoc.data() : {};
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: profile.name || firebaseUser.email.split('@')[0],
          role: profile.role || 'user',
        });
      } catch (err) {
        console.error('Failed to load user profile:', err);
        setUser({ uid: firebaseUser.uid, email: firebaseUser.email, name: firebaseUser.email.split('@')[0], role: 'user' });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    if (!isFirebaseConfigured) {
      const foundUser = mockUsers.find((u) => u.email === email && u.password === password);
      if (foundUser) {
        const userData = { email: foundUser.email, role: foundUser.role, name: foundUser.name };
        setUser(userData);
        localStorage.setItem('bookstore_user', JSON.stringify(userData));
        return { success: true };
      }
      return { success: false, error: 'Invalid credentials. Please verify your email and password.' };
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (err) {
      return { success: false, error: friendlyAuthError(err) };
    }
  };

  const signup = async (email, password, name) => {
    if (!isFirebaseConfigured) {
      return { success: false, error: 'Account creation needs Firebase set up first — see README.md.' };
    }
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      // Every new signup defaults to role "user" — admin access is granted
      // manually in the Firestore console, never through signup itself.
      await setDoc(doc(db, 'users', cred.user.uid), {
        name,
        email,
        role: 'user',
        createdAt: serverTimestamp(),
      });
      return { success: true };
    } catch (err) {
      return { success: false, error: friendlyAuthError(err) };
    }
  };

  const resetPassword = async (email) => {
    if (!isFirebaseConfigured) {
      return { success: false, error: 'Password reset needs Firebase set up first — see README.md.' };
    }
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (err) {
      return { success: false, error: friendlyAuthError(err) };
    }
  };

  const logout = async () => {
    if (!isFirebaseConfigured) {
      setUser(null);
      localStorage.removeItem('bookstore_user');
      return;
    }
    await signOut(auth);
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, login, signup, resetPassword, logout, loading, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
