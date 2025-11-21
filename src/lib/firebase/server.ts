/**
 * Server-side Firebase Admin utilities
 * Use this module in API routes and server components only
 */

import { adminDb, getFirestoreInstance } from './admin';

/**
 * Re-export Firestore instance for convenience
 * Uses Firebase Admin SDK
 */
export { adminDb, getFirestoreInstance };

// Alias for convenience
export { getFirestoreInstance as getDb };
