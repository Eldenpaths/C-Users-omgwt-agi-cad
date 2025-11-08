# LearningCore Subsystem

## Overview
The Learning Infrastructure Core provides a modular pipeline to validate lab data, log telemetry, persist sessions to Firestore, and analyze historical performance.

## Methods

### `LearningCore.ingest(labType, data, options)`
- Validates incoming payloads using Zod schemas (plasma, spectral, chemistry, crypto).
- Logs telemetry events: `experiment.received`, `experiment.validated`, `experiment.persisted`.
- Persists to Firestore collection `learning_sessions` with `createdAt` server timestamp.
- Optionally generates embeddings (if an `embeddingProvider` is provided) and upserts into a vector index.

Example:
```ts
import { LearningCore } from '@/lib/learning'

const core = new LearningCore()
const docId = await core.ingest('plasma', {
  userId,
  agentId,
  runId,
  parameters: { temperatureK: 1.2e7, density: 0.8 },
  measurements: { confinementTimeMs: 120, energyOutputJ: 12.4 },
  success: true,
  runtimeMs: 3200,
}, { summary: 'Stable high-density plasma run' })
```

### `Telemetry.logEvent(event)`
Writes events into the `telemetry` collection with a server timestamp.

```ts
import { Telemetry } from '@/lib/learning'

await Telemetry.logEvent({
  userId,
  agentId,
  labType: 'spectral',
  event: 'user.click.run-lab',
  runId,
  meta: { button: 'Run' },
})
```

### `Analyzer.getSummary(filters)`
Aggregates recent sessions and telemetry to compute success rate, average runtime, error frequency, and per-lab breakdown.

```ts
import { Analyzer } from '@/lib/learning'

const summary = await new Analyzer().getSummary({ userId, agentId })
console.log(summary)
```

## Firestore Collections

- `learning_sessions`: Validated experiment sessions; includes `userId`, `agentId`, `labType`, `parameters`, `measurements`, `success`, `runtimeMs`, `createdAt`, optional `summary`.
- `telemetry`: Event stream with `userId`, `agentId`, `labType`, `event`, `timestamp`, optional `runId` and `meta`.

