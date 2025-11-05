import { Firestore } from 'firebase/firestore';
import {
  getFirebase,
  getDbInstance,
  getAuthInstance,
  signInWithGoogle,
  db,
  auth,
} from './client';

export function getFirestoreInstance(): Firestore {
  return getDbInstance();
}

// Re-export all client functions explicitly
export {
  getFirebase,
  getDbInstance,
  getAuthInstance,
  signInWithGoogle,
  db,
  auth,
};

// Alias for convenience
export { getFirestoreInstance as getDb };
