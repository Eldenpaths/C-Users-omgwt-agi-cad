---
title: Operator Manual — Phase 24D: Router Consolidation & Control
phase: 24D
date: 2025-11-07
commit: e5c578c
---

# Operator Manual — Phase 24D: Router Consolidation & Control

## Overview
Phase 24D unified routing under the adaptive EMA + UCB store and introduced a runtime control plane with live telemetry and Firestore persistence. Legacy file‑based weights are retired; the adaptive store is the single source of truth.

---

## 1 — Core Endpoints
| Method | Path | Purpose | Example |
|:--|:--|:--|:--|
| GET | `/api/route?pause=1` | Pause router updates (no EMA or counters update) | `curl /api/route?pause=1` |
| GET | `/api/route?resume=1` | Resume router updates | `curl /api/route?resume=1` |
| GET | `/api/route?status=1` | Router status + snapshot Δ vs Firestore | `curl /api/route?status=1` |
| GET | `/api/route?save=1` | Persist current snapshot to Firestore | `curl /api/route?save=1` |
| GET | `/api/route?load=1` | Restore & merge from Firestore | `curl /api/route?load=1` |
| GET | `/api/route?reset=1` | Clear in‑memory state | `curl /api/route?reset=1` |
| GET | `/api/route?stream=1` | Server‑Sent Events stream for HUD | open in browser |
| PATCH | `/api/route` | Override agent fields (EMA Success, Latency, Bias) | see below |

Response of `status` includes:
- `status`: `{ paused: boolean, version: number, updatedAt: number }`
- `diff`: per‑agent deltas between Firestore and memory
- `snapshot`: current in‑memory snapshot
- `remote`: latest Firestore snapshot (if any)

---

## 2 — Manual Overrides

PATCH /api/route to manually adjust agent stats and bias.

Example:
```
curl -X PATCH /api/route \
  -H "content-type: application/json" \
  -d '{
    "agent": "Fractalwright",
    "emaSuccess": 0.85,
    "emaLatency": 850,
    "bias": 0.25
  }'
```

Bias range: −0.5 .. +0.5 — negative demotes an agent, positive favors it in selection.

Notes:
- `emaSuccess` clamped to [0, 1]
- `emaLatency` clamped to ≥ 1 ms
- Overrides increment the snapshot `version` and `updatedAt`.

---

## 3 — HUD Controls

- Pause / Resume buttons toggle updates to EMA and counters.
- Integrity footer provides Save / Load / Reset snapshot controls.
- Δ Banner appears when local EMA/Latency deviate from Firestore; Save or Load to resync.
- Router Control Panel (modal) includes sliders for EMA Success, EMA Latency, and Bias per agent.

Component paths:
- HUD: `src/components/RouterPanel.tsx`
- Control Modal: `src/components/RouterControlPanel.tsx`

---

## 4 — Snapshot Δ Logic

`GET /api/route?status=1` returns a diff structure like:
```
{
  "ok": true,
  "status": { "paused": false, "version": 42, "updatedAt": 1730985600000 },
  "diff": {
    "agents": {
      "EchoArchivist": { "emaSuccess": +0.05, "emaLatency": -200, "calls": +3 },
      "Mathwright": { "emaSuccess": -0.02, "emaLatency": +40, "calls": 0 }
    },
    "changed": true
  },
  "snapshot": { ... },
  "remote": { ... }
}
```

Interpretation:
- Positive Δ means local is higher than remote.
- `changed: true` triggers a HUD Δ banner until Save or Load re‑syncs.

---

## 5 — Best Practices

- Pause before manual bias tuning to avoid EMA drift during adjustments.
- Resume to restore autonomous learning.
- Save snapshots before shutdown or phase promotion.
- Reset only for fresh training or regression tests.
- Use Admin SDK (server) for snapshot Save/Load in production.

---

## 6 — Testing

Script: `scripts/test-router-24d.ts`

Run:
```
pnpm exec tsx scripts/test-router-24d.ts
```

Verifies:
- Baseline selection & outcome updates
- Pause keeps EMAs stable while still recording recent telemetry
- Resume + bias influences agent selection

---

## 7 — Future Work (Phase 24E+)

- Operator profiles per UID
- Reinforcement delta learning loop
- HUD auto‑tuning mode toggle



### Phase 25 Preview
Router now tracks per-operator profiles in Firestore:

profiles/{uid}/router/default

Run tests: pnpm run test:router25a

### Phase 25B Preview: Profile Visualization & Adaptive Toggle
- Router now displays per-operator reward trend (last 50 deltas) in the HUD footer.
- Toggle "Adaptive Mode ON" to enable/disable reinforcement writes (stored at profiles/{uid}/router/default/meta.adaptive).
