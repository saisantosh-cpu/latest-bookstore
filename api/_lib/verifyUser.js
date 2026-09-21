import { getAdminAuth } from './firebaseAdmin.js';

/**
 * Reads an "Authorization: Bearer <idToken>" header (if present) and
 * verifies it against Firebase Auth. Returns { uid, email } for a logged-in
 * user, or null for a guest. Never trust a uid/email sent as plain request
 * body fields — only this verified token is trustworthy.
 */
export async function getVerifiedUser(req) {
  const authHeader = req.headers.authorization || '';
  const match = authHeader.match(/^Bearer (.+)$/);
  if (!match) return null;

  try {
    const decoded = await getAdminAuth().verifyIdToken(match[1]);
    return { uid: decoded.uid, email: decoded.email || null };
  } catch (err) {
    console.warn('Rejected invalid/expired ID token:', err.message);
    return null;
  }
}
