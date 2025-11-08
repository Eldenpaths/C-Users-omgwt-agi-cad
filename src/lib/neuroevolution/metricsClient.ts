import type { Firestore } from 'firebase/firestore'
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { db }: { db: Firestore } = require('../firebase.js')

export function subscribeTaskMetrics(agentId: string, handler: (rows: any[]) => void, taskType?: string) {
  let q = query(collection(db, 'evolution_metrics'), orderBy('createdAt', 'desc'))
  if (agentId) q = query(q, where('agentId', '==', agentId))
  if (taskType) q = query(q, where('taskType', '==', taskType))
  const unsub = onSnapshot(q, (snap) => {
    handler(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })))
  })
  return unsub
}

