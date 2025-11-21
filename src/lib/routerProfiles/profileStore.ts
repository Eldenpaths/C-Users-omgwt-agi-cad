import type { OperatorProfile } from './profileTypes'

// Prefer Admin on server, fallback to client SDK
async function getAdminDb(): Promise<FirebaseFirestore.Firestore | null> {
  try {
    const mod = await import('@/lib/firebase/server')
    return mod.getFirestoreInstance()
  } catch { return null }
}

async function getClientDb(): Promise<import('firebase/firestore').Firestore> {
  const mod = await import('@/lib/firebase') as any
  return mod.getDbInstance()
}

function ensureProfile(docData: any, uid: string): OperatorProfile {
  const base: OperatorProfile = { uid, weights: {}, rewards: [], meta: { lastUpdated: 0, sessions: 0, avgReward: 0 } }
  const p: any = docData || base
  if (!p.meta) p.meta = { lastUpdated: 0, sessions: 0, avgReward: 0 }
  if (p.meta.adaptive === undefined) p.meta.adaptive = true
  if (!Array.isArray(p.rewards)) p.rewards = []
  if (!p.weights) p.weights = {}
  return p as OperatorProfile
}

export async function updateProfile(uid: string, agent: string, taskId: string, success: boolean, util: number) {
  const delta = success ? 1 - util : 0 - util
  const now = Date.now()
  const payloadDelta = { taskId, agent, delta, timestamp: now }

  if (typeof window === 'undefined') {
    try {
      const db = await getAdminDb()
      if (db) {
        const ref = db.collection('profiles').doc(uid).collection('router').doc('default')
        const snap = await ref.get()
        const profile = ensureProfile(snap.exists ? snap.data() : null, uid)
        if ((profile.meta as any).adaptive === false) {
          return { delta, avg: profile.meta.avgReward ?? 0, lastUpdated: profile.meta.lastUpdated ?? now }
        }
        profile.rewards = [...(profile.rewards || []), payloadDelta].slice(-500)
        profile.meta.sessions = (profile.meta.sessions || 0) + 1
        profile.meta.lastUpdated = now
        const sum = profile.rewards.reduce((s, r: any) => s + Number(r.delta || 0), 0)
        profile.meta.avgReward = profile.rewards.length ? sum / profile.rewards.length : 0
        await ref.set(profile, { merge: true })
        return { delta, avg: profile.meta.avgReward, lastUpdated: profile.meta.lastUpdated }
      }
    } catch {}
  }

  // Client fallback
  const { doc, getDoc, setDoc } = await import('firebase/firestore')
  const db = await getClientDb()
  const ref = doc(db, 'profiles', uid, 'router', 'default')
  const snap = await getDoc(ref)
  const data = ensureProfile(snap.exists() ? snap.data() : null, uid) as any
  if (data.meta.adaptive === false) {
    return { delta, avg: data.meta.avgReward ?? 0, lastUpdated: data.meta.lastUpdated ?? now }
  }
  data.rewards = [...(data.rewards || []), payloadDelta].slice(-500)
  data.meta.sessions = (data.meta.sessions || 0) + 1
  data.meta.lastUpdated = now
  const sum = data.rewards.reduce((s: number, r: any) => s + Number(r.delta || 0), 0)
  data.meta.avgReward = data.rewards.length ? sum / data.rewards.length : 0
  await setDoc(ref, data, { merge: true })
  return { delta, avg: data.meta.avgReward, lastUpdated: data.meta.lastUpdated }
}

export async function getProfileSummary(uid: string) {
  try {
    if (typeof window === 'undefined') {
      const db = await getAdminDb()
      if (db) {
        const ref = db.collection('profiles').doc(uid).collection('router').doc('default')
        const snap = await ref.get()
        if (snap.exists) {
          const d = snap.data() as any
          return { avgReward: d?.meta?.avgReward ?? 0, lastUpdated: d?.meta?.lastUpdated ?? 0, adaptive: d?.meta?.adaptive ?? true }
        }
        return { avgReward: 0, lastUpdated: 0, adaptive: true }
      }
    }
  } catch {}

  const { doc, getDoc } = await import('firebase/firestore')
  const db = await getClientDb()
  const ref = doc(db, 'profiles', uid, 'router', 'default')
  const snap = await getDoc(ref)
  if (snap.exists()) {
    const d = snap.data() as any
    return { avgReward: d?.meta?.avgReward ?? 0, lastUpdated: d?.meta?.lastUpdated ?? 0, adaptive: d?.meta?.adaptive ?? true }
  }
  return { avgReward: 0, lastUpdated: 0, adaptive: true }
}

export async function getFullProfile(uid: string) {
  try {
    if (typeof window === 'undefined') {
      const db = await getAdminDb()
      if (db) {
        const ref = db.collection('profiles').doc(uid).collection('router').doc('default')
        const snap = await ref.get()
        if (snap.exists) return snap.data() as any
        return null
      }
    }
  } catch {}
  const { doc, getDoc } = await import('firebase/firestore')
  const db = await getClientDb()
  const ref = doc(db, 'profiles', uid, 'router', 'default')
  const snap = await getDoc(ref)
  return snap.exists() ? (snap.data() as any) : null
}

export async function setAdaptive(uid: string, adaptive: boolean) {
  try {
    if (typeof window === 'undefined') {
      const db = await getAdminDb()
      if (db) {
        const ref = db.collection('profiles').doc(uid).collection('router').doc('default')
        await ref.set({ meta: { adaptive } } as any, { merge: true })
        return { ok: true }
      }
    }
  } catch {}
  const { doc, setDoc } = await import('firebase/firestore')
  const db = await getClientDb()
  const ref = doc(db, 'profiles', uid, 'router', 'default')
  await setDoc(ref, { meta: { adaptive } } as any, { merge: true })
  return { ok: true }
}
