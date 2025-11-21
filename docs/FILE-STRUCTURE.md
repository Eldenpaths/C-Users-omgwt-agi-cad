# AGI-CAD File Structure
**Last Updated:** 2025-11-15
**Project:** AGI-CAD Core Platform
**Version:** 1.0.0

## Overview
AGI-CAD is a comprehensive AI-powered CAD platform built with Next.js 14, React 18, and Firebase. The project contains 293 source files (65 TSX components, 175 TypeScript modules) organized into a modular architecture.

---

## Root Structure

```
C:\Users\omgwt\agi-cad\
├── .env.local                  # Environment variables (Firebase config) - DO NOT COMMIT
├── .gitignore                  # Git ignore patterns
├── package.json                # Dependencies and npm scripts
├── next.config.js              # Next.js configuration
├── tailwind.config.js          # Tailwind CSS configuration
├── tsconfig.json               # TypeScript configuration
├── jest.config.js              # Jest testing configuration
├── README.md                   # Project documentation
│
├── .agi-cad/                   # AGI-CAD specific configuration
├── .claude/                    # Claude AI assistant configuration
├── .github/                    # GitHub workflows and actions
│
├── agents/                     # Agent coordination and swarm logic
├── AGI-CAD-Core/               # Core platform modules
├── ai/                         # AI model integrations
├── auto_commits/               # Automated commit tracking
├── backend/                    # Backend services and APIs
├── docs/                       # Project documentation
├── experiments/                # Experimental features and research
├── functions/                  # Firebase Cloud Functions
├── monitor/                    # Monitoring and telemetry
├── packages/                   # Shared packages and utilities
├── public/                     # Static assets (images, fonts, etc.)
├── scripts/                    # Build and utility scripts
├── src/                        # Main source code (detailed below)
├── styles/                     # Global styles and CSS
├── test-results/               # Test output and coverage reports
├── tests/                      # Test suites
└── Vault/                      # Secure storage and logging
```

---

## /src Directory Structure

### /src/app - Next.js 14 App Router Pages

```
/src/app/
├── layout.tsx                  # Root layout with auth and theme providers
├── page.tsx                    # Home page (main entry point)
├── page.test.tsx               # Home page tests
│
├── __tests__/                  # App-level tests
│   └── page.test.tsx
│
├── admin/                      # Admin dashboard
│   └── page.tsx                # Admin panel UI
│
├── agent-demo/                 # Agent demonstration page
│   └── page.tsx                # Agent showcase and testing
│
├── api/                        # API routes (Next.js API endpoints)
│   ├── agents/
│   │   └── coordinate/
│   │       └── route.ts        # Agent coordination API
│   ├── labs/
│   │   └── command/
│   │       └── route.ts        # Science lab command API
│   ├── router/
│   │   └── route.ts            # AI routing API
│   ├── vault/
│   │   └── process/
│   │       └── route.ts        # Vault processing API
│   └── ws/
│       └── route.ts            # WebSocket API endpoint
│
├── forge/                      # Autodesk Forge viewer integration
│   ├── layout.tsx              # Forge layout wrapper
│   ├── page.tsx                # Forge viewer page
│   ├── page-live.tsx           # Live Forge updates
│   ├── page-runtime.tsx        # Forge runtime controls
│   └── ForgeViewer.tsx         # Forge viewer component
│
├── glyphcore/                  # GlyphCore compression system
│   └── page.tsx                # GlyphCore console UI
│
├── labs/                       # Science labs (chemistry, crypto, plasma)
│   └── page.tsx                # Labs dashboard
│
├── launch/                     # Landing page
│   └── page.tsx                # Public-facing launch page
│
├── login/                      # Authentication
│   └── page.tsx                # Login page with Firebase auth
│
├── mission-control/            # Mission Control HUD
│   └── page.tsx                # Real-time system monitoring
│
├── monitoring/                 # Performance monitoring
│   └── page.tsx                # Metrics and telemetry dashboard
│
├── nexus/                      # Agent Nexus (multi-agent coordination)
│   └── page.tsx                # Nexus visualization
│
├── plasma-lab/                 # Plasma Lab experiments
│   └── page.tsx                # Plasma simulation UI
│
├── sos/                        # SOS (Smart Operational System)
│   └── page.tsx                # SOS dashboard with Miss Avak
│
└── tesseract/                  # Tesseract (4D routing and delegation)
    ├── page.tsx                # Tesseract control panel
    ├── ArchivistAgent.ts       # Vault archival agent
    ├── VaultLogger.ts          # Vault logging service
    └── tesseractStore.ts       # Zustand state store
```

