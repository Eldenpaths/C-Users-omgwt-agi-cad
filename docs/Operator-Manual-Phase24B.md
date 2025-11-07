# Operator Manual — Phase 24B (Router Autonomy Expansion)

This phase adds online learning for the Intelligence Router: Each routed task updates agent success and latency metrics. A HUD panel surfaces live weights.

## Components

- Router Weights Core: src/core/router/routerWeights.ts
  - RouterWeight interface: { agentId, successRate, avgLatency, updatedAt }
  - loadWeights() ? returns current map (stored in AGI-CAD-Core/vault/routerWeights.json or ault/routerWeights.json)
  - updateWeights(agentId, success, latency) ? EMA update and persist

- Router Integration: src/core/router/IntelligenceRouter.ts
  - After each routeTask execution, calls updateWeights() with success flag and measured latency
  - Heuristic mode still supported when gent is omitted (infers from goal/context)

- API Endpoint: POST /api/router/route
  - Body: { goal, context }
  - Response: { ok, result, weights } (weights are current map)
  - Also supports GET to fetch just { weights }

- HUD Panel: pps/hud/components/RouterPanel.tsx
  - Polls /api/router/route (GET) every 10s
  - Renders table of gentId, successRate, vgLatency, and updatedAt

## Commands

- Dev server: pnpm dev
- Smoke agents: pnpm smoke
- Router test: pnpm run test:router

## Recovery
- If outerWeights.json is missing or unreadable, defaults are used and a new file is created in Vault.
- If /api/router/route fails, the HUD panel falls back silently and retries in 10s.

## Next (24C)
- Weight-aware routing decisions (use successRate and vgLatency to bias agent selection)
- Metrics SSE channel for instantaneous HUD updates
- Vault composite indexes and historical rollups for router performance
