'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useDriftFeed } from '../hooks/useDriftFeed'
import SettingsDrawer, { HUDSettings, loadSettings } from './SettingsDrawer'
import { Toaster, toast } from 'react-hot-toast'
import RouterPanel from './RouterPanel'

export default function MissionControl() {
  const [phase, setPhase] = useState('18E – Cross-Node Sync')
  const [lastAudit, setLastAudit] = useState(2)
  const [vaultIntegrity, setVaultIntegrity] = useState(100)
  const [canonDeviations, setCanonDeviations] = useState(0)
  const [pnl, setPnl] = useState(487.23)
  const [winRate, setWinRate] = useState(68)
  const [positions, setPositions] = useState(2)
  const [tradingUpdated, setTradingUpdated] = useState<string>('')
  const [fsmix, setFsmix] = useState<{ dVar: number|null, lac: number|null, agents: number|null, updatedAt?: string}>({ dVar: null, lac: null, agents: null })
  const events = useDriftFeed()
  const [drawer, setDrawer] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [reason, setReason] = useState('risk spike')

  // Load saved settings
  useEffect(() => {
    const s = loadSettings()
    setPhase(s.phase)
    setLastAudit(Math.min(lastAudit, s.auditIntervalDays))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Poll metrics (10s)
  useEffect(() => {
    let mounted = true
    async function pull() {
      try {
        const t = await fetch('/api/metrics/trading').then(r=>r.ok?r.json():Promise.reject())
        if (mounted) {
          setPnl(Number(t.pnl||0))
          setWinRate(Number(t.winRate||0))
          setPositions(Number(t.openPositions||0))
          setTradingUpdated(t.updatedAt || '')
        }
      } catch {}
      try {
        const f = await fetch('/api/metrics/fsqmix').then(r=>r.ok?r.json():Promise.reject())
        if (mounted) {
          setFsmix({ dVar: Number(f.dVar||0), lac: Number(f.lacunarity||0), agents: Number(f.activeAgents||0), updatedAt: f.updatedAt })
        }
      } catch {}
    }
    pull()
    const id = setInterval(pull, 10000)
    return () => { mounted = false; clearInterval(id) }
  }, [])

  return (
    <div className="h-full w-full grid grid-cols-2 gap-6 p-6 bg-[#05090d] text-cyan-100 font-mono">
      <Toaster position="top-right" gutter={8} toastOptions={{ style: { background: '#0b1117', color: '#d1f7ff', border: '1px solid #0ea5a5' } }} />
      <div className="col-span-2 -mt-2 -mb-2 flex justify-end">
        <button onClick={()=>setDrawer(true)} className="px-3 py-1 rounded bg-cyan-900/40 border border-cyan-700/40 text-cyan-200 text-xs hover:bg-cyan-800/50">⚙️ Settings</button>
      </div>
      {/* Left column */}
      <div className="space-y-6">
        {/* AI Routing */}
        <Panel title="🎛️ AI Routing">
          <div className="space-y-2">
            <RouterRow label="GPT-5 Builder" status="● Active" />
            <RouterRow label="Claude Auditor" status="○ Standby" />
            <RouterRow label="Gemini Predictor" status="○ Idle" />
            <RouterRow label="Grok Scout" status="○ Idle" />
          </div>
        </Panel>

        {/* Drift Monitor */}
        <Panel title="📊 Drift Monitor">
          <Info label="Current Phase" value={phase} />
          <Info label="Last Audit" value={`${lastAudit} days ago`} warn={lastAudit>6}/>
          <Info label="Vault Integrity" value={`${vaultIntegrity}%`} good />
          <Info label="Canon Deviations" value={canonDeviations} />
        </Panel>

        {/* FS-QMIX Status */}
        <Panel title="🧠 FS-QMIX Status">
          <Info label="D_var" value={fsmix.dVar!=null? `${fsmix.dVar.toFixed(2)}${(fsmix.dVar<2?' (Stable)':'')}` : '—'} good={Boolean(fsmix.dVar && fsmix.dVar<2)} />
          <Info label="Lacunarity" value={fsmix.lac!=null? fsmix.lac.toFixed(2): '—'} />
          <Info label="Active Agents" value={fsmix.agents!=null? fsmix.agents: '—'} />
          <div className="text-[10px] text-cyan-300/60 mt-1">Updated {fsmix.updatedAt ? new Date(fsmix.updatedAt).toLocaleTimeString() : '—'}</div>
        </Panel>
      </div>

      {/* Right column */}
      <div className="space-y-6">
        {/* Trading Orchestrator */}
        <Panel title="📈 Trading Orchestrator">
          <Info label="Daily P&L" value={`${pnl>=0?'+':''}$${pnl.toFixed(2)}`} good={pnl>=0} />
          <Info label="Win Rate" value={`${winRate}%`} />
          <Info label="Open Positions" value={positions} />
          <div className="text-[10px] text-cyan-300/60 mt-1">Updated {tradingUpdated ? new Date(tradingUpdated).toLocaleTimeString() : '—'}</div>
          <button
            onClick={()=>setConfirmOpen(true)}
            className="mt-3 bg-red-600/30 hover:bg-red-600/50 text-red-300 px-3 py-1 rounded"
          >
            ⚡ Panic Flat
          </button>
        </Panel>

        {/* Drift Feed */}
        <Panel title="🌌 Drift Feed">
          <div className="h-48 overflow-y-auto text-xs leading-relaxed text-cyan-300/80">
            {events.slice().reverse().map((e,i)=> (
              <motion.div key={i} initial={{opacity:0}} animate={{opacity:1}}>
                {(e.file || '…')} → {(e.event || 'delta')} @ {new Date(e.time || e.timestamp || Date.now()).toLocaleTimeString()}
              </motion.div>
            ))}
          </div>
        </Panel>

        {/* Fogkeeper Pulse */}
        <Panel title="✨ Fogkeeper Pulse">
          <FogPulse count={events.length}/>
        </Panel>

        {/* Router Autonomy */}
        <RouterPanel />
      </div>
      <SettingsDrawer
        open={drawer}
        onClose={()=>setDrawer(false)}
        onApply={(s: HUDSettings)=>{ setPhase(s.phase) }}
      />

      {/* Confirm Modal */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={()=>setConfirmOpen(false)} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[360px] bg-[#0b1117] border border-red-600/40 rounded-lg p-4 text-red-200">
            <h4 className="font-semibold mb-2">Confirm Panic Flat</h4>
            <p className="text-sm text-red-300/80">This will attempt to close all open positions.</p>
            <label className="block text-xs mt-3 text-red-300/70">Reason (audit)</label>
            <input value={reason} onChange={e=>setReason(e.target.value)} className="w-full mt-1 bg-black/40 border border-red-600/40 rounded px-2 py-1 text-sm text-red-100" />
            <div className="mt-4 flex gap-2 justify-end">
              <button onClick={()=>setConfirmOpen(false)} className="px-3 py-1 rounded border border-red-700/40">Cancel</button>
              <button
                onClick={async ()=>{
                  try {
                    const resp = await fetch('/api/trading/panic-flat', {
                      method: 'POST',
                      headers: {
                        'x-mission-control-key': (process.env.NEXT_PUBLIC_MISSION_CONTROL_KEY||''),
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify({ reason })
                    });
                    if (!resp.ok) throw new Error('Request failed');
                    toast.success('Panic Flat requested');
                    setConfirmOpen(false)
                  } catch {
                    toast.error('Panic Flat failed or unauthorized');
                  }
                }}
                className="px-3 py-1 rounded bg-red-700/40 border border-red-500/50 hover:bg-red-700/60"
              >Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Panel({ title, children }:{title:string, children:any}) {
  return (
    <div className="bg-[#0b1117]/70 border border-cyan-700/40 rounded-xl p-4 shadow-lg shadow-cyan-900/30">
      <h3 className="text-cyan-300 mb-3 font-semibold">{title}</h3>
      {children}
    </div>
  )
}

function Info({ label, value, warn, good }:
  {label:string,value:any,warn?:boolean,good?:boolean}) {
  const color = warn?'text-yellow-400':good?'text-emerald-400':'text-cyan-100'
  return (
    <div className="flex justify-between">
      <span>{label}</span><span className={color}>{value}</span>
    </div>
  )
}

function RouterRow({ label, status }:{label:string,status:string}) {
  return (
    <div className="flex justify-between">
      <span>{label}</span><span className="text-cyan-400">{status}</span>
    </div>
  )
}

function FogPulse({ count }:{count:number}) {
  const [glow, setGlow] = useState(0)
  useEffect(()=>{ setGlow(1); const t=setTimeout(()=>setGlow(0),300) ;return()=>clearTimeout(t) },[count])
  return (
    <motion.div
      animate={{opacity: 0.3 + glow*0.7, scale: 1 + glow*0.1}}
      className="h-24 rounded-lg bg-gradient-to-r from-cyan-700/40 to-blue-900/40 border border-cyan-600/50 flex items-center justify-center text-cyan-300 text-sm"
    >
      {count} events logged
    </motion.div>
  )
}
