/**
 * Firebase Admin initialization (server-only)
 *
 * Centralizes Admin SDK bootstrap to avoid multiple initializeApp calls.
 * Uses applicationDefault() by default. Ensure your environment provides
 * GOOGLE_APPLICATION_CREDENTIALS or workload identity.
 */

import { initializeApp, applicationDefault, getApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { firestore } from 'firebase-admin';

function getAdminApp() {
    if (getApps().length) {
        return getApp();
    }
    return initializeApp({
        credential: applicationDefault(),
    });
}

export function getAdminDb() {
  return getFirestore(getAdminApp());
}

export function serverTimestamp() {
  return firestore.FieldValue.serverTimestamp();
}

export type AdminFirestore = firestore.Firestore;

