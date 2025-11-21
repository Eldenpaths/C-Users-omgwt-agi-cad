import { getSnapshot, __resetForTests } from './routerWeights'

// We support both Admin (server) and client Firestore. Prefer Admin on server.
let isServer = typeof window === 'undefined'

// Lazy imports to avoid bundling both on either side
async function getAdminDb(): Promise<FirebaseFirestore.Firestore | null> {
  try {
    const mod = await import('@/lib/firebase/server')
    return mod.getFirestoreInstance()
  } catch (e) {
    // Admin may be unavailable locally (no creds). Fall back to client.
    return null
  }
}

async function getClientDb(): Promise<import('firebase/firestore').Firestore> {
  const mod = await import('@/lib/firebase') as any
  return mod.getDbInstance()
}

export async function saveSnapshot() {
  const snap = getSnapshot()
  if (isServer) {
    try {
      const db = await getAdminDb()
      if (db) {
        await db.collection('system').doc('router24B').set(snap, { merge: true })
        return { ok: true }
      }
      // No admin DB, fall through to client path
    } catch {}
  }
  {
    const db = await getClientDb()
    const { doc, setDoc } = await import('firebase/firestore')
    const ref = doc(db, 'system', 'router24B')
    await setDoc(ref, snap, { merge: true })
    return { ok: true }
  }
}

export async function loadSnapshot() {
  if (isServer) {
    try {
      const db = await getAdminDb()
      if (db) {
        const ref = db.collection('system').doc('router24B')
        const d = await ref.get()
        if (d.exists) {
          const data = d.data() || {}
          const g = globalThis as any
          g.__router24B = { ...(g.__router24B ?? {}), ...data }
          return { ok: true, snapshot: g.__router24B }
        }
      }
    } catch {}
  }
  {
    const db = await getClientDb()
    const { doc, getDoc } = await import('firebase/firestore')
    const ref = doc(db, 'system', 'router24B')
    const d = await getDoc(ref)
    if (d.exists()) {
      const data = d.data() || {}
      try {
        const g = globalThis as any
        g.__router24B = { ...(g.__router24B ?? {}), ...data }
        return { ok: true, snapshot: g.__router24B }
      } catch {
        return { ok: false }
      }
    }
    return { ok: false }
  }
}

export function resetSnapshot() {
  __resetForTests()
  return { ok: true }
}

// Fetch remote snapshot without mutating local memory (for diffing/status)
export async function getRemoteSnapshot(): Promise<any | null> {
  if (typeof window === 'undefined') {
    try {
      const db = await getAdminDb()
      if (db) {
        const ref = db.collection('system').doc('router24B')
        const d = await ref.get()
        return d.exists ? (d.data() || null) : null
      }
    } catch {}
    return null
  } else {
    const db = await getClientDb()
    const { doc, getDoc } = await import('firebase/firestore')
    const ref = doc(db, 'system', 'router24B')
    const d = await getDoc(ref)
    return d.exists() ? (d.data() || null) : null
  }
}
