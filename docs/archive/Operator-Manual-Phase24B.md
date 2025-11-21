# Operator Manual — Phase 24B: Router Autonomy Expansion

## Scope
Adds adaptive learning weights (EMA + UCB1), route telemetry, and a live HUD to the Intelligence Router.

## Files
- `src/lib/routerWeights.ts` — adaptive selection + feedback APIs
- `src/app/api/route/route.ts` — API ingress (POST route, PUT outcome, GET SSE stream)
- `src/components/RouterPanel.tsx` — live HUD (drop into any page)
- (existing) `IntelligenceRouter.ts` — orchestrator; call its entry inside the POST handler if desired

## How It Works
1. Choosing an Agent
   - `chooseAgent(task)` computes a utility per agent (EMA success & latency, difficulty-aware), then applies UCB1 exploration to avoid local optima.
   - Returns the selected agent ID, increments its `calls`, and updates versioned state.

2. Recording Outcomes
   - After the agent runs, call `PUT /api/route` with `{ outcome }`.
   - `recordOutcome()` updates EMAs, success counters, and appends to a telemetry ring buffer.

3. Live Telemetry
   - `GET /api/route?stream=1` serves Server-Sent Events snapshots ~ every 1.5s.
   - `RouterPanel.tsx` subscribes and renders weights, scores, and recent routes.

## Minimal Usage
Route a task:
```
curl -X POST /api/route -H "content-type: application/json" -d '{
  "task": { "id":"t1","kind":"summarize","difficulty":0.6 }
}'
```

Record the outcome:
```
curl -X PUT /api/route -H "content-type: application/json" -d '{
  "outcome": { "taskId":"t1","agent":"EchoArchivist","success":true,"latencyMs":920 }
}'
```

Embed HUD:
```
// e.g., src/app/dashboard/page.tsx
import RouterPanel from '@/components/RouterPanel';

export default function Page() {
  return (
    <main className="p-6">
      <RouterPanel />
    </main>
  );
}
```

## Tuning
- `EMA_ALPHA_SUCCESS` (0.20): raise to adapt faster to changing agent quality.
- `EMA_ALPHA_LATENCY` (0.10): raise for more reactive latency tracking.
- `EXPLORATION_C` (1.25): higher = more exploration; lower = greedier on current best.
- `MIN_CALLS_FOR_CONF` (5): flat exploration boost until enough trials accrue.

## Integration Points
- IntelligenceRouter: after POST selection, you can forward to your existing orchestrator (Claude/Gemini/GPT dispatch). On completion, have the orchestrator PUT `/api/route` with the measured outcome.
- Persistence: current state is in-memory (hot-reload safe). To persist, mirror `getSnapshot()`, `recordOutcome()`, and `chooseAgent()` via Firestore/Redis.

## Ops Checklists
- Smoke: POST a few tasks, PUT mixed outcomes, confirm HUD updates.
- Regression: verify UCB score ordering changes as outcomes accumulate.
- Load: SSE stream remains responsive under moderate outcome rates.