### /src/components - React Components

```
/src/components/
├── ErrorBoundary.tsx           # Global error boundary
├── ForgeViewer.tsx             # Autodesk Forge viewer wrapper
├── Topbar.tsx                  # Top navigation bar
│
├── auth/                       # Authentication components
│   └── AuthGuard.tsx           # Protected route wrapper
│
├── canvas/                     # Canvas-based visualizations
│   ├── AITaskFlowVisualization.tsx  # AI task flow rendering
│   └── ThemeToggle.tsx         # Dark/light mode toggle
│
├── fx/                         # Visual effects
│   └── FogkeeperMaterial.tsx   # Custom Three.js shader material
│
├── glyph/                      # Glyph language components
│   ├── AgentOverlay.tsx        # Agent status overlay
│   ├── GlyphInput.tsx          # Glyph code input
│   ├── GlyphConsole.tsx        # Glyph console UI
│   └── GlyphCoreConsole.tsx    # GlyphCore compression console
│
├── nexus/                      # Nexus visualization components
│   ├── AgentInspector.tsx      # Agent detail inspector
│   ├── DriftMonitorPanel.tsx   # Drift detection monitor
│   ├── NexusGlyphAnimator.tsx  # Animated glyph renderer
│   ├── NexusViz.tsx            # Main Nexus visualization
│   └── PlasmaLabNode.tsx       # Plasma lab node renderer
│
├── sos/                        # SOS system components
│   ├── AgentStatus.tsx         # Agent health status
│   ├── AgentTraceViewer.tsx    # Agent execution trace viewer
│   ├── CanonSidebar.tsx        # Canon tracking sidebar
│   ├── CVRASuggestions.tsx     # CVRA (Context-Value-Risk-Action) suggestions
│   ├── SmartSuggestions.tsx    # AI-powered suggestions
│   ├── MissAvak/               # Miss Avak AI assistant
│   │   ├── Avatar.tsx          # Animated avatar
│   │   └── Dialog.tsx          # Dialog interface
│   ├── chemistry/              # Chemistry lab components
│   │   └── ChemistryLab.tsx    # Chemistry simulation UI
│   └── crypto/                 # Crypto lab components
│       └── CryptoLab.tsx       # Crypto market simulation
│
├── tesseract/                  # Tesseract routing components
│   ├── ControlPanel.tsx        # Tesseract control panel
│   ├── DelegationLog.tsx       # Task delegation log
│   ├── DriftMap.tsx            # Drift map visualization
│   ├── PerformanceChart.tsx    # Performance metrics chart
│   └── PerformanceMetrics.tsx  # Metrics display
│
├── ui/                         # UI primitives
│   └── LoadingScreen.tsx       # Loading spinner/screen
│
├── DriftMapCanvas.tsx          # Main drift map canvas
├── PolicyControls.tsx          # Policy control panel
├── ProfileAgentTrends.tsx      # Agent performance trends
├── ProfileTrend.tsx            # Individual profile trend
├── RouterControlPanel.tsx      # Router control interface
└── RouterPanel.tsx             # Router status panel
```

### /src/lib - Library Code and Business Logic

