/**
 * Server-side Firebase Admin utilities
 * Use this module in API routes and server components only
 */

import { initAdmin } from '../firebaseAdmin';

let firestoreInstance: FirebaseFirestore.Firestore | null = null;

/**
 * Get Firestore instance (server-side only)
 * Uses Firebase Admin SDK. Guarded to avoid bundling in client builds.
 */
export function getFirestoreInstance(): FirebaseFirestore.Firestore {
  if (typeof window !== 'undefined') {
    throw new Error('firebase-admin should not be imported in client code.');
  }
  if (!firestoreInstance) {
    initAdmin();
    const { getFirestore } = (eval('require') as any)('firebase-admin/firestore');
    firestoreInstance = getFirestore();
  }
  return firestoreInstance!;
}

// Alias for convenience
export { getFirestoreInstance as getDb };
