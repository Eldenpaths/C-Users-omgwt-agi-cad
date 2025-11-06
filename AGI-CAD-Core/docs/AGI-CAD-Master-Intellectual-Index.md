# AGI-CAD Master Intellectual Index

This index maps core subsystems, documents, and operational artifacts.

## Subsystems
- Learning Infrastructure Core
  - Code: `src/lib/learning/*`
  - API: `src/pages/api/learning/ingest.ts`
  - Dashboard: `/learning/dashboard`
  - Collections: `learning_sessions`, `telemetry`

- Cognitive Layer (CVRA)
  - Code: `src/lib/cognitive/*`
  - API: `src/pages/api/cognitive/run.ts`
  - Dashboard: `/cognitive/dashboard`
  - Collections: `cvra_suggestions`

- Simulation Core
  - Code: `src/lib/simulation/*`
  - Dashboard: `/simulation/dashboard`
  - Collections: `simulations` (reserved)

## Vault
- Routing Balance: `AGI-CAD-Core/vault/balance.yaml`
- Canonical Plan: `AGI-CAD-Core/vault/project_plan.md`
- Grok Feedback: `AGI-CAD-Core/vault/grok_feedback.md`
- Weekly Audit: `AGI-CAD-Core/vault/weekly_audit.md`
- Sync Log: `AGI-CAD-Core/vault/sync_log.json`

## Firestore
- Rules: `firestore.rules`
- Indexes: `firestore.indexes.json`

## Operational Notes
- Ensure env vars for Firebase, OpenAI, Pinecone are set.
- Deploy indexes after changes: `firebase deploy --only firestore:indexes`.
- Prefer server APIs for heavy analysis; clients should subscribe to results.

