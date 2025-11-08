import { getAdminDb } from '@/lib/server/firebaseAdmin'

export async function logWsAccess(entry: { uid?: string; topic: string; allowed: boolean; reason?: string }) {
  try {
    const db = getAdminDb()
    await db.collection('ws_access_logs').add({
      ...entry,
      ts: new Date(),
    })
  } catch (e) {
    // non-fatal: avoid crashing WS on logging issues
    console.warn('[wsLogs] failed to write log:', (e as Error).message)
  }
}

