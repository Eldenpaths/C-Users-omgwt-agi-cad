# Operator Manual — Phase 24B (Router Autonomy Expansion)

Phase 24B adds online learning to the Intelligence Router. Every routed task updates per‑agent success and latency metrics. A HUD panel displays live weights, and an API exposes the latest routing telemetry.

## Components

- Router Weights Core: src/core/router/routerWeights.ts
  - Interface: { agentId, successRate, avgLatency, updatedAt }
  - loadWeights(): reads current map from Vault at vault/routerWeights.json (fallbacks created automatically)
  - updateWeights(agentId, success, latency): EMA update of successRate and avgLatency, then persist

- Router Integration: src/core/router/IntelligenceRouter.ts
  - After each routeTask, measures latency and calls updateWeights(agent, success, latency)
  - Heuristic mode supported when agent is omitted (infers from goal/context)

- API Endpoint: src/pages/api/router/route.ts
  - GET → { weights }
  - POST { goal, context } → { ok, result, weights }

- HUD Panel: apps/hud/components/RouterPanel.tsx
  - Polls GET /api/router/route every 10s
  - Displays agentId, successRate, avgLatency, and updatedAt

## Commands

- Run dev: pnpm dev
- Smoke agents: pnpm smoke
- Router test: pnpm run test:router

## Recovery

- If vault/routerWeights.json is missing or invalid, defaults are used and a new file is created.
- If /api/router/route fails, the RouterPanel silently retries every 10s.

## Next (24C)

- Weight‑aware agent selection (bias by higher successRate and lower avgLatency)
- SSE/WS feed for real‑time metrics to replace polling
- Vault rollups + composite indexes for historical trends and anomaly alerts

