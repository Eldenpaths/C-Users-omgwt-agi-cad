// src/components/RouterControlPanel.tsx
'use client'

import React from 'react'
import type { AgentId } from '@/lib/routerWeights'

type AgentStats = {
  agent: AgentId
  emaSuccess: number
  emaLatency: number
  bias?: number
}

type Snapshot = {
  agents: Record<AgentId, AgentStats>
  version: number
  updatedAt: number
}

type Props = { open: boolean; onClose(): void }

export default function RouterControlPanel({ open, onClose }: Props) {
  const [snap, setSnap] = React.useState<Snapshot | null>(null)
  const [overrides, setOverrides] = React.useState<Record<AgentId, Partial<AgentStats>>>({} as any)
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    if (!open) return
    fetch('/api/route')
      .then((r) => r.json())
      .then((s: Snapshot) => {
        setSnap(s)
        const ov: any = {}
        Object.values(s.agents).forEach((a) => {
          ov[a.agent] = { emaSuccess: a.emaSuccess, emaLatency: a.emaLatency, bias: a.bias ?? 0 }
        })
        setOverrides(ov)
      })
      .catch(() => {})
  }, [open])

  if (!open) return null

  function update(agent: AgentId, key: keyof AgentStats, value: number) {
    setOverrides((prev) => ({ ...prev, [agent]: { ...prev[agent], [key]: value } }))
  }

  async function saveAll() {
    if (!snap) return
    setSaving(true)
    try {
      for (const agent of Object.keys(overrides) as AgentId[]) {
        const v = overrides[agent] as any
        await fetch('/api/route', {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ agent, emaSuccess: v.emaSuccess, emaLatency: v.emaLatency, bias: v.bias }),
        })
      }
    } finally {
      setSaving(false)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-3xl rounded-2xl bg-white p-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold">Router Control Panel</div>
          <button className="px-3 py-1 rounded border text-sm" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          {snap &&
            (Object.values(snap.agents) as AgentStats[]).map((a) => (
              <div key={a.agent} className="rounded-xl border p-3">
                <div className="font-medium mb-2">{a.agent}</div>
                <div className="text-xs text-gray-500">EMA Success: {(overrides[a.agent]?.emaSuccess ?? a.emaSuccess).toFixed(3)}</div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={overrides[a.agent]?.emaSuccess ?? a.emaSuccess}
                  onChange={(e) => update(a.agent, 'emaSuccess', Number(e.target.value))}
                  className="w-full"
                />
                <div className="mt-2 text-xs text-gray-500">EMA Latency: {Math.round(overrides[a.agent]?.emaLatency ?? a.emaLatency)} ms</div>
                <input
                  type="range"
                  min={50}
                  max={5000}
                  step={10}
                  value={overrides[a.agent]?.emaLatency ?? a.emaLatency}
                  onChange={(e) => update(a.agent, 'emaLatency', Number(e.target.value))}
                  className="w-full"
                />
                <div className="mt-2 text-xs text-gray-500">Bias: {(overrides[a.agent]?.bias ?? a.bias ?? 0).toFixed(2)}</div>
                <input
                  type="range"
                  min={-0.5}
                  max={0.5}
                  step={0.01}
                  value={overrides[a.agent]?.bias ?? a.bias ?? 0}
                  onChange={(e) => update(a.agent, 'bias', Number(e.target.value))}
                  className="w-full"
                />
              </div>
            ))}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button className="px-3 py-1 rounded border text-sm" onClick={onClose}>
            Cancel
          </button>
          <button className="px-3 py-1 rounded border bg-black text-white text-sm disabled:opacity-50" onClick={saveAll} disabled={saving}>
            {saving ? 'Saving…' : 'Save Overrides'}
          </button>
        </div>
      </div>
    </div>
  )
}

