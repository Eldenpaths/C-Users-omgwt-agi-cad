// CLAUDE-META: Phase 9A Hybrid Patch - Firebase Admin SDK
// Architect: ChatGPT (GPT-5) Canonical Authority
// Purpose: Server-side Firebase Admin initialization
// Status: Production - Hybrid Safe Mode Active

import { initializeApp, getApps, cert } from "firebase-admin/app";

let initialized = false;

export function initAdmin() {
  if (initialized || getApps().length > 0) return;

  // Initialize with default credentials (uses GOOGLE_APPLICATION_CREDENTIALS env var)
  // or service account JSON for local development
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });

  initialized = true;
}
