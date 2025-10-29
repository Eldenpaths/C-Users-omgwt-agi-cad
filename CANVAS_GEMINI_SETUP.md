# AGI-CAD Canvas + Gemini Integration Setup

## Status: ✅ Infrastructure Ready

**Date**: 2025-10-29
**Branch**: `feature/gemini-integration`
**Base**: Phase 10F (Telemetry Finalization)

---

## Feature Branches Created

### 1. feature/canvas-core
Canvas rendering engine and CAD drawing functionality

### 2. feature/gemini-integration
Google Gemini AI integration for CAD generation and analysis

**Current Branch**: `feature/gemini-integration`

---

## Dependencies Installed

### @google/generative-ai v0.24.1
Google's Generative AI SDK for Gemini integration

**Usage**:
```javascript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
```

**Use Cases**:
- CAD design generation from text prompts
- Code analysis and optimization
- 3D model description generation
- Design validation and suggestions

---

### snappyjs v0.7.0
Fast compression library for CAD data

**Usage**:
```javascript
import snappy from 'snappyjs';

// Compress CAD data before Firestore storage
const compressed = snappy.compress(Buffer.from(JSON.stringify(cadData)));

// Decompress when retrieving
const decompressed = JSON.parse(snappy.uncompress(compressed).toString());
```

**Use Cases**:
- CAD file compression for Firestore storage
- Network transfer optimization
- Memory-efficient caching

---

### Existing Three.js Dependencies

Already installed from Phase 10:
- `three` v0.180.0 - 3D rendering engine
- `@types/three` v0.180.0 - TypeScript definitions
- `@react-three/fiber` v9.4.0 - React renderer for Three.js
- `@react-three/drei` v10.7.6 - Three.js helpers

---

## Directory Structure Created

```
src/
├── lib/
│   ├── ai/
│   │   └── gemini/          # Gemini AI integration modules
│   │       ├── client.ts    # Gemini API client (TO CREATE)
│   │       ├── cad-gen.ts   # CAD generation prompts (TO CREATE)
│   │       └── validator.ts # AI response validation (TO CREATE)
│   │
│   ├── canvas/              # Canvas rendering engine
│   │   ├── engine.ts        # Core canvas engine (TO CREATE)
│   │   ├── tools.ts         # Drawing tools (TO CREATE)
│   │   ├── shapes.ts        # Shape primitives (TO CREATE)
│   │   └── export.ts        # Export functionality (TO CREATE)
│   │
│   └── compliance/          # Safety and compliance checks
│       ├── validator.ts     # Design validation (TO CREATE)
│       ├── rules.ts         # Compliance rules (TO CREATE)
│       └── checker.ts       # Safety checker (TO CREATE)
│
├── app/
│   └── canvas/              # Canvas page routes
│       └── page.jsx         # Main canvas page (TO CREATE)
│
└── components/
    └── canvas/              # Canvas UI components
        ├── CanvasView.jsx   # Main canvas component (TO CREATE)
        ├── Toolbar.jsx      # Drawing toolbar (TO CREATE)
        └── Properties.jsx   # Properties panel (TO CREATE)
```

---

## Next Implementation Steps

### Phase 1: Canvas Core (feature/canvas-core)

**Branch**: `feature/canvas-core`

**Tasks**:
1. Create canvas rendering engine (`src/lib/canvas/engine.ts`)
   - Initialize Three.js scene
   - Camera and controls setup
   - Grid and axes helpers
   - Render loop

2. Implement drawing tools (`src/lib/canvas/tools.ts`)
   - Line tool
   - Rectangle tool
   - Circle tool
   - Polygon tool
   - Dimension tool

3. Create shape primitives (`src/lib/canvas/shapes.ts`)
   - Base shape class
   - 2D shapes (line, rect, circle, arc)
   - 3D primitives (box, sphere, cylinder)
   - Shape transformations

4. Build canvas UI (`src/app/canvas/page.jsx`)
   - Canvas viewport
   - Toolbar with tool selection
   - Properties panel
   - Layer management

5. Add export functionality (`src/lib/canvas/export.ts`)
   - Export to JSON
   - Export to DXF
   - Export to SVG
   - Export to Three.js JSON

**Deliverable**: Working CAD canvas with basic drawing tools

---

### Phase 2: Gemini Integration (feature/gemini-integration)

