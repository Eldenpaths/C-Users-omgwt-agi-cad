'use client'
import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'

export type RouterWeights = {
  gpt: number
  claude: number
  gemini: number
  grok: number
}

export type HUDSettings = {
  phase: string
  auditIntervalDays: number
  router: RouterWeights
}

const DEFAULTS: HUDSettings = {
  phase: '18E – Cross-Node Sync',
  auditIntervalDays: 7,
  router: { gpt: 50, claude: 25, gemini: 15, grok: 10 },
}

export function loadSettings(): HUDSettings {
  try {
    const raw = localStorage.getItem('hud.settings')
    if (!raw) return DEFAULTS
    const parsed = JSON.parse(raw)
    return { ...DEFAULTS, ...parsed }
  } catch {
    return DEFAULTS
  }
}

export function saveSettings(s: HUDSettings) {
  try { localStorage.setItem('hud.settings', JSON.stringify(s)) } catch {}
}

export default function SettingsDrawer({ open, onClose, onApply }:{
  open: boolean
  onClose: () => void
  onApply: (s: HUDSettings) => void
}) {
  const [settings, setSettings] = useState<HUDSettings>(DEFAULTS)
  const [vaultWeights, setVaultWeights] = useState<RouterWeights | null>(null)
  useEffect(() => { if (open) setSettings(loadSettings()) }, [open])

  const total = useMemo(() => {
    const r = settings.router; return r.gpt + r.claude + r.gemini + r.grok
  }, [settings])

  const setWeight = (k: keyof RouterWeights, v: number) =>
    setSettings(s => ({ ...s, router: { ...s.router, [k]: v } }))

  const apply = () => {
    // normalize to 100
    const r = settings.router
    const sum = Math.max(1, r.gpt + r.claude + r.gemini + r.grok)
    const norm = {
      gpt: Math.round((r.gpt / sum) * 100),
      claude: Math.round((r.claude / sum) * 100),
      gemini: Math.round((r.gemini / sum) * 100),
      grok: Math.round((r.grok / sum) * 100),
    }
    const next: HUDSettings = { ...settings, router: norm }
    saveSettings(next)
    onApply(next)
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/50" onClick={onClose} />
          <motion.aside
            className="absolute top-0 right-0 h-full w-[360px] bg-[#081018] border-l border-cyan-700/40 p-4 text-cyan-100"
            initial={{ x: 380 }} animate={{ x: 0 }} exit={{ x: 380 }} transition={{ type: 'spring', stiffness: 220, damping: 26 }}
          >
            <h3 className="text-cyan-300 font-semibold mb-2">Settings</h3>

            <label className="block text-xs text-cyan-300/80 mt-3">Active Phase</label>
            <input
              className="w-full mt-1 bg-[#0b1117] border border-cyan-700/40 rounded px-2 py-1 text-sm"
              value={settings.phase}
              onChange={e=>setSettings(s=>({...s, phase: e.target.value}))}
            />

            <label className="block text-xs text-cyan-300/80 mt-3">Audit Interval (days)</label>
            <input
              type="number" min={1} max={30}
              className="w-full mt-1 bg-[#0b1117] border border-cyan-700/40 rounded px-2 py-1 text-sm"
              value={settings.auditIntervalDays}
              onChange={e=>setSettings(s=>({...s, auditIntervalDays: Number(e.target.value||7)}))}
            />

            <div className="mt-4 text-xs text-cyan-300/80">Router Weights (sum {total}%)</div>
            <Slider label="GPT" value={settings.router.gpt} onChange={v=>setWeight('gpt', v)} />
            <Slider label="Claude" value={settings.router.claude} onChange={v=>setWeight('claude', v)} />
            <Slider label="Gemini" value={settings.router.gemini} onChange={v=>setWeight('gemini', v)} />
            <Slider label="Grok" value={settings.router.grok} onChange={v=>setWeight('grok', v)} />

            <div className="mt-6 flex gap-2">
              <button onClick={onClose} className="px-3 py-1 rounded border border-cyan-700/40">Cancel</button>
              <button onClick={apply} className="px-3 py-1 rounded bg-cyan-700/40 border border-cyan-500/50 hover:bg-cyan-700/50">Apply</button>
              <button
                onClick={async ()=>{
                  try {
                    const resp = await fetch('/api/router/weights');
                    const json = await resp.json();
                    if (json?.weights) {
                      const r = json.weights;
                      setSettings(s=>({ ...s, router: {
                        gpt: r.gpt ?? s.router.gpt,
                        claude: r.claude ?? s.router.claude,
                        gemini: r.gemini ?? s.router.gemini,
                        grok: r.grok ?? s.router.grok,
                      }}))
                      setVaultWeights({
                        gpt: r.gpt ?? 0,
                        claude: r.claude ?? 0,
                        gemini: r.gemini ?? 0,
                        grok: r.grok ?? 0,
                      })
                      toast.success('Loaded router weights from Vault');
                    } else {
                      toast('No weights found in Vault');
                    }
                  } catch { toast.error('Failed to load from Vault'); }
                }}
                className="ml-auto px-3 py-1 rounded border border-cyan-600/50 hover:bg-cyan-800/40"
              >
                Load from Vault
              </button>
            </div>

            {vaultWeights && (
              <div className="mt-4 text-xs text-cyan-300/80">
                <div className="mb-1">Current vs Proposed (Vault → Sliders):</div>
                <DiffRow k="GPT" a={vaultWeights.gpt} b={settings.router.gpt} />
                <DiffRow k="Claude" a={vaultWeights.claude} b={settings.router.claude} />
                <DiffRow k="Gemini" a={vaultWeights.gemini} b={settings.router.gemini} />
                <DiffRow k="Grok" a={vaultWeights.grok} b={settings.router.grok} />
              </div>
            )}

            <div className="mt-4 flex gap-2">
              <button
                onClick={async ()=>{
                  try {
                    const resp = await fetch('/api/hud/settings', {
                      method: 'POST',
                      headers: {
                        'x-mission-control-key': (process.env.NEXT_PUBLIC_MISSION_CONTROL_KEY||''),
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({ settings })
                    })
                    if (!resp.ok) throw new Error('save failed')
                    toast.success('Settings saved to audit log')
                  } catch { toast.error('Failed to save settings') }
                }}
                className="px-3 py-1 rounded border border-cyan-600/50 hover:bg-cyan-800/40"
              >
                Save + Audit
              </button>
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Slider({ label, value, onChange }:{ label: string, value: number, onChange: (v:number)=>void }) {
  return (
    <div className="mt-2">
      <div className="flex justify-between text-xs"><span>{label}</span><span>{value}%</span></div>
      <input type="range" min={0} max={100} value={value}
        onChange={e=>onChange(Number(e.target.value))}
        className="w-full accent-cyan-500" />
    </div>
  )
}

function DiffRow({ k, a, b }:{ k:string, a:number, b:number }) {
  const delta = (b - a);
  const sign = delta === 0 ? '' : delta > 0 ? '+' : '';
  const color = delta === 0 ? 'text-cyan-300/70' : delta > 0 ? 'text-emerald-400' : 'text-amber-300';
  return (
    <div className="flex justify-between">
      <span>{k}</span>
      <span className={color}>{a}% → {b}% ({sign}{delta})</span>
    </div>
  )
}
