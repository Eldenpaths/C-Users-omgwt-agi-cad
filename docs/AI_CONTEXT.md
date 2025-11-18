# AGI-CAD AI Context

> **Purpose:** This document provides canonical context for AI assistants working on AGI-CAD.
> **Current Phase:** 29 (GlyphCore + Fusion Bridge)
> **Last Updated:** 2025-11-18

---

## Quick Start for AI Assistants

When starting a new conversation about AGI-CAD:

1. Reference `docs/phase-manifests/phase-29.json` for current state
2. Follow canonical decisions established in the manifest
3. Use SEL (Semantic Expression Language) terminology
4. Check `docs/PROJECT-STATUS.md` for health metrics

---

## Project Overview

**AGI-CAD** is an AI-powered CAD platform with multi-agent cognitive architecture.

### Tech Stack
- **Framework:** Next.js 14 (App Router + Pages Router hybrid)
- **Language:** TypeScript 5.9
- **UI:** React 18, Tailwind CSS 3.4, Framer Motion 12
- **3D:** Three.js 0.180, React Three Fiber
- **State:** Zustand 5.0 + React Context
- **Database:** Firebase (Auth, Firestore, Admin SDK)
- **AI:** Claude SDK, OpenAI SDK, Google Generative AI, LangChain

### Project Health
- **Score:** 85/100
- **Source Files:** 293
- **Type Errors:** 82 (non-blocking)

---

## Current Phase Status

### Phase 29: GlyphCore + Fusion Bridge
**Completion:** ~95%

#### Completed
- GlyphCore compression system
- Multi-agent router adapter
- API and UI console
- Performance optimizations
- Web Vitals tracking
- Error logging to Firestore
- Security headers (CSP, HSTS)

#### Remaining
- [ ] Fix Firebase export issues (2-3 hours)
- [ ] Update AuthContext with signOut/signInWithGoogle (1 hour)
- [ ] Remove duplicate imports in IntelligenceRouter.ts (30 min)
- [ ] Complete Jest type definitions setup (15 min)

---

## Canonical Decisions

These decisions are FINAL and should not be questioned:

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **File Structure** | src/ consolidation | Deprecated apps/, frontend/, root lib/ |
| **Firebase Config** | src/lib/firebase/ | Single source of truth |
| **State Management** | Zustand + Context | Zustand global, Context auth |
| **Router** | App + Pages hybrid | Gradual migration |
| **Package Manager** | pnpm | Fast, efficient, strict |

---

## Critical File Paths

```
Authentication:     src/lib/auth/AuthContext.tsx
Firebase Client:    src/lib/firebase/client.ts
Firebase Admin:     src/lib/firebase/admin.ts
Router:             src/core/router/IntelligenceRouter.ts
GlyphCore:          src/core/glyph/
Agents:             src/agents/
Components:         src/components/
Pages:              src/app/
API Routes:         src/app/api/
```

---

## Agent Architecture

### Active Agents
| Agent | Role |
|-------|------|
| **FractalForge** | Recursive task decomposition |
| **Buildsmith** | Code generation and modification |
| **CanonSentinel** | Architectural integrity guardian |
| **IntelligenceRouter** | Multi-agent coordination |

### Agent Constraints
1. Must log all actions to Vault
2. Require human approval for spawning sub-agents
3. SEL compliance required

---

## SEL (Semantic Expression Language)

Use these terms in code and documentation:

| SEL Term | Meaning | Instead of |
|----------|---------|------------|
| `forge` | Create with intentionality | create, make |
| `bloom` | Expand organically | grow, expand |
| `cascade` | Propagate through system | trigger, spread |
| `crystallize` | Solidify structure | finalize, fix |
| `drift` | Ambient state monitoring | watch, monitor |

---

## Build Status

| Check | Status |
|-------|--------|
| Dependencies | Pass |
| Environment | Pass |
| TypeScript | Warning (82 errors) |
| Firebase | Pass |
| File Structure | Pass |
| Git | Pass |

---

## Deployment Readiness

- **Environment:** Ready
- **Firebase:** Configured
- **Security:** Headers + CSP configured
- **Performance:** Optimized with Web Vitals
- **Documentation:** Complete

**Recommendation:** Ready for staging. Production after TypeScript fixes.

---

## Next Phase: 30

### Goals
1. Firestore-backed manifests
2. UI dashboard for phase management
3. Spatial graph exports for AI
4. SEL enforcement validation

---

## Usage in AI Conversations

### Starting a New Thread

```
AGI-CAD Phase 29 Context:
[paste contents of phase-29.json OR reference this document]

Current task: [describe what you're building]
```

### Quick Context Load

```bash
# Load current phase context
cat docs/phase-manifests/phase-29.json
```

### Referencing Decisions

When an AI asks "should I use X or Y?", check:
1. `canonicalDecisions` in phase manifest
2. This document's "Canonical Decisions" section
3. Ask human if not covered

---

## Recent History

| Commit | Description |
|--------|-------------|
| 3557e30 | Phase 29B: GlyphCore + API/UI console |
| a046cc1 | Phase 27E + Bootstrap Phase 28A |
| e78fc12 | TypeSafe LearningCore + HUD Stability |
| b2db3ce | Topbar: Policy jump anchor |
| 77d01ea | Phase 26 UI: PolicyControls |

---

## Documentation Index

- `docs/PROJECT-STATUS.md` - Current health and status
- `docs/FILE-STRUCTURE.md` - Project organization
- `docs/DEPLOYMENT.md` - Deployment guide
- `docs/AGENT_API.md` - Agent API documentation
- `docs/phase-manifests/` - Phase manifest files

---

**Maintained by:** AGI-CAD Development Team
**Update Frequency:** Per phase completion