```
/src/lib/
├── EventBus.ts                 # Global event bus
├── env-check.ts                # Environment variable validation
├── logger.ts                   # Logging utility
│
├── agents/                     # Agent orchestration
│   ├── agent-config.ts         # Agent configuration types
│   ├── agent-orchestrator.ts  # Multi-agent coordination
│   ├── index.ts                # Agent exports
│   └── miss-avak/              # Miss Avak AI personality
│       └── personality.ts      # Personality traits and responses
│
├── ai/                         # AI routing and providers
│   └── nexus/
│       ├── ai-router.ts        # Intelligent AI model router
│       ├── advanced-context-scorer.ts  # Context scoring algorithm
│       ├── financial-risk-detector.ts  # Risk analysis
│       ├── free-tier-optimizer.ts      # Cost optimization
│       ├── providers.ts        # AI provider configurations
│       └── task-analyzer.ts    # Task complexity analyzer
│
├── archivist/                  # Vault archival system
│   └── archivistService.ts     # Archival service logic
│
├── auth/                       # Authentication
│   └── AuthContext.tsx         # React context for auth state
│
├── canvas/                     # Canvas utilities
│   ├── ai-orbit-visualization.ts  # Agent orbit rendering
│   └── webgl-optimizer.ts      # WebGL performance optimization
│
├── canon/                      # Canon tracking (lore consistency)
│   └── canon-tracker.ts        # Narrative consistency tracker
│
├── chemistry/                  # Chemistry simulations
│   └── reactions.ts            # Chemical reaction models
│
├── compliance/                 # Compliance and tracking
│   └── soul-id-tracker.ts      # Agent identity tracker
│
├── crypto/                     # Cryptocurrency simulations
│   └── market-simulation.ts    # Market dynamics simulation
│
├── embeddings/                 # Vector embeddings
│   └── index.ts                # Embedding utilities
│
├── events/                     # Event processing
│   ├── index.ts                # Event exports
│   └── vault-processor.ts      # Vault event processor
│
├── firebase/                   # Firebase configuration
│   ├── client.ts               # Client-side Firebase (auth, firestore)
│   └── admin.ts                # Server-side Firebase Admin SDK
│
├── firebaseAdmin.ts            # LEGACY: Re-exports firebase/admin.ts
├── firebase.ts                 # LEGACY: To be migrated
│
├── firestore/                  # Firestore schemas
│   └── driftMapSchema.ts       # Drift map data schema
│
├── glyph/                      # Glyph language system
│   ├── animSpec.ts             # Animation specifications
│   ├── lang.ts                 # Glyph language parser
│   ├── runtime.ts              # Glyph runtime executor
│   └── schema.ts               # Glyph schema validation
│
├── graph/                      # Graph algorithms
│   ├── adaptive-constraint-optimization.ts  # Constraint solver
│   └── firestore-graph.ts      # Graph storage in Firestore
│
├── labs/                       # Science labs system
│   ├── index.ts                # Labs exports
│   ├── registry.ts             # Lab registry
│   ├── system-labs.ts          # System-level labs
│   └── components/
│       ├── PlasmaLab.tsx       # Plasma lab UI
│       └── SpectralLab.tsx     # Spectral analysis UI
│
├── labfidelity/                # Lab simulation fidelity
│   └── simulator.ts            # Physics-based simulator
│
├── liquid/                     # State flow management
│   └── stateFlow.ts            # Liquid state transitions
│
├── meta/                       # Meta-cognition and coordination
│   ├── consensus-engine.ts     # Multi-agent consensus
│   ├── fusion-bridge.ts        # Cross-system data fusion
│   └── swarm-coordinator.ts    # Swarm intelligence
│
├── monitoring/                 # Performance monitoring
│   ├── adaptive-scaler.ts      # Auto-scaling logic
│   ├── alert-manager.ts        # Alert management
│   ├── nexus-analytics.ts      # Nexus metrics
│   ├── PerformanceLookupTable.ts  # Performance cache
│   └── telemetry-hook.ts       # Telemetry data hook
│
├── nexus/                      # Nexus visualization engine
│   ├── nexus-visualizer.ts     # Main visualizer
│   ├── types.ts                # Nexus type definitions
│   ├── layouts/                # Graph layout algorithms
│   │   ├── flowchart.ts        # Flowchart layout
│   │   ├── geo-spatial.ts      # Geographic layout
│   │   └── index.ts            # Layout exports
│   └── performance/
│       └── instanced-renderer.ts  # GPU-accelerated rendering
│
├── physics/                    # Physics validation
│   └── physics-validator.ts    # Physics simulation validator
│
├── renderer/                   # WebGPU/WebGL rendering
│   ├── agcParser.ts            # AGC file format parser
│   └── initWebGPU.ts           # WebGPU initialization
│
├── router/                     # AI task routing
│   ├── routingEngine.ts        # Core routing engine
│   ├── taskQueue.ts            # Task queue management
│   └── taskTypes.ts            # Task type definitions
│
├── runtime/                    # Agent runtime
│   └── AgentRuntime.ts         # Agent execution runtime
│
├── safety/                     # Safety and ethics
│   └── ethical-filter.ts       # Ethical constraint checker
│
├── science-labs/               # Science lab routing
│   ├── LabRegistry.ts          # Lab registration system
│   └── LabRouter.ts            # Lab request router
│
├── security/                   # Security utilities
│   ├── auth.ts                 # Auth helpers
│   └── hmac.ts                 # HMAC signing/verification
│
├── sync/                       # Real-time synchronization
│   ├── syncManager.ts          # Sync coordination
│   ├── syncTypes.ts            # Sync type definitions
│   └── websocketServer.ts      # WebSocket server
│
├── validation/                 # Schema validation
│   └── glyphSchema.ts          # Glyph validation schemas
│
├── vault/                      # Vault storage system
│   ├── index.ts                # Vault exports
│   ├── vault-logger.ts         # Vault logging
│   ├── vaultService.ts         # Vault operations
│   └── vaultTypes.ts           # Vault type definitions
│
└── vision/                     # Computer vision
    └── vision-agent.ts         # Vision processing agent
```