**Branch**: `feature/gemini-integration`

**Tasks**:
1. Create Gemini API client (`src/lib/ai/gemini/client.ts`)
   - API key management
   - Request/response handling
   - Error handling
   - Rate limiting

2. Implement CAD generation prompts (`src/lib/ai/gemini/cad-gen.ts`)
   - Text-to-CAD prompts
   - Design optimization prompts
   - Code generation prompts
   - Validation prompts

3. Build AI validator (`src/lib/ai/gemini/validator.ts`)
   - Response schema validation
   - Safety filtering
   - Output sanitization

4. Create AI panel UI (`src/components/canvas/AIPanel.jsx`)
   - Text prompt input
   - Generation controls
   - Result preview
   - History viewer

5. Integrate with canvas
   - Generate shapes from AI
   - Apply AI suggestions
   - Real-time validation

**Deliverable**: AI-powered CAD generation from text prompts

---

### Phase 3: Compliance & Safety (feature/compliance)

**Branch**: `feature/gemini-integration` (or new branch)

**Tasks**:
1. Create design validator (`src/lib/compliance/validator.ts`)
   - Dimension validation
   - Material safety checks
   - Manufacturing feasibility

2. Implement compliance rules (`src/lib/compliance/rules.ts`)
   - Industry standards (ISO, ANSI)
   - Safety regulations
   - Material constraints

3. Build safety checker (`src/lib/compliance/checker.ts`)
   - Structural integrity checks
   - Material compatibility
   - Hazard detection

4. Add compliance UI
   - Compliance status indicator
   - Violation warnings
   - Suggestion panel

**Deliverable**: Real-time compliance checking and validation

---

## Environment Variables Needed

Add to `.env.local`:

```bash
# Gemini AI API Key
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here

# Optional: Gemini Model Configuration
NEXT_PUBLIC_GEMINI_MODEL=gemini-pro
NEXT_PUBLIC_GEMINI_MAX_TOKENS=2048
NEXT_PUBLIC_GEMINI_TEMPERATURE=0.7
```

**Get API Key**:
1. Go to https://makersuite.google.com/app/apikey
2. Create new API key
3. Add to `.env.local`

---

## Integration with Phase 10F Telemetry

### Telemetry Events to Add

**Canvas Events**:
- Tool selection
- Shape creation
- Transformation applied
- Export action

**AI Events**:
- Generation request
- Generation success/failure
- Token usage
- Response time

**Compliance Events**:
- Validation triggered
- Violations detected
- Compliance passed

**Implementation**:
```javascript
import { getFusionBridge } from '@/lib/meta/fusion-bridge';

const bridge = getFusionBridge();

// Log canvas action
await bridge.logModification(
  'canvas-engine',
  'shape-created',
  true,
  0.1 // risk score
);

// Log AI generation
await bridge.logDrift({
  agentId: 'gemini-ai',
  driftScore: 0.05,
  entropyScore: 0.3,
  driftDetected: false,
  entropyExceeded: false,
  filePath: 'canvas/generated-design.json',
  timestamp: new Date(),
});
```

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    AGI-CAD Canvas System                    │
│                                                             │
│  ┌───────────────────────┐     ┌──────────────────────┐   │
│  │  Canvas UI            │     │  Gemini AI Panel     │   │
│  │  - Viewport           │     │  - Text prompts      │   │
│  │  - Toolbar            │     │  - Generation        │   │
│  │  - Properties         │◄────┤  - Validation        │   │
│  │  - Layers             │     │  - History           │   │
│  └───────────────────────┘     └──────────────────────┘   │
│            │                              │                 │
│            ↓                              ↓                 │
│  ┌───────────────────────┐     ┌──────────────────────┐   │
│  │  Canvas Engine        │     │  Gemini Client       │   │
│  │  - Three.js Scene     │     │  - API calls         │   │
│  │  - Drawing Tools      │◄────┤  - Prompt templates  │   │
│  │  - Shape Library      │     │  - Response parser   │   │
│  │  - Transform Engine   │     │  - Error handling    │   │
│  └───────────────────────┘     └──────────────────────┘   │
│            │                              │                 │
│            └──────────────┬───────────────┘                 │
│                           ↓                                 │
│            ┌──────────────────────────────┐                 │
│            │  Compliance Validator        │                 │
│            │  - Design rules              │                 │
│            │  - Safety checks             │                 │
│            │  - Manufacturing feasibility │                 │
│            └──────────────────────────────┘                 │
│                           ↓                                 │
│            ┌──────────────────────────────┐                 │
│            │  Data Layer                  │                 │
│            │  - Firestore persistence     │                 │
│            │  - Snappy compression        │                 │
│            │  - Telemetry logging         │                 │
│            └──────────────────────────────┘                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Testing Strategy

