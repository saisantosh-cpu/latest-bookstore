import { getVerifiedUser } from './verifyUser.js';
import { getAdminDb } from './firebaseAdmin.js';

/**
 * Verifies the request's ID token AND that the corresponding user document
 * has role "admin" in Firestore. Returns { uid, email } if so, or null.
 * This is the server-side counterpart to the client's isAdmin flag — the
 * client flag is only ever a UI convenience, never a security boundary.
 */
export async function getVerifiedAdmin(req) {
  const user = await getVerifiedUser(req);
  if (!user) return null;

  const db = getAdminDb();
  const snap = await db.collection('users').doc(user.uid).get();
  if (!snap.exists || snap.data()?.role !== 'admin') return null;

  return user;
}