### /src/agents - Agent Definitions

```
/src/agents/
├── meta/                       # Meta-level agents
│   └── RecursiveAgentV2.ts     # Recursive self-improvement agent
│
├── nexus/                      # Nexus coordination agents
│   ├── AgentRegistry.ts        # Central agent registry
│   ├── DriftMonitor.ts         # Monitors agent drift
│   ├── HumorProbe.ts           # Detects humor/sarcasm
│   ├── NexusController.ts      # Main nexus controller
│   └── StateFlowManager.ts     # Manages state transitions
│
└── visual/                     # Visual agents
    └── useAgentOrbits.tsx      # Agent orbit visualization hook
```

### /src/hooks - React Hooks

```
/src/hooks/
├── useDriftStream.ts           # Drift event stream hook
├── useExperiments.ts           # Experiment flags hook
├── useGeometricReasoning.ts    # Geometric reasoning hook
├── useGlyphs.ts                # Glyph data hook
├── useMetricsFeed.ts           # Metrics stream hook
├── useMitnickScan.ts           # Security scanning hook
├── useMonitoring.ts            # Monitoring data hook
├── useNexusState.ts            # Nexus state management
├── useNexusStateLive.ts        # Live Nexus updates
└── useWebSocketNexus.ts        # WebSocket Nexus connection
```

### /src/pages - Pages Router (Legacy)

```
/src/pages/
├── api/                        # API routes (Pages Router)
│   ├── metrics.ts              # Metrics API endpoint
│   └── nexus/
│       ├── agents.ts           # Agents API
│       ├── drift.ts            # Drift API
│       ├── drift-stream.ts     # Drift streaming API
│       ├── runtime-start.ts    # Runtime start API
│       └── agent/
│           └── [id]/
│               └── control.ts  # Agent control API
│
├── cognitive/                  # Cognitive dashboard
│   └── dashboard.tsx           # Cognitive metrics UI
│
├── learning/                   # Learning dashboard
│   └── dashboard.tsx           # Learning progress UI
│
├── nexus/                      # Nexus pages
│   └── tesseract.tsx           # Tesseract interface
│
└── simulation/                 # Simulation dashboard
    └── dashboard.tsx           # Simulation controls UI
```

---

## Component Registry

| Component | Location | Purpose | Key Dependencies |
|-----------|----------|---------|------------------|
| **ForgeViewer** | src/app/forge/ForgeViewer.tsx | Autodesk Forge 3D viewer | Autodesk Viewer API |
| **GlyphCoreConsole** | src/components/glyph/GlyphCoreConsole.tsx | GlyphCore compression UI | Glyph runtime, Snappy |
| **NexusViz** | src/components/nexus/NexusViz.tsx | Multi-agent visualization | Three.js, WebGL |
| **MissionControl** | src/app/mission-control/page.tsx | System HUD | WebSocket, Metrics |
| **PolicyControls** | src/components/PolicyControls.tsx | Policy configuration UI | Firestore |
| **AuthGuard** | src/components/auth/AuthGuard.tsx | Route protection | Firebase Auth |
| **DriftMonitorPanel** | src/components/nexus/DriftMonitorPanel.tsx | Drift detection UI | DriftMonitor agent |
| **MissAvak** | src/components/sos/MissAvak/ | AI assistant avatar | Framer Motion |
| **ChemistryLab** | src/components/sos/chemistry/ChemistryLab.tsx | Chemistry simulator | Physics engine |
| **CryptoLab** | src/components/sos/crypto/CryptoLab.tsx | Crypto market sim | Market simulation |
| **Tesseract** | src/app/tesseract/page.tsx | 4D routing UI | TesseractStore |
| **PlasmaLab** | src/lib/labs/components/PlasmaLab.tsx | Plasma physics sim | LabFidelity |
| **DriftMapCanvas** | src/components/DriftMapCanvas.tsx | Drift visualization | Canvas 2D/WebGL |
| **AITaskFlowVisualization** | src/components/canvas/AITaskFlowVisualization.tsx | Task flow diagram | D3.js-style rendering |
| **LoadingScreen** | src/components/ui/LoadingScreen.tsx | Loading indicator | Framer Motion |

---

## File Placement Conventions

### When to create a new file:

