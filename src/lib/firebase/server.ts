/**
 * Server-side Firebase Admin utilities
 * Use this module in API routes and server components only
 */

import { initAdmin } from '../firebaseAdmin';
import { getFirestore } from 'firebase-admin/firestore';

let firestoreInstance: FirebaseFirestore.Firestore | null = null;

/**
 * Get Firestore instance (server-side only)
 * Uses Firebase Admin SDK
 */
export function getFirestoreInstance(): FirebaseFirestore.Firestore {
  if (!firestoreInstance) {
    initAdmin();
    firestoreInstance = getFirestore();
  }
  return firestoreInstance;
}

// Alias for convenience
export { getFirestoreInstance as getDb };
