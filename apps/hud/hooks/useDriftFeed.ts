'use client'
import { useEffect, useState } from 'react'

export function useDriftFeed() {
  const [events, setEvents] = useState<any[]>([])
  useEffect(() => {
    const es = new EventSource('/api/drift/stream')
    es.onmessage = e => {
      try {
        const evt = JSON.parse(e.data)
        setEvents(evts => [...evts.slice(-200), evt])
      } catch {}
    }
    return () => es.close()
  }, [])
  return events
}

