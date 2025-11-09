/**
 * Firebase Admin initialization (server-only)
 *
 * Centralizes Admin SDK bootstrap to avoid multiple initializeApp calls.
 * Supports multiple credential methods:
 * 1. GOOGLE_APPLICATION_CREDENTIALS_JSON (recommended for Vercel/serverless)
 * 2. GOOGLE_APPLICATION_CREDENTIALS (file path)
 * 3. applicationDefault() (for GCP environments)
 */

import { initializeApp, cert, applicationDefault, getApp, getApps, App } from 'firebase-admin/app';
import { getFirestore, Firestore, FieldValue } from 'firebase-admin/firestore';
import type { firestore as firestoreTypes } from 'firebase-admin';

let adminApp: App | null = null;
let adminDb: Firestore | null = null;

function getAdminApp(): App {
  // Return existing app if already initialized
  const apps = getApps();
  if (apps && apps.length > 0) {
    adminApp = apps[0];
    return adminApp;
  }

  // If we have a cached app, return it
  if (adminApp) {
    return adminApp;
  }

  try {
    // Method 1: Use GOOGLE_APPLICATION_CREDENTIALS_JSON (for Vercel/serverless)
    const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
    if (credentialsJson) {
      console.log('[FirebaseAdmin] Initializing with GOOGLE_APPLICATION_CREDENTIALS_JSON');
      const serviceAccount = JSON.parse(credentialsJson);
      adminApp = initializeApp({
        credential: cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id,
      });
      return adminApp;
    }

    // Method 2: Use GOOGLE_APPLICATION_CREDENTIALS (file path)
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      console.log('[FirebaseAdmin] Initializing with GOOGLE_APPLICATION_CREDENTIALS file');
      adminApp = initializeApp({
        credential: applicationDefault(),
        projectId: process.env.FIREBASE_PROJECT_ID,
      });
      return adminApp;
    }

    // Method 3: Try applicationDefault() (works in GCP environments)
    console.log('[FirebaseAdmin] Attempting applicationDefault() initialization');
    adminApp = initializeApp({
      credential: applicationDefault(),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
    return adminApp;

  } catch (error) {
    console.error('[FirebaseAdmin] Failed to initialize Firebase Admin SDK:', error);
    throw new Error(
      'Firebase Admin initialization failed. Please set either:\n' +
      '1. GOOGLE_APPLICATION_CREDENTIALS_JSON (recommended for Vercel)\n' +
      '2. GOOGLE_APPLICATION_CREDENTIALS (file path)\n' +
      '3. Ensure you are running in a GCP environment with Application Default Credentials\n' +
      `Error: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export function getAdminDb(): Firestore {
  // Return cached Firestore instance if available
  if (adminDb) {
    return adminDb;
  }

  // Initialize and cache the Firestore instance
  const app = getAdminApp();
  adminDb = getFirestore(app);
  return adminDb;
}

export function serverTimestamp() {
  return FieldValue.serverTimestamp();
}

export type AdminFirestore = Firestore;

