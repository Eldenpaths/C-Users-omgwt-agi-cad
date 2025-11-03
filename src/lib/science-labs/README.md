# Science Labs Infrastructure

## Overview
Central orchestration system for managing multiple Physics and Chemistry simulation labs in AGI-CAD.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Science Labs Hub                    │
│                   (/labs route)                      │
└──────────────────┬──────────────────────────────────┘
                   │
                   ├──> Lab Registry (catalog)
                   │
                   ├──> Lab Router (command orchestration)
                   │
                   └──> Individual Labs:
                        ├─ Plasma Lab (/plasma-lab)
                        ├─ Fluid Lab (coming soon)
                        ├─ Spectral Lab (coming soon)
                        ├─ Quantum Lab (coming soon)
                        ├─ Materials Lab (coming soon)
                        └─ Chemistry Lab (coming soon)
```

## Files

### `LabRegistry.ts`
Central catalog of all labs:
- Lab definitions (id, name, description, capabilities)
- Lab status (active, beta, coming-soon)
- Stats aggregation functions

### `LabRouter.ts`
Command orchestration system:
- Register/unregister labs
- Execute commands on specific labs
- Get lab states
- Broadcast commands to multiple labs
- Command history tracking

### Usage Example

```typescript
import { labRouter } from '@/lib/science-labs/LabRouter';

// Register a lab simulator
const plasmaSimulator = new PlasmaSimulator();
labRouter.registerLab('plasma', plasmaSimulator);

// Execute a command
const result = labRouter.executeCommand('plasma', 'heat', { flux: 1500 });

// Get lab state
const state = labRouter.getLabState('plasma');

// Broadcast command to all labs
const results = labRouter.broadcastCommand('stop');
```

## Lab Interface

All labs must implement:
```typescript
interface LabSimulator {
  command(action: string, params: any): void;
  getVisualizationData(): any;
  init?(temperature: number, pressure: number): void;
  step?(deltaTime: number): any;
}
```

## Navigation Flow

1. Homepage → "Science Labs" card → `/labs`
2. Labs Hub → "Launch Lab" button → Individual lab route
3. Individual lab → "Back to Labs" button → `/labs`
4. Nexus page → "Science Labs Hub" button → `/labs`

## Stats Dashboard

The labs hub displays:
- Active labs count
- Total experiments running
- Coming soon labs count
- Individual lab status badges

## Adding New Labs

1. Add lab definition to `LAB_REGISTRY` in `LabRegistry.ts`
2. Create lab page in `src/app/{lab-name}/page.tsx`
3. Create lab simulator component
4. Register lab with `labRouter` on mount
5. Update lab status to 'active' when ready

## Current Status (Phase 17C)

- ✅ Lab Registry implemented
- ✅ Lab Router implemented
- ✅ Science Labs Hub page (/labs)
- ✅ Plasma Lab integrated
- ⏳ 5 additional labs in planning
- ✅ Navigation flow complete
- ✅ Stats dashboard operational
