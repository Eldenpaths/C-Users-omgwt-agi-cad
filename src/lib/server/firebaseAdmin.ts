/**
 * Firebase Admin initialization (server-only)
 *
 * Centralizes Admin SDK bootstrap to avoid multiple initializeApp calls.
 * Uses applicationDefault() by default. Ensure your environment provides
 * GOOGLE_APPLICATION_CREDENTIALS or workload identity.
 */

import * as admin from 'firebase-admin'

let inited = false

export function ensureAdminApp() {
  if (!inited) {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      })
    }
    inited = true
  }
  return admin.app()
}

export function getAdminDb() {
  ensureAdminApp()
  return admin.firestore()
}

export function serverTimestamp() {
  ensureAdminApp()
  return admin.firestore.FieldValue.serverTimestamp()
}

export type AdminFirestore = admin.firestore.Firestore

