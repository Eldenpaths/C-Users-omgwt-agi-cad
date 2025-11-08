---
title: Operator Manual — Phase 27D: Thread Health HUD Integration
phase: 27D
date: 2025-11-08
---

## Phase 27D — Thread Health HUD Integration

- Thread scheduler output is surfaced on the dashboard via a new card.
  - Component: `src/components/ThreadHealth.tsx`
  - Polls: `/api/thread/status` (30s) and `/api/thread/notifications`
  - Badge states: 🟢 Stable, 🟡 Approaching Phase Limit, 🔴 Checkpoint Reached
  - Shows message count, token estimate, and Δ Drift if present.

- Status API: `src/app/api/thread/status/route.ts`
  - Returns `{ messageCount, tokenEstimate, driftScore, phaseStatus }`
  - Reads `logs/thread-status.json` (written by `scripts/thread-scheduler.ts`)

- Notifications API: `src/app/api/thread/notifications/route.ts`
  - Returns recent notifications from `logs/notifications.json`

- Dashboard Integration
  - `src/components/RouterPanel.tsx` now renders `<ThreadHealth />` above the Snapshot Integrity block.

- Dev Convenience
  - `pnpm dev:threads` runs Next dev and the scheduler side-by-side (requires `concurrently`)

Screenshot: add a HUD capture showing the new “Thread Health Monitor” card.

