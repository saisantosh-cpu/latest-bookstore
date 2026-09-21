// Server-only Firebase Admin initialization, used by /api serverless
// functions. This has FULL access to Firestore — it bypasses security
// rules entirely — which is exactly why authoritative calculations (price,
// stock, coupon validation, payment verification) live here instead of in
// client code. NEVER import this file from anything in /src.
import admin from 'firebase-admin';

function getServiceAccount() {
  // Preferred, more reliable path: paste the ENTIRE downloaded service
  // account JSON file as a single env var. This avoids the private key
  // getting mangled when it's manually split across 3 separate fields —
  // by far the most common setup mistake.
  const rawJson = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON;
  if (rawJson) {
    try {
      const parsed = JSON.parse(rawJson);
      if (parsed.project_id && parsed.client_email && parsed.private_key) {
        return {
          projectId: parsed.project_id,
          clientEmail: parsed.client_email,
          privateKey: parsed.private_key.replace(/\\n/g, '\n'),
        };
      }
    } catch (err) {
      console.error('FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON is set but is not valid JSON:', err.message);
    }
  }

  // Fallback: 3 separate fields.
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  // Private keys often get their newlines escaped when stored as an env var.
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    return null;
  }
  return { projectId, clientEmail, privateKey };
}

let app;
export function getAdminApp() {
  if (admin.apps.length) return admin.apps[0];

  const serviceAccount = getServiceAccount();
  if (!serviceAccount) {
    throw new Error(
      'Firebase Admin is not configured on the server. Add FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON ' +
      '(the whole downloaded service account JSON file, pasted as one value) OR the 3 separate ' +
      'FIREBASE_ADMIN_PROJECT_ID / FIREBASE_ADMIN_CLIENT_EMAIL / FIREBASE_ADMIN_PRIVATE_KEY ' +
      'environment variables (see README.md for how to generate a service account key).'
    );
  }

  app = admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  return app;
}

export function getAdminDb() {
  getAdminApp();
  return admin.firestore();
}

export function getAdminAuth() {
  getAdminApp();
  return admin.auth();
}

export { admin };
