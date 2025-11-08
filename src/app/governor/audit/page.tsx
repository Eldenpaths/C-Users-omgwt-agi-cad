'use client'
import React from 'react'
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore'
import { getDbInstance } from '@/lib/firebase/client'

type GovEvent = {
  userId?: string
  event: string
  agentId?: string
  labType?: string
  meta?: Record<string, unknown>
  timestamp?: number
  createdAt?: any
}

const EVENTS = [
  'governor_allow',
  'governor_block',
  'governor_constitution_ok',
  'governor_constitution_block',
]

export default function GovernorAuditPage() {
  const [rows, setRows] = React.useState<GovEvent[]>([])
  const [allowCount, setAllowCount] = React.useState(0)
  const [blockCount, setBlockCount] = React.useState(0)

  React.useEffect(() => {
    const db = getDbInstance()
    if (!db) return
    const qRef = query(
      collection(db, 'telemetry'),
      where('event', 'in', EVENTS as any),
      orderBy('timestamp', 'desc'),
      limit(100)
    )
    const unsub = onSnapshot(qRef, (snap) => {
      const data = snap.docs.map((d) => d.data() as GovEvent)
      setRows(data)
      setAllowCount(data.filter((d) => d.event === 'governor_allow' || d.event === 'governor_constitution_ok').length)
      setBlockCount(data.filter((d) => d.event === 'governor_block' || d.event === 'governor_constitution_block').length)
    })
    return () => unsub()
  }, [])

  function exportCSV() {
    const header = 'timestamp,event,agentId,meta\n'
    const lines = rows.map((r) => [
      r.timestamp ?? '',
      r.event,
      r.agentId ?? '',
      JSON.stringify(r.meta ?? {}),
    ].map((x) => String(x).replaceAll('"', '""')).join(','))
    const csv = header + lines.join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'governor-audit.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen p-6 bg-black/80">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-semibold text-amber-200">Governor Audit</h1>
        <p className="text-amber-400/80 mb-4">Live feed of governor decisions (allow/block + constitution checks)</p>

        <div className="mb-3 flex items-center gap-4 text-sm">
          <span className="text-emerald-400">Allow: {allowCount}</span>
          <span className="text-rose-400">Block: {blockCount}</span>
          <button onClick={exportCSV} className="ml-auto px-3 py-1.5 rounded border border-amber-500/30 hover:bg-amber-500/10 text-amber-100">Export CSV</button>
        </div>

        <div className="rounded-xl border border-amber-500/20 divide-y divide-amber-500/10 bg-black/30">
          {rows.map((r, i) => (
            <div key={i} className="p-3 flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: (r.event.includes('block') ? '#f43f5e' : '#10b981') }} />
                <span className="text-amber-100">{r.event}</span>
                {r.agentId && <span className="text-amber-300/70">· {r.agentId}</span>}
              </div>
              <div className="text-amber-400/70 font-mono">{r.timestamp ? new Date(r.timestamp).toLocaleString() : ''}</div>
            </div>
          ))}
          {rows.length === 0 && (
            <div className="p-4 text-amber-300/60 text-sm">No governor events yet.</div>
          )}
        </div>
      </div>
    </div>
  )
}

