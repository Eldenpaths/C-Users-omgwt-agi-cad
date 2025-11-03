import { Firestore } from 'firebase/firestore';
import { getFirebase } from './client';

export function getFirestoreInstance(): Firestore {
  const { db } = getFirebase();

  if (!db) {
    throw new Error('Firestore not initialized - must be called from client side');
  }

  return db;
}

// Re-export everything from client for convenience
export * from './client';
