---
title: Operator Manual — Phase 27B: Learning API & Dashboard
phase: 27B
date: 2025-11-08
---

## Phase 27B — Learning API & Dashboard

- API: POST `/api/learning/ingest`
  - Body: `{ labType, payload, agentId? }`
  - Auth: Firebase ID token via `Authorization: Bearer <idToken>`
  - Validates payload per-lab with Zod
  - Persists to `learning_sessions` and logs to `telemetry`
  - Optionally generates embeddings (server-side only)
  - Response: `{ ok: true, id, embedded } | { ok: false, error }`

- Dashboard Panel: Learning
  - Shows total experiments, success rate, average runtime
  - 7-day trend deltas: total, success rate, runtime
  - Sparkline of recent outcomes and latest 5 experiments

- Internal: `analyzeLearningTrends({ userId, windowDays })`
  - Computes current window metrics and Δ vs previous window

- Test
  1) `pnpm dev`
  2) Open `/dashboard` and sign in
  3) POST a sample ingest (replace token):
     ```
     curl -X POST http://localhost:3000/api/learning/ingest \
       -H "Content-Type: application/json" \
       -H "Authorization: Bearer $FIREBASE_ID_TOKEN" \
       -d '{
             "labType":"plasma",
             "payload":{
               "experimentId":"exp-local-1",
               "userId":"will-be-overwritten",
               "agentId":"router-1",
               "labType":"plasma",
               "timestamp":'"$(node -e "console.log(Date.now())")"',
               "runtimeMs":512,
               "success":true,
               "summary":"Local plasma stability test",
               "metrics":{"energyInputJ":1000,"plasmaTempK":4200,"confinementStability":0.82}
             }
           }'
     ```

Note: The 24D manual file contains non‑UTF characters; this 27B section is documented here to avoid encoding issues.

