# AGI-CAD Project Plan (Canonical)

Status: Active • Owner: Platform • Updated: {{TODAY}}

## Objectives
- Operationalize Learning Infrastructure Core for experiments and telemetry
- Establish Cognitive Layer (CVRA) for CANON deviation proposals
- Provide Simulation Core for deterministic demo dynamics and UX

## Delivered (This Phase)
- Learning Core: validation (Zod), telemetry, Firestore `learning_sessions`, Pinecone embeddings, analyzer, hooks, dashboard
- CVRA: anomaly detection (>1.5σ), per-lab baseline, suggestions to `cvra_suggestions`, hooks, dashboard, server API
- Simulation Core: scheduler, adapters (plasma/spectral/chemistry/crypto), unified core, hooks, dashboard, telemetry start/stop

## Next Milestones
1) Hardening and Ops
   - Deploy Firestore indexes (CI step)
   - Add admin-protected endpoints (rate limit, auth checks) for CVRA/Simulation
   - Observability: tracing + performance marks for dashboards

2) Canon Integration
   - Build “Apply Deviation” flow with review gates
   - Versioned CANON store + diff view

3) Vector Intelligence
   - Expand embeddings to broader experiment text + CVRA rationale
   - Similarity search UI: “find related sessions”

4) Simulation Persistence
   - Persist simulation runs to `/simulations` with periodic snapshots
   - Replay mode in dashboard

## Risks / Assumptions
- Environmental keys (OpenAI, Pinecone, Firebase Admin) must be present
- Client rules immutable paths are respected (learning_sessions, cvra_suggestions)
- SSR-safe imports guarded (Firebase client)

## Rollback Plan
- Feature flags to disable embeddings + CVRA write
- Revert to previous deploy; data is append-only