1. **New Page** → `/src/app/[route-name]/page.tsx`
2. **New API Endpoint** → `/src/app/api/[endpoint]/route.ts`
3. **New Component** → `/src/components/[category]/[ComponentName].tsx`
4. **New Hook** → `/src/hooks/use[HookName].ts`
5. **New Agent** → `/src/agents/[category]/[AgentName].ts`
6. **New Library Module** → `/src/lib/[domain]/[moduleName].ts`
7. **New Test** → `/tests/[feature]/[testName].spec.ts`
8. **New Script** → `/scripts/[scriptName].ts`

### Naming Conventions:

- **Components**: PascalCase (`MyComponent.tsx`)
- **Hooks**: camelCase with "use" prefix (`useMyHook.ts`)
- **Utilities**: camelCase (`myUtility.ts`)
- **Types**: PascalCase in `types.ts` files
- **Constants**: SCREAMING_SNAKE_CASE
- **API Routes**: kebab-case directories, `route.ts` file

### Import Order:

1. External dependencies (`react`, `firebase`, etc.)
2. Internal absolute imports (`@/lib/...`, `@/components/...`)
3. Relative imports (`./`, `../`)

---

## Key Technologies

- **Framework**: Next.js 14 (App Router + Pages Router hybrid)
- **Language**: TypeScript 5.9
- **UI**: React 18, Tailwind CSS 3.4, Framer Motion
- **3D Graphics**: Three.js, React Three Fiber, @react-three/drei
- **Backend**: Firebase (Auth, Firestore, Admin SDK)
- **AI**: Anthropic Claude, OpenAI, Google Gemini, LangChain
- **Testing**: Jest, @testing-library/react
- **State**: Zustand, React Context
- **Build**: Next.js, tsx, TypeScript

---

## Firebase Configuration

**Environment Variables (`.env.local`):**
```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
FIREBASE_PROJECT_ID
FIREBASE_CLIENT_EMAIL
FIREBASE_PRIVATE_KEY
```

**Client Config**: `src/lib/firebase/client.ts`
**Admin Config**: `src/lib/firebase/admin.ts`

---

## Scripts Overview

From `package.json`:

| Script | Command | Purpose |
|--------|---------|---------|
| `dev` | `next dev` | Start development server |
| `build` | `next build` | Production build |
| `start` | `next start` | Start production server |
| `test` | `jest` | Run all tests |
| `test:watch` | `jest --watch` | Run tests in watch mode |
| `test:coverage` | `jest --coverage` | Generate coverage report |
| `lint` | `next lint` | Run ESLint |
| `test:router` | `tsx scripts/test-router.ts` | Test routing engine |
| `test:ai-nexus` | `npx tsx scripts/test-ai-nexus.js test` | Test AI Nexus |
| `test:telemetry` | `npx tsx scripts/test-telemetry.js test` | Test telemetry |
| `smoke` | `tsx scripts/smokeAgents.ts` | Smoke test agents |

---

## Statistics

- **Total Source Files**: 293
- **TSX Components**: 65
- **TypeScript Modules**: 175
- **App Router Pages**: ~15
- **API Routes**: ~10
- **Custom Hooks**: 10
- **Agent Definitions**: ~15
- **Test Files**: ~20+
- **Dependencies**: 32 production, 15 dev

---

## Migration Notes

### LEGACY Files (To Be Deprecated):
- `src/lib/firebaseAdmin.ts` → Use `src/lib/firebase/admin.ts`
- `src/lib/firebase.ts` → Use `src/lib/firebase/client.ts`

### Deprecated Directories:
- `apps/hud/` → Migrated to `src/app/mission-control/`
- `frontend/` → Consolidated into `src/`
- `lib/` (root) → Moved to `src/lib/`

---

## Next Steps for New Features

1. **Adding a new page**: Create in `/src/app/[route]/page.tsx`
2. **Adding a component**: Place in `/src/components/[category]/[Name].tsx`
3. **Adding an API**: Create in `/src/app/api/[endpoint]/route.ts`
4. **Adding a hook**: Create in `/src/hooks/use[Name].ts`
5. **Adding tests**: Create in `/tests/[feature]/[name].spec.ts`

---

## Documentation

- Main README: `/README.md`
- File Structure: `/docs/FILE-STRUCTURE.md` (this file)
- Launch Readiness: `/LAUNCH_READY.md`
- Deployment Checklist: `/DEPLOYMENT_CHECKLIST.md`

---

**Maintained by**: AGI-CAD Development Team
**Questions?**: Refer to project README or contact maintainers
