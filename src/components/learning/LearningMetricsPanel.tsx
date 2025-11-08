'use client'
import * as React from 'react'
import { useLearningSessions } from '@/lib/learning'
import { useSession } from 'next-auth/react'
import TrendChart from '@/components/learning/TrendChart'

type Segment = {
  experiments: number
  successes: number
  successRate: number
  avgRuntimeMs: number
}

type ServerAnalytics = {
  totals: Segment
  segments: Record<string, Segment>
}

function computeSegments(rows: any[]): Record<string, Segment> {
  const seg: Record<string, Segment> = {}
  for (const r of rows) {
    const k = String(r.labType ?? 'unknown')
    if (!seg[k]) seg[k] = { experiments: 0, successes: 0, successRate: 0, avgRuntimeMs: 0 }
    seg[k].experiments += 1
    if (r.success) seg[k].successes += 1
  }
  for (const [k, s] of Object.entries(seg)) {
    s.successRate = s.experiments ? s.successes / s.experiments : 0
    const sum = rows.filter(r => String(r.labType ?? 'unknown') === k).reduce((a, b) => a + (b.runtimeMs ?? 0), 0)
    s.avgRuntimeMs = s.experiments ? Math.round(sum / s.experiments) : 0
  }
  return seg
}

export default function LearningMetricsPanel({ userId }: { userId?: string }) {
  const { data: session } = useSession()
  const effectiveUserId = userId ?? (session as any)?.user?.id
  const { sessions, error } = useLearningSessions(effectiveUserId)
  const total = sessions?.length ?? 0
  const successes = sessions?.filter(s => !!s.success).length ?? 0
  const successRate = total ? successes / total : 0
  const avgRuntimeMs = total ? Math.round((sessions ?? []).reduce((a, b) => a + (b.runtimeMs ?? 0), 0) / total) : 0
  const [serverAnalytics, setServerAnalytics] = React.useState<ServerAnalytics | null>(null)
  const [serverErr, setServerErr] = React.useState<string | null>(null)

  React.useEffect(() => {
    let canceled = false
    async function run() {
      if (!effectiveUserId) { setServerAnalytics(null); setServerErr(null); return }
      try {
        const res = await fetch(`/api/learning/analytics?userId=${encodeURIComponent(effectiveUserId)}`)
        const json = await res.json()
        if (!canceled) setServerAnalytics(json?.totals && json?.segments ? json as ServerAnalytics : null)
      } catch (e) {
        if (!canceled) setServerErr((e as Error).message)
      }
    }
    run()
    const id = setInterval(run, 30000)
    return () => { canceled = true; clearInterval(id) }
  }, [effectiveUserId])

  const segments = serverAnalytics?.segments ?? (sessions ? computeSegments(sessions) : {})
  const kpi = serverAnalytics?.totals ?? { experiments: total, successes, successRate, avgRuntimeMs }

  // Build small trends from recent sessions
  const recent = React.useMemo(() => (sessions ?? []).slice(0, 20).reverse(), [sessions])
  const runtimeTrend = React.useMemo(() => recent.map(s => Number(s.runtimeMs ?? 0)), [recent])
  const successTrend = React.useMemo(() => {
    if (!recent.length) return [] as number[]
    let cum = 0
    return recent.map((s, idx) => { cum += s.success ? 1 : 0; return +(cum / (idx + 1)).toFixed(3) })
  }, [recent])

  return (
    <div className="rounded-md border border-zinc-800 p-4 text-sm">
      <div className="font-semibold mb-2">Learning Metrics</div>
      {error && <div className="text-rose-500">Error: {String(error.message)}</div>}
      {serverErr && <div className="text-rose-500">Server: {serverErr}</div>}
      <h3 className="text-zinc-200 text-sm font-medium mt-2 mb-2">Overall Totals</h3>
      <div className="rounded border border-zinc-800 p-3 mb-3 bg-zinc-950/30">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Metric label="Success Rate" value={`${(kpi.successRate * 100).toFixed(1)}%`} />
          <Metric label="Average Runtime" value={`${kpi.avgRuntimeMs} ms`} />
          <Metric label="Total Experiments" value={kpi.experiments} />
          <Metric label="Total Successes" value={kpi.successes} />
        </div>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <div className="text-[11px] text-zinc-400 mb-1">Runtime Trend</div>
            <TrendChart title="Runtime" points={runtimeTrend} color="rgba(59,130,246,1)" />
          </div>
          <div>
            <div className="text-[11px] text-zinc-400 mb-1">Success Rate Trend</div>
            <TrendChart title="Success Rate" points={successTrend} color="rgba(16,185,129,1)" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 hidden">
        <Metric label="Experiments" value={kpi.experiments} />
        <Metric label="Successes" value={kpi.successes} />
        <Metric label="Success Rate" value={`${(kpi.successRate * 100).toFixed(1)}%`} />
        <Metric label="Avg Runtime" value={`${kpi.avgRuntimeMs} ms`} />
      </div>
      {!!serverAnalytics && (
        <div className="mt-3 text-xs text-zinc-400">Using server analytics (user scoped).</div>
      )}
      <div className="mt-4">
        <div className="font-medium mb-1">Per Lab Type</div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(segments).map(([lab, s]) => (
            <div key={lab} className="rounded border border-zinc-800 p-3">
              <div className="text-xs text-zinc-400">{lab}</div>
              <div className="mt-1 flex gap-4 text-xs">
                <span>exp {s.experiments}</span>
                <span>succ {s.successes}</span>
                <span>rate {(s.successRate * 100).toFixed(1)}%</span>
                <span>avg {s.avgRuntimeMs}ms</span>
              </div>
            </div>
          ))}
          {!sessions?.length && <div className="text-xs text-zinc-500">No sessions yet.</div>}
        </div>
      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded border border-zinc-800 p-3">
      <div className="text-xs text-zinc-400">{label}</div>
      <div className="text-base mt-1">{value}</div>
    </div>
  )
}
