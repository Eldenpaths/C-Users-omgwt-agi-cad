'use client'
import React from 'react'
import { getPolicy, setPolicy } from '@/lib/routerProfiles/policyStore'
import { getAuth } from 'firebase/auth'

export default function PolicyControls() {
  const [uid, setUid] = React.useState<string | null>(null)
  const [mode, setMode] = React.useState<'balanced'|'risk-seeking'|'conservative'>('balanced')
  const [windowN, setWindowN] = React.useState(50)
  const [rebias, setRebias] = React.useState(0.05)
  const [lastAuto, setLastAuto] = React.useState<number | null>(null)

  React.useEffect(() => {
    const unsub = getAuth().onAuthStateChanged(async u => {
      if (!u) return
      setUid(u.uid)
      try {
        const cfg = await getPolicy(u.uid)
        setMode(cfg.mode)
        setWindowN(cfg.window)
        setRebias(cfg.rebiasRate)
        setLastAuto(cfg.lastAutoTune ?? null)
      } catch {}
    })
    return () => unsub()
  }, [])

  async function save(partial: Partial<{mode:string; window:number; rebiasRate:number}>) {
    if (!uid) return
    if (partial.mode) setMode(partial.mode as any)
    if (typeof partial.window === 'number') setWindowN(partial.window)
    if (typeof partial.rebiasRate === 'number') setRebias(partial.rebiasRate)
    try { await setPolicy(uid, partial as any) } catch {}
  }

  return (
    <div className="rounded-xl border p-3 grid gap-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">Reward Policy</div>
        <div className="text-xs text-gray-500">
          {lastAuto ? <>Last Auto-Tune: {timeAgo(lastAuto)}</> : <>No auto-tune yet</>}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={mode}
          onChange={(e)=>save({ mode: e.target.value })}
          className="rounded-md border px-2 py-1 text-sm"
        >
          <option value="balanced">Balanced</option>
          <option value="risk-seeking">Risk-seeking</option>
          <option value="conservative">Conservative</option>
        </select>

        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500 w-16">Window</label>
          <input type="range" min={10} max={200} step={5}
            value={windowN}
            onChange={(e)=>save({ window: Number(e.target.value) })}
          />
          <span className="text-xs tabular-nums">{windowN}</span>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500 w-16">Rebias</label>
          <input type="range" min={0.01} max={0.25} step={0.01}
            value={rebias}
            onChange={(e)=>save({ rebiasRate: Number(e.target.value) })}
          />
          <span className="text-xs tabular-nums">{rebias.toFixed(2)}</span>
        </div>
      </div>

      <div className="text-xs text-gray-500">
        Policy adjusts agent <code>bias</code> based on rolling ?avg over <b>{windowN}</b> outcomes.
      </div>
    </div>
  )
}

function timeAgo(ts: number) {
  const s = Math.max(1, Math.floor((Date.now() - ts)/1000))
  const units: [number,string][] = [[86400,'d'],[3600,'h'],[60,'m']]
  for (const [u, label] of units) if (s >= u) return `${Math.floor(s/u)}${label} ago`
  return `${s}s ago`
}
