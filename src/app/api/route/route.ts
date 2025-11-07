// src/app/api/route/route.ts
import { NextRequest } from 'next/server'
import { chooseAgent, recordOutcome, getSnapshot, __resetForTests, pauseRouter, resumeRouter, getRouterStatus, setAgentOverride, type RouteTask, type Outcome } from '@/lib/routerWeights'
import { saveSnapshot, loadSnapshot, getRemoteSnapshot } from '@/lib/routerStore.firestore'

// Attempt to restore router state from Firestore on cold start (server only)
if (typeof window === 'undefined') {
  loadSnapshot().catch(() => {})
}

// POST /api/route
// body: { task: RouteTask }
// returns: { agent, snapshot }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const task = (body?.task ?? {}) as RouteTask
    if (!task.id) task.id = crypto.randomUUID()
    task.createdAt ??= Date.now()

    const agent = chooseAgent(task)

    // NOTE: Actual dispatch should occur in your orchestrator after selection.
    return new Response(JSON.stringify({ agent, snapshot: getSnapshot() }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? 'bad request' }), { status: 400 })
  }
}

// PUT /api/route
// body: { outcome: Outcome }
// returns: { ok: true, snapshot }
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const outcome = body?.outcome as Outcome
    if (!outcome?.taskId || !outcome?.agent || outcome.success === undefined || !outcome.latencyMs) {
      return new Response(JSON.stringify({ error: 'invalid outcome' }), { status: 400 })
    }
    outcome.at ??= Date.now()
    recordOutcome(outcome)
    return new Response(JSON.stringify({ ok: true, snapshot: getSnapshot() }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? 'bad request' }), { status: 400 })
  }
}

// GET /api/route?stream=1  -> SSE telemetry stream
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const stream = searchParams.get('stream')
  const save = searchParams.get('save')
  const reset = searchParams.get('reset')
  const load = searchParams.get('load')
  const pause = searchParams.get('pause')
  const resume = searchParams.get('resume')
  const status = searchParams.get('status')

  if (save) {
    try {
      const r = await saveSnapshot()
      return new Response(JSON.stringify({ ok: r.ok, snapshot: getSnapshot() }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    } catch (e: any) {
      return new Response(JSON.stringify({ ok: false, error: e?.message }), { status: 500 })
    }
  }

  if (reset) {
    __resetForTests()
    return new Response(JSON.stringify({ ok: true, snapshot: getSnapshot() }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  }

  if (load) {
    try {
      const r = await loadSnapshot()
      return new Response(JSON.stringify({ ok: r.ok, snapshot: getSnapshot() }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    } catch (e: any) {
      return new Response(JSON.stringify({ ok: false, error: e?.message }), { status: 500 })
    }
  }

  if (pause) {
    pauseRouter()
    return new Response(JSON.stringify({ ok: true, status: getRouterStatus() }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  }

  if (resume) {
    resumeRouter()
    return new Response(JSON.stringify({ ok: true, status: getRouterStatus() }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  }

  if (status) {
    try {
      const mem = getSnapshot()
      const remote = await getRemoteSnapshot()
      const diff: any = { agents: {}, changed: false }
      if (remote?.agents) {
        for (const k of Object.keys(mem.agents)) {
          const m = (mem as any).agents[k]
          const r = (remote as any).agents?.[k]
          if (!r) continue
          const d = {
            emaSuccess: Number((m.emaSuccess - r.emaSuccess).toFixed(4)),
            emaLatency: Math.round(m.emaLatency - r.emaLatency),
            calls: (m.calls || 0) - (r.calls || 0),
          }
          diff.agents[k] = d
          if (Math.abs(d.emaSuccess) > 0 || Math.abs(d.emaLatency) > 0 || Math.abs(d.calls) > 0) diff.changed = true
        }
      }
      return new Response(
        JSON.stringify({ ok: true, status: getRouterStatus(), diff, snapshot: mem, remote }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      )
    } catch {
      // Admin unavailable or diff calc failed; return client snapshot only
      return new Response(
        JSON.stringify({ status: getRouterStatus(), snapshot: getSnapshot(), remote: null }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      )
    }
  }

  if (!stream) {
    return new Response(JSON.stringify(getSnapshot()), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  }

  const encoder = new TextEncoder()
  const streamBody = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(`event: snapshot\ndata: ${JSON.stringify(getSnapshot())}\n\n`))
      const iv = setInterval(() => {
        controller.enqueue(encoder.encode(`event: snapshot\ndata: ${JSON.stringify(getSnapshot())}\n\n`))
      }, 1500)
      // @ts-ignore
      controller._iv = iv
    },
    cancel() {
      // @ts-ignore
      if (this._iv) clearInterval(this._iv)
    },
  })

  return new Response(streamBody, {
    status: 200,
    headers: {
      'content-type': 'text/event-stream',
      'cache-control': 'no-store',
      connection: 'keep-alive',
    },
  })
}

// PATCH /api/route
// body: { agent: AgentId, emaSuccess?, emaLatency?, bias? }
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const agent = body?.agent
    if (!agent) return new Response(JSON.stringify({ error: 'agent required' }), { status: 400 })
    const r = setAgentOverride(agent, {
      emaSuccess: body?.emaSuccess,
      emaLatency: body?.emaLatency,
      bias: body?.bias,
    })
    if (!r.ok) return new Response(JSON.stringify({ ok: false }), { status: 400 })
    return new Response(JSON.stringify({ ok: true, snapshot: getSnapshot() }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? 'bad request' }), { status: 400 })
  }
}
