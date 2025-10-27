import * as admin from "firebase-admin";

let app: admin.app.App | undefined;

/**
 * Initialize the Firebase Admin SDK once per runtime.
 * Works both locally and on Vercel (using env vars / secrets).
 */
export function initAdmin() {
  if (!admin.apps.length) {
    // Prefer environment-based credentials (Vercel/CI)
    if (!process.env.FIREBASE_PROJECT_ID) {
      throw new Error("Missing Firebase environment variables");
    }

    app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // On Vercel, replace literal `\n` with actual newlines
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });
  }

  return admin.app();
}

/** Shortcut getter for the Admin SDK */
export const getAdmin = () => {
  if (!app) initAdmin();
  return admin;
};
