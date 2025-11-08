---
title: Operator Manual — Phase 27C: Thread Scheduler & Context Guardian
phase: 27C
date: 2025-11-08
---

## Phase 27C — AI-Buffed Thread Management System

This phase adds an automated scheduler that monitors repo activity and prompts thread rotations and canon snapshots when thresholds are exceeded. It also emits weekly reminders.

### Files
- scripts/thread-scheduler.ts — main scheduler
- .agi-cad/thread-config.json — thresholds + schedule
- logs/thread-shifts.log — rotation history
- logs/notifications.json — HUD-visible notices (consumers can subscribe)
- vault/phase-header.md — canon snapshot header

### Config
```json
{
  "maxMessages": 200,
  "maxTokens": 50000,
  "reminderDays": ["Friday"],
  "reminderHour": 9,
  "driftThreshold": 0.15
}
```

### Run
- Prebuild hook runs automatically: `pnpm build` → runs `pnpm thread:check` first
- Manual check: `pnpm thread:check`

### Behavior
- messageCount ≈ commits since last snapshot
- tokenCount ≈ estimated tokens in src+docs (bytes/4 heuristic)
- On threshold breach → append to thread-shifts.log, push notification, write vault/phase-header.md
- Weekly reminder at configured day/hour

