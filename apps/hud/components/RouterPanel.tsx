'use client'
import { useEffect, useState } from 'react'

type WeightRow = { agentId: string; successRate: number; avgLatency: number; updatedAt: string }

export default function RouterPanel() {
  const [rows, setRows] = useState<WeightRow[]>([])

  useEffect(() => {
    let active = true
    async function pull() {
      try {
        const data = await fetch('/api/router/route').then((r) => (r.ok ? r.json() : Promise.reject()))
        if (!active) return
        const w = data.weights || {}
        const list: WeightRow[] = Object.keys(w).map((k) => ({
          agentId: k,
          successRate: Number(w[k].successRate ?? 0),
          avgLatency: Number(w[k].avgLatency ?? 0),
          updatedAt: String(w[k].updatedAt ?? ''),
        }))
        setRows(list)
      } catch {
        // silent retry on next interval
      }
    }
    pull()
    const id = setInterval(pull, 10000)
    return () => {
      active = false
      clearInterval(id)
    }
  }, [])

  return (
    <div className="bg-[#0b1117]/70 border border-cyan-700/40 rounded-xl p-4 text-cyan-100">
      <h3 className="text-cyan-300 mb-3 font-semibold">Router Weights</h3>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-cyan-300/80">
            <th className="text-left">Agent</th>
            <th className="text-right">Success</th>
            <th className="text-right">Avg Latency</th>
            <th className="text-right">Updated</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const successClass = r.successRate > 0.9 ? 'text-emerald-400' : r.successRate < 0.7 ? 'text-rose-400' : ''
            return (
              <tr key={r.agentId} className="border-t border-cyan-800/40">
                <td className="py-1">{r.agentId}</td>
                <td className={`py-1 text-right ${successClass}`}>{Math.round(r.successRate * 100)}%</td>
                <td className="py-1 text-right">{r.avgLatency} ms</td>
                <td className="py-1 text-right">{r.updatedAt ? new Date(r.updatedAt).toLocaleTimeString() : '—'}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

