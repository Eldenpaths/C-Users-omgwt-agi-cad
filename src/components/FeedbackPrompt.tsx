'use client'
import React from 'react'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { getDbInstance } from '@/lib/firebase/client'

export default function FeedbackPrompt({ context, meta }: { context: string; meta?: Record<string, any> }){
  const [text, setText] = React.useState('')
  const [status, setStatus] = React.useState<string | null>(null)

  async function send(kind: 'helpful'|'not_helpful'){
    try {
      const db = getDbInstance(); if(!db){ setStatus('offline'); return }
      await addDoc(collection(db, 'feedback'), { kind, context, meta: meta||{}, text, ts: serverTimestamp() })
      setStatus(kind === 'helpful' ? 'Thanks! ✓' : 'Noted. ✓')
      setText('')
    } catch(e:any){ setStatus(`Failed: ${e?.message||'error'}`) }
  }

  return (
    <div className="rounded-lg border border-amber-500/20 p-3 bg-black/20">
      <div className="text-xs text-amber-300/80 mb-1">Feedback</div>
      <textarea value={text} onChange={(e)=>setText(e.target.value)} rows={3} className="w-full rounded bg-black/30 border border-amber-500/20 p-2 text-sm text-amber-100" placeholder="How could this be better?" />
      <div className="mt-2 flex items-center gap-2">
        <button onClick={()=>send('helpful')} className="px-2 py-1 rounded border border-emerald-500 text-emerald-400 hover:bg-emerald-50/5 text-xs">Helpful</button>
        <button onClick={()=>send('not_helpful')} className="px-2 py-1 rounded border border-rose-500 text-rose-400 hover:bg-rose-50/5 text-xs">Not helpful</button>
        {status && <span className="text-xs text-amber-400/80 ml-2">{status}</span>}
      </div>
    </div>
  )
}

