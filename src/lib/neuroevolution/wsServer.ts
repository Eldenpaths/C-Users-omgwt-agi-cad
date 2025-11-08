import type { NextApiResponse } from 'next'
import type { Server } from 'http'
import { WebSocketServer } from 'ws'
import { verifyWsAuth, canAccessTopic } from './wsAuth'
import { logWsAccess } from './wsLogs'

type MetricsPayload = {
  agentId: string
  taskType: string
  generation: number
  metrics: { timeMs?: number; accuracy?: number; energy?: number }
  fitness?: number
}

declare global {
  // eslint-disable-next-line no-var
  var __NEURO_WSS__: WebSocketServer | undefined
}

type WsWithMeta = import('ws').WebSocket & { topic?: string; uid?: string }

export function ensureWsServer(res: NextApiResponse) {
  // @ts-ignore
  const srv: Server & { wss?: WebSocketServer } = res.socket.server
  if (!global.__NEURO_WSS__) {
    const wss = new WebSocketServer({ noServer: true })
    // upgrade handler
    srv.on('upgrade', (req, socket, head) => {
      if (!req.url?.startsWith('/api/neuro/metrics')) return
      // Extract topic from URL: /api/neuro/metrics?topic=...
      const url = new URL(req.url, 'http://localhost')
      const topic = url.searchParams.get('topic') || ''
      verifyWsAuth(req).then(async (auth) => {
        const allowed = auth.ok && canAccessTopic(auth.token, topic)
        if (!allowed) {
          await logWsAccess({ uid: String(auth.token?.sub || ''), topic, allowed: false, reason: auth.reason || 'forbidden' })
          try { socket.destroy() } catch {}
          return
        }
        wss.handleUpgrade(req, socket, head, (ws) => {
          const sock = ws as WsWithMeta
          sock.topic = topic
          sock.uid = String(auth.token?.sub || '')
          logWsAccess({ uid: sock.uid, topic, allowed: true }).catch(() => {})
          wss.emit('connection', ws, req)
        })
      })
    })
    global.__NEURO_WSS__ = wss
  }
  return global.__NEURO_WSS__!
}

export function broadcastMetrics(payload: MetricsPayload) {
  const wss = global.__NEURO_WSS__
  if (!wss) return
  const topic = `agent/${payload.agentId}/metrics`
  broadcastTopic(topic, { type: 'metrics', payload })
}

export function broadcastTopic(topic: string, message: any) {
  const wss = global.__NEURO_WSS__
  if (!wss) return
  const data = JSON.stringify(message)
  wss.clients.forEach((client: any) => {
    const c = client as WsWithMeta
    if (c.topic === topic) {
      try { c.send(data) } catch {}
    }
  })
}