### Unit Tests

**Canvas Engine**:
```bash
pnpm test:canvas
```
- Shape creation
- Transformations
- Export formats

**Gemini Client**:
```bash
pnpm test:gemini
```
- API calls
- Prompt generation
- Response validation

**Compliance**:
```bash
pnpm test:compliance
```
- Rule validation
- Safety checks
- Edge cases

### Integration Tests

**Canvas + AI**:
```bash
pnpm test:canvas-ai
```
- Generate shape from prompt
- Apply AI suggestions
- Validate output

**End-to-End**:
```bash
pnpm test:e2e:canvas
```
- Full user flow
- Canvas → AI → Export
- Telemetry verification

---

## Performance Targets

### Canvas Rendering
- **FPS**: 60 fps (smooth rendering)
- **Shape Count**: 10,000+ shapes (before performance degradation)
- **Zoom Range**: 0.1x - 100x
- **Pan Performance**: < 16ms per frame

### AI Generation
- **Response Time**: < 5 seconds (average)
- **Success Rate**: > 95%
- **Token Efficiency**: < 1000 tokens per request

### Data Compression
- **Compression Ratio**: 5:1 (Snappy)
- **Compression Time**: < 100ms (10MB file)
- **Decompression Time**: < 50ms

---

## Git Workflow

### Branch Strategy

```
ai/task-e2e-test (main working branch)
├── feature/canvas-core (canvas implementation)
└── feature/gemini-integration (AI integration)
```

### Merge Strategy

1. Complete canvas-core implementation
2. Merge to ai/task-e2e-test
3. Complete gemini-integration
4. Merge to ai/task-e2e-test
5. Tag as phase-11-canvas-ai

### Commit Convention

```bash
# Canvas work
git commit -m "feat(canvas): implement line drawing tool"

# Gemini work
git commit -m "feat(gemini): add CAD generation prompts"

# Compliance work
git commit -m "feat(compliance): add ISO standard validation"
```

---

## Dependencies Summary

### New Dependencies
```json
{
  "dependencies": {
    "@google/generative-ai": "^0.24.1",  // NEW
    "snappyjs": "^0.7.0"                 // NEW
  }
}
```

### Existing (Phase 10)
```json
{
  "dependencies": {
    "three": "^0.180.0",
    "@types/three": "^0.180.0",
    "@react-three/fiber": "^9.4.0",
    "@react-three/drei": "^10.7.6",
    "firebase": "^12.4.0",
    "dotenv": "^17.2.3"
  }
}
```

---

## Status Checklist

- [x] Feature branches created
- [x] Dependencies installed
- [x] Directory structure created
- [ ] Canvas engine initialized
- [ ] Gemini client configured
- [ ] Compliance validator implemented
- [ ] UI components built
- [ ] Integration tests passing
- [ ] Documentation complete

---

## Next Actions

### Immediate (Canvas Core)

1. **Initialize Canvas Engine**
   ```bash
   # Create engine module
   touch src/lib/canvas/engine.ts
   ```

2. **Set up Three.js Scene**
   - Camera setup (OrthographicCamera for 2D)
   - Renderer configuration
   - Controls (OrbitControls)

3. **Implement Basic Tools**
   - Line tool
   - Rectangle tool
   - Selection tool

### Next (Gemini Integration)

1. **Configure Gemini API**
   ```bash
   # Add API key to .env.local
   echo "NEXT_PUBLIC_GEMINI_API_KEY=your_key" >> .env.local
   ```

2. **Create Gemini Client**
   - API wrapper
   - Error handling
   - Rate limiting

3. **Build Generation Prompts**
   - Text-to-CAD templates
   - Few-shot examples
   - Safety guardrails

---

**Setup Complete**: 2025-10-29
**Author**: Claude Code (Sonnet 4.5)
**Status**: ✅ Ready for Implementation
