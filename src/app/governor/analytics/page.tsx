'use client'
import React from 'react'
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore'
import { getDbInstance } from '@/lib/firebase/client'

type GovEvent = {
  event: string
  agentId?: string
  meta?: Record<string, any>
  timestamp?: number
}

const GOV_EVENTS = ['governor_allow','governor_block','governor_constitution_ok','governor_constitution_block']

export default function GovernorAnalyticsPage(){
  const [rows, setRows] = React.useState<GovEvent[]>([])
  const [byEvent, setByEvent] = React.useState<Record<string, number>>({})
  const [byAgent, setByAgent] = React.useState<Record<string, number>>({})
  const [byHour, setByHour] = React.useState<Record<string, number>>({})

  React.useEffect(()=>{
    const db = getDbInstance(); if(!db) return
    const qRef = query(collection(db,'telemetry'), where('event','in', GOV_EVENTS as any), orderBy('timestamp','desc'), limit(500))
    const unsub = onSnapshot(qRef, (snap)=>{
      const data = snap.docs.map(d=>d.data() as GovEvent)
      setRows(data)
      const ev: Record<string,number> = {}
      const ag: Record<string,number> = {}
      const hr: Record<string,number> = {}
      for(const r of data){
        ev[r.event] = (ev[r.event]||0)+1
        const a = r.agentId || 'unknown'; ag[a] = (ag[a]||0)+1
        const t = r.timestamp || Date.now(); const h = new Date(t).getHours(); const k = String(h).padStart(2,'0')
        hr[k] = (hr[k]||0)+1
      }
      setByEvent(ev); setByAgent(ag); setByHour(hr)
    })
    return ()=>unsub()
  },[])

  function DictTable({ title, dict, highlight }: { title: string; dict: Record<string, number>; highlight?: (k:string)=>boolean }){
    const entries = Object.entries(dict).sort((a,b)=>b[1]-a[1])
    return (
      <div className="rounded-xl border border-amber-500/20 p-3 bg-black/30">
        <div className="text-sm text-amber-300/80 mb-2">{title}</div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          {entries.map(([k,v])=> (
            <React.Fragment key={k}>
              <div className={highlight && highlight(k) ? 'text-rose-400 font-medium' : 'text-amber-200'}>{k}</div>
              <div className="text-amber-400/70">{v}</div>
            </React.Fragment>
          ))}
          {entries.length===0 && <div className="text-amber-400/60">No data</div>}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6 bg-black/80">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-semibold text-amber-200">Governor Analytics</h1>
        <p className="text-amber-400/80 mb-4">Aggregates of recent governor decisions to guide tuning.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <DictTable title="By Event" dict={byEvent} highlight={(k)=>k.includes('block')} />
          <DictTable title="By Agent" dict={byAgent} />
          <DictTable title="Blocks by Hour (0-23)" dict={byHour} />
        </div>
        <div className="mt-4 text-xs text-amber-300/70">Sample size: {rows.length}</div>
      </div>
    </div>
  )
}

