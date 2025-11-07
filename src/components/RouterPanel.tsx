// src/components/RouterPanel.tsx
'use client'

import React from 'react'
import type { AgentId } from '@/lib/routerWeights'
import { getAuthInstance } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { getDbInstance } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import ProfileTrend from '@/components/ProfileTrend'
import { setAdaptive } from '@/lib/routerProfiles/profileStore'
import type { RewardRecord } from '@/lib/routerProfiles/profileTypes'
import ProfileAgentTrends from '@/components/ProfileAgentTrends'

type AgentStats = {
  agent: AgentId
  calls: number
  successes: number
  emaSuccess: number
  emaLatency: number
  lastCalledAt?: number
  lastOutcomeAt?: number
  ucbScore: number
}

type Outcome = {
  taskId: string
  agent: AgentId
  success: boolean
  latencyMs: number
  confidence?: number
  at: number
}

type Snapshot = {
  agents: Record<AgentId, AgentStats>
  recent: Outcome[]
  version: number
  updatedAt: number
}

export default function RouterPanel() {
  const [snap, setSnap] = React.useState<Snapshot | null>(null)
  const [paused, setPaused] = React.useState<boolean>(false)
  const [diff, setDiff] = React.useState<any | null>(null)
  const [adminOffline, setAdminOffline] = React.useState<boolean>(false)
  const [operatorUid, setOperatorUid] = React.useState<string | null>(null)
  const [avgReward, setAvgReward] = React.useState<number | null>(null)
  const [profileUpdatedAt, setProfileUpdatedAt] = React.useState<number | null>(null)
  const [rewards, setRewards] = React.useState<RewardRecord[]>([])
  const [adaptive, setAdaptiveFlag] = React.useState<boolean>(true)

  React.useEffect(() => {
    const es = new EventSource('/api/route?stream=1')
    const handler = (e: MessageEvent<string>) => {
      try {
        const data = JSON.parse(e.data) as Snapshot
        setSnap(data)
      } catch {}
    }
    es.addEventListener('snapshot', handler as EventListener)
    return () => es.close()
  }, [])

  // Observe auth and pull operator profile summary
  React.useEffect(() => {
    const auth = getAuthInstance()
    if (!auth) return
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u?.uid) {
        setOperatorUid(u.uid)
        try {
          const db = getDbInstance()
          const ref = doc(db, 'profiles', u.uid, 'router', 'default')
          const snap = await getDoc(ref)
          if (snap.exists()) {
            const d: any = snap.data()
            setAvgReward(Number(d?.meta?.avgReward ?? 0))
            setProfileUpdatedAt(Number(d?.meta?.lastUpdated ?? 0))
            setRewards(Array.isArray(d?.rewards) ? d.rewards : [])
            setAdaptiveFlag(d?.meta?.adaptive ?? true)
          }
        } catch {}
      } else {
        setOperatorUid(null)
      }
    })
    return () => unsub()
  }, [])

  React.useEffect(() => {
    let active = true
    async function pullStatus() {
      try {
        const r = await fetch('/api/route?status=1').then((x) => x.json())
        if (!active) return
        setPaused(Boolean(r?.status?.paused))
        setDiff(r?.diff || null)
        if (Object.prototype.hasOwnProperty.call(r, 'remote')) setAdminOffline(r.remote === null)
      } catch {}
    }
    pullStatus()
    const id = setInterval(pullStatus, 10000)
    return () => {
      active = false
      clearInterval(id)
    }
  }, [])

  if (!snap) {
    return (
      <div className="rounded-2xl border p-4 shadow-sm">
        <div className="text-sm text-gray-500">Router HUD</div>
        <div className="mt-1 text-lg font-semibold">Connecting…</div>
      </div>
    )
  }

  const agents = Object.values(snap.agents).sort((a, b) => b.ucbScore - a.ucbScore)

  return (
    <div className="grid gap-4">
      <div className="rounded-2xl border p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`inline-block h-2.5 w-2.5 rounded-full ${paused ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400 animate-pulse'}`} />
            <div className="text-sm text-gray-500">Router HUD</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="text-xs px-2 py-1 rounded border hover:bg-gray-50 disabled:opacity-50"
              disabled={paused}
              onClick={() => fetch('/api/route?pause=1').then(() => setPaused(true))}
            >Pause</button>
            <button
              className="text-xs px-2 py-1 rounded border hover:bg-gray-50 disabled:opacity-50"
              disabled={!paused}
              onClick={() => fetch('/api/route?resume=1').then(() => setPaused(false))}
            >Resume</button>
            <div className="text-xs text-gray-400">
              v{snap.version} · {new Date(snap.updatedAt).toLocaleTimeString()}
            </div>
          </div>
        </div>
        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {agents.map((a) => (
            <div key={a.agent} className="rounded-xl border p-3">
              <div className="flex items-center justify-between">
                <div className="font-semibold">{a.agent}</div>
                <div className="text-xs text-gray-500">UCB {a.ucbScore.toFixed(3)}</div>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded bg-gray-50 p-2">
                  <div className="text-[11px] text-gray-500">Calls</div>
                  <div className="font-medium">{a.calls}</div>
                </div>
                <div className="rounded bg-gray-50 p-2">
                  <div className="text-[11px] text-gray-500">Successes</div>
                  <div className="font-medium">{a.successes}</div>
                </div>
                <div className="rounded bg-gray-50 p-2">
                  <div className="text-[11px] text-gray-500">EMA Success</div>
                  <div className="font-medium">{(a.emaSuccess * 100).toFixed(1)}%</div>
                </div>
                <div className="rounded bg-gray-50 p-2">
                  <div className="text-[11px] text-gray-500">EMA Latency</div>
                  <div className="font-medium">{Math.round(a.emaLatency)} ms</div>
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-500">last call: {a.lastCalledAt ? new Date(a.lastCalledAt).toLocaleTimeString() : '—'}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border p-4 shadow-sm">
        <div className="text-sm text-gray-500 mb-2">Recent Routes</div>
        <div className="max-h-64 overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500">
                <th className="py-1">Time</th>
                <th className="py-1">Agent</th>
                <th className="py-1">Success</th>
                <th className="py-1">Latency</th>
                <th className="py-1">Task</th>
              </tr>
            </thead>
            <tbody>
              {snap.recent
                .slice()
                .reverse()
                .map((r) => (
                  <tr key={`${r.taskId}-${r.at}`} className="border-t">
                    <td className="py-1">{new Date(r.at).toLocaleTimeString()}</td>
                    <td className="py-1 font-medium">{r.agent}</td>
                    <td className={`py-1 ${r.success ? 'text-emerald-600' : 'text-rose-600'}`}>{r.success ? '✓' : '✕'}</td>
                    <td className="py-1">{r.latencyMs} ms</td>
                    <td className="py-1 text-gray-500">{r.taskId.slice(0, 8)}…</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl border p-4 shadow-sm text-xs text-gray-600">
        <div className="flex items-center justify-between">
          <div className="font-medium">Snapshot Integrity</div>
          <div>
            <button className="px-2 py-1 rounded border hover:bg-gray-50 mr-2" onClick={() => fetch('/api/route?save=1')}>Save</button>
            <button className="px-2 py-1 rounded border hover:bg-gray-50 mr-2" onClick={() => fetch('/api/route?load=1')}>Load</button>
            <button className="px-2 py-1 rounded border hover:bg-gray-50" onClick={() => fetch('/api/route?reset=1')}>Reset</button>
          </div>
        </div>
        <div className="mt-2">
          {diff?.changed ? (
            <div className="text-amber-600">Δ detected between Firestore and memory (see console for details)</div>
          ) : (
            <div className="text-emerald-600">Snapshots in sync</div>
          )}
        </div>
        {adminOffline && (
          <div className="mt-2 text-amber-500 italic">Admin unavailable · using client snapshot only</div>
        )}
        {operatorUid && (
          <div className="mt-2 text-gray-500">
            Operator: <span className="font-medium">{operatorUid}</span>
            {typeof avgReward === 'number' && (
              <>
                {' '}· Avg Reward {avgReward.toFixed(3)}
              </>
            )}
            {profileUpdatedAt && (
              <>
                {' '}· Profile Saved {new Date(profileUpdatedAt).toLocaleTimeString()}
              </>
            )}
          </div>
        )}
        {operatorUid && rewards.length > 0 && (
          <div className="mt-2">
            <ProfileTrend rewards={rewards.slice(-50)} />
          </div>
        )}
        {operatorUid && rewards.length > 0 && (
          <ProfileAgentTrends rewards={rewards} />
        )}
        {operatorUid && (
          <div className="mt-3 flex items-center gap-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={adaptive}
                onChange={async (e) => {
                  const next = e.target.checked
                  setAdaptiveFlag(next)
                  try { await setAdaptive(operatorUid, next) } catch {}
                }}
              />
              <span className="text-xs">Adaptive Mode ON</span>
            </label>
          </div>
        )}
      </div>
    </div>
  )
}
