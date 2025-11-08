// CLAUDE-META: Phase 9A Hybrid Patch - Firebase Admin SDK
// Architect: ChatGPT (GPT-5) Canonical Authority
// Purpose: Server-side Firebase Admin initialization
// Status: Production - Hybrid Safe Mode Active

let initialized = false;

export function initAdmin() {
  if (typeof window !== 'undefined') {
    throw new Error('firebase-admin should not be used in client code');
  }
  const { initializeApp, getApps, cert } = (eval('require') as any)('firebase-admin/app');
  if (initialized || getApps().length > 0) return;

  try {
    // Prefer consolidated JSON key if provided
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    if (raw) {
      const svc: any = JSON.parse(raw)
      if (svc.private_key && typeof svc.private_key === 'string' && svc.private_key.includes('\\n')) {
        svc.private_key = svc.private_key.replace(/\\n/g, '\n')
      }
      initializeApp({
        credential: cert(svc),
        // databaseURL optional; include if present
        // @ts-ignore
        databaseURL: process.env.FIREBASE_DATABASE_URL,
      })
      initialized = true
      return
    }

    // Fallback to individual env vars
    const projectId = process.env.FIREBASE_PROJECT_ID
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
    let privateKey = process.env.FIREBASE_PRIVATE_KEY
    if (privateKey && privateKey.includes('\\n')) privateKey = privateKey.replace(/\\n/g, '\n')

    if (projectId && clientEmail && privateKey) {
      initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
        // @ts-ignore
        databaseURL: process.env.FIREBASE_DATABASE_URL,
      })
      initialized = true
      return
    }

    // As a last resort, attempt default credentials (may work in GCP environments)
    initializeApp()
    initialized = true
  } catch (e) {
    // Defer errors to callers; keep uninitialized so client fallback can be used
    console.warn('Firebase Admin init skipped:', (e as any)?.message || e)
  }
}
