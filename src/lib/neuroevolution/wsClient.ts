'use client'
export type MetricsMessage = {
  type: 'metrics'
  payload: {
    agentId: string
    taskType: string
    generation: number
    metrics: { timeMs?: number; accuracy?: number; energy?: number }
    fitness?: number
  }
}

export function connectMetricsSocket(onMessage: (msg: MetricsMessage) => void, topic?: string) {
  const qs = topic ? `?topic=${encodeURIComponent(topic)}` : ''
  const url = (typeof window !== 'undefined') ? `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/api/neuro/metrics${qs}` : ''
  const ws = new WebSocket(url)
  ws.onmessage = (ev) => {
    try {
      const msg = JSON.parse(ev.data) as MetricsMessage
      if (msg?.type === 'metrics') onMessage(msg)
    } catch {}
  }
  return ws
}
