import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore'
import type { PolicyConfig } from './policyTypes'

export async function getPolicy(uid: string): Promise<PolicyConfig> {
  const db = getFirestore()
  const ref = doc(db, 'profiles', uid, 'router', 'policy')
  const snap = await getDoc(ref)
  return snap.exists()
    ? (snap.data() as PolicyConfig)
    : { mode: 'balanced', window: 50, rebiasRate: 0.05 }
}

export async function setPolicy(uid: string, cfg: Partial<PolicyConfig>) {
  const db = getFirestore()
  const ref = doc(db, 'profiles', uid, 'router', 'policy')
  await setDoc(ref, cfg as any, { merge: true })
}
