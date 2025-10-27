// ✅ AGI-CAD Phase 7B — Checksum Sentinel Cloud Function
import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import * as crypto from 'crypto'

initializeApp()
const db = getFirestore()

export const runChecksumSentinel = async () => {
  const vaultRef = db.collection('vaultMeta').doc('phase7')
  const snapshot = await vaultRef.get()
  const data = snapshot.data()

  if (!data) return console.warn('[Sentinel] No vaultMeta/phase7 found.')

  // Compute SHA-256 checksum of sorted keys
  const ordered = Object.keys(data).sort().reduce((obj, key) => {
    obj[key] = data[key]
    return obj
  }, {})
  const hash = crypto
    .createHash('sha256')
    .update(JSON.stringify(ordered))
    .digest('hex')

  if (data.lastChecksum !== hash) {
    await vaultRef.update({
      lastChecksum: hash,
      lastSweepAt: new Date(),
      syncDelta: Date.now() - data.heartbeatAt?.toMillis?.(),
      sweepStatus: 'ALERT',
    })
    console.warn('[Sentinel] Integrity mismatch — checksum updated.')
  } else {
    await vaultRef.update({
      sweepStatus: 'READY',
      lastSweepAt: new Date(),
    })
    console.log('[Sentinel] Integrity stable.')
  }
}
