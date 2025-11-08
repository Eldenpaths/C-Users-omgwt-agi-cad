'use client'
import * as React from 'react'

type Props = {
  type: 'accuracy' | 'resource' | 'time'
}

export default function TaskControls({ type }: Props) {
  const [complexity, setComplexity] = React.useState(30)
  const [deadline, setDeadline] = React.useState(5000)
  const [energy, setEnergy] = React.useState(100)
  const [saving, setSaving] = React.useState(false)
  const [msg, setMsg] = React.useState<string | null>(null)

  // Load saved constraints on mount
  React.useEffect(() => {
    let canceled = false
    async function load() {
      try {
        const res = await fetch('/api/neuro/tasks/constraints')
        if (!res.ok) return
        const json = await res.json()
        const data = json?.data || {}
        const t = data?.[type]
        if (!t || canceled) return
        if (typeof t.complexity === 'number') setComplexity(t.complexity)
        if (type === 'time' && typeof t.timeDeadlineMs === 'number') setDeadline(t.timeDeadlineMs)
        if (type === 'resource' && typeof t.energyLimit === 'number') setEnergy(t.energyLimit)
      } catch {}
    }
    load()
    return () => { canceled = true }
  }, [type])

  async function save() {
    setSaving(true)
    setMsg(null)
    try {
      const res = await fetch('/api/neuro/tasks/constraints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          constraints: {
            complexity,
            timeDeadlineMs: type === 'time' ? deadline : undefined,
            energyLimit: type === 'resource' ? energy : undefined,
          },
        }),
      })
      const json = await res.json()
      if (!json.ok) throw new Error(json.error || 'save failed')
      setMsg('Saved ✔')
    } catch (e) {
      setMsg('Error: ' + (e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-md border border-zinc-800 p-4 text-sm">
      <div className="font-semibold mb-2">Task Controls — {type}</div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-zinc-400">Complexity: {complexity}</label>
          <input type="range" min={1} max={100} value={complexity} onChange={(e) => setComplexity(Number(e.target.value))} className="w-full" />
        </div>
        {type === 'time' && (
          <div>
            <label className="text-xs text-zinc-400">Deadline (ms): {deadline}</label>
            <input type="range" min={500} max={20000} step={100} value={deadline} onChange={(e) => setDeadline(Number(e.target.value))} className="w-full" />
          </div>
        )}
        {type === 'resource' && (
          <div>
            <label className="text-xs text-zinc-400">Energy Cap: {energy}</label>
            <input type="range" min={10} max={500} step={10} value={energy} onChange={(e) => setEnergy(Number(e.target.value))} className="w-full" />
          </div>
        )}
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button className="px-3 py-1 text-xs rounded border border-zinc-700 hover:bg-zinc-800" onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
        {msg && <div className="text-xs text-zinc-400">{msg}</div>}
      </div>
    </div>
  )
}
