# Gemini Offload Package - Phase 29D UI Components

**Estimated Time:** 6 hours 50 minutes
**Complexity:** Low-Medium (well-defined patterns)
**Goal:** Build UI components and tests for Redis/WebSocket integration

---

## 📦 PACKAGE OVERVIEW

You are building 3 main components:

1. **Package 1: Redis/WebSocket UI** (2.5 hours)
   - Real-time routing visualizer
   - Agent status panel

2. **Package 2: WebGPU UI** (2 hours)
   - Performance overlay
   - Manual workgroup controls
   - Settings hook

3. **Package 3: Testing Suite** (2.75 hours)
   - Unit tests
   - Integration tests
   - Component tests

---

## 🎨 DESIGN SYSTEM

**AGI-CAD uses a mystical amber/black theme:**

### Colors
```css
/* Primary */
Background: #0a0a0a (near-black)
Text: #fbbf24 (amber-400)
Borders: #fbbf24 with opacity
Glow: rgba(251, 191, 36, 0.2)

/* Accents */
Cyan: #06b6d4
Blue: #3b82f6
Purple: #8b5cf6
Green: #10b981 (success)
Red: #ef4444 (error)
Orange: #f59e0b (warning)

/* Backgrounds */
Panel: #1f2937 (gray-800)
Card: rgba(31, 41, 55, 0.5) with backdrop-blur
Border: 1px solid rgba(251, 191, 36, 0.2)
```

### Typography
```css
Font: 'Courier New', monospace (default)
Headings: font-weight: bold
Code: font-family: 'Fira Code' (if available)
Small: 10-12px
Normal: 14px
Large: 16-18px
```

### Common Patterns
```jsx
// Glowing border
className="border border-amber-500/20 shadow-[0_0_15px_rgba(251,191,36,0.1)]"

// Panel background
className="bg-gray-800/50 backdrop-blur-sm"

// Amber text with glow
className="text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]"

// Button
className="bg-amber-400 text-black px-4 py-2 rounded hover:bg-amber-500 font-bold"
```

---

## 📋 PACKAGE 1: REDIS/WEBSOCKET UI COMPONENTS

### Component 1.1: RoutingVisualizer

**File:** `src/components/routing/RoutingVisualizer.tsx`
**Time:** 90 minutes

**Requirements:**
1. Connect to WebSocket using existing `useWebSocket` hook
2. Subscribe to `task:routing` channel on mount
3. Display last 10 routing decisions in a scrollable list
4. Show: taskId (first 8 chars), agent name, complexity score, reason, timestamp
5. Auto-scroll to newest decision
6. Amber/black mystical theme with glowing borders
7. Pulse animation on new decision

**Code Template:**
```typescript
'use client';

import React, { useEffect, useState } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';

interface RoutingDecision {
  taskId: string;
  agent: {
    name: string;
    id: string;
    cost: number;
    latency: number;
  };
  complexityScore: {
    d_var: number;
  };
  reason: string;
  timestamp: number;
}

export function RoutingVisualizer() {
  const { isConnected, lastMessage, subscribe } = useWebSocket();
  const [decisions, setDecisions] = useState<RoutingDecision[]>([]);

  useEffect(() => {
    if (isConnected) {
      subscribe('task:routing');
    }
  }, [isConnected, subscribe]);

  useEffect(() => {
    if (lastMessage?.type === 'message' && lastMessage.data?.type === 'routing_decision') {
      const payload = lastMessage.data.payload;
      setDecisions(prev => [payload, ...prev].slice(0, 10));
    }
  }, [lastMessage]);

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-amber-500/20 rounded-lg p-4 shadow-[0_0_15px_rgba(251,191,36,0.1)]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-amber-400 font-bold text-lg drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]">
          Task Routing Feed
        </h2>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          <span className="text-xs text-amber-400/60">
            {isConnected ? 'Live' : 'Disconnected'}
          </span>
        </div>
      </div>

      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {decisions.length === 0 ? (
          <div className="text-amber-400/40 text-sm text-center py-8">
            Waiting for routing decisions...
          </div>
        ) : (
          decisions.map((decision, idx) => (
            <div
              key={`${decision.taskId}-${idx}`}
              className={`
                bg-black/30 border-l-4 border-cyan-500 p-3 rounded
                ${idx === 0 ? 'animate-pulse-once' : ''}
              `}
            >
              {/* TODO: Implement decision card UI */}
              {/* Show: taskId (first 8 chars), agent name, complexity, reason, time */}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
```

**Your Tasks:**
1. Complete the decision card UI in the TODO section
2. Format timestamp as relative time (e.g., "2s ago", "1m ago")
3. Color-code complexity: green < 0.3, yellow 0.3-0.6, red > 0.6
4. Add agent icon/badge based on agent name
5. Add CSS animation for `animate-pulse-once` (fade-in effect)
6. Test with the test API endpoint

---

### Component 1.2: AgentStatusPanel

**File:** `src/components/routing/AgentStatusPanel.tsx`
**Time:** 60 minutes

**Requirements:**
1. Subscribe to `agent:status` channel
2. Display status for all agents (use mock list initially)
3. Show: agent name, status badge, load percentage bar
4. Update status in real-time when messages received
5. Gray out agents that haven't sent updates in 30+ seconds
6. Amber/black theme with status colors (green/yellow/red)

**Mock Agents List:**
```typescript
const AGENTS = [
  { id: 'claude', name: 'Claude 3.5 Sonnet', icon: '🧠' },
  { id: 'gpt-4', name: 'GPT-4', icon: '🤖' },
  { id: 'gemini', name: 'Gemini 1.5 Pro', icon: '💎' },
  { id: 'llama', name: 'Llama 3.1', icon: '🦙' },
  { id: 'mistral', name: 'Mistral Large', icon: '🌊' },
];
```

**Code Template:**
```typescript
'use client';

import React, { useEffect, useState } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';

interface AgentStatus {
  agentId: string;
  name: string;
  status: 'available' | 'busy' | 'offline';
  load: number;
  lastUpdate: number;
}

const AGENTS = [
  { id: 'claude', name: 'Claude 3.5 Sonnet', icon: '🧠' },
  // ... add rest
];

export function AgentStatusPanel() {
  const { isConnected, lastMessage, subscribe } = useWebSocket();
  const [agentStatuses, setAgentStatuses] = useState<Record<string, AgentStatus>>({});

  useEffect(() => {
    if (isConnected) {
      subscribe('agent:status');
    }
  }, [isConnected, subscribe]);

  useEffect(() => {
    if (lastMessage?.type === 'message' && lastMessage.data?.type === 'agent_status') {
      const payload = lastMessage.data.payload;
      setAgentStatuses(prev => ({
        ...prev,
        [payload.agentId]: {
          agentId: payload.agentId,
          name: payload.name,
          status: payload.status,
          load: payload.load,
          lastUpdate: Date.now(),
        },
      }));
    }
  }, [lastMessage]);

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-amber-500/20 rounded-lg p-4">
      <h2 className="text-amber-400 font-bold mb-4">Agent Status</h2>

      <div className="space-y-3">
        {AGENTS.map(agent => {
          const status = agentStatuses[agent.id];
          const isStale = status && (Date.now() - status.lastUpdate > 30000);

          return (
            <div key={agent.id} className={`/* TODO: Style agent card */`}>
              {/* TODO: Implement agent status UI */}
              {/* Show: icon, name, status badge, load bar */}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

**Your Tasks:**
1. Complete the agent card UI
2. Implement status badge with colors:
   - `available`: green
   - `busy`: yellow
   - `offline`: red
3. Create a load percentage bar (horizontal bar chart)
4. Add stale indicator (gray overlay if no update in 30s)
5. Add tooltip showing last update time
6. Test with the test API endpoint

---

## 📋 PACKAGE 2: WEBGPU UI COMPONENTS

### Component 2.1: WebGPUOverlay

**File:** `src/components/neuroevolution/WebGPUOverlay.tsx`
**Time:** 45 minutes

**Requirements:**
1. Subscribe to `webgpuState` for real-time updates
2. Display FPS, resolution, workgroup sizes, GPU tier, compute mode
3. Position: absolute top-left corner
4. Semi-transparent black background
5. Small text (10-12px)
6. Amber/cyan color scheme
7. Handle error states gracefully

**IMPORTANT:** Use the new state subscription system from `@/lib/webgpu`

**Code Template:**
```typescript
'use client';

import React, { useState, useEffect } from 'react';
import { webgpuState, type WebGPURuntimeState } from '@/lib/webgpu';

interface WebGPUOverlayProps {
  isVisible?: boolean;
}

export function WebGPUOverlay({ isVisible = true }: WebGPUOverlayProps) {
  const [state, setState] = useState<WebGPURuntimeState>(webgpuState.getState());

  useEffect(() => {
    // Subscribe to state updates
    const unsubscribe = webgpuState.subscribe(setState);

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  if (!isVisible || !state.isInitialized) return null;

  const { fps, resolution, workgroupConfig, computeMode, error } = state;

  return (
    <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm border border-cyan-500/30 rounded px-3 py-2 text-[11px] font-mono space-y-0.5">
      <div className="text-cyan-400 font-bold">WebGPU Stats</div>

      {error ? (
        <div className="text-red-400">Error: {error}</div>
      ) : (
        <>
          <div className="text-amber-400/80">
            FPS: <span className="text-amber-400 font-bold">{fps.toFixed(1)}</span>
          </div>

          <div className="text-amber-400/80">
            Res: <span className="text-amber-400">{resolution}²</span>
          </div>

          {workgroupConfig && (
            <>
              <div className="text-amber-400/80">
                WG Density:{' '}
                <span className="text-cyan-400">
                  {workgroupConfig.density.x}x{workgroupConfig.density.y}
                </span>
              </div>

              <div className="text-amber-400/80">
                WG Gradient:{' '}
                <span className="text-cyan-400">
                  {workgroupConfig.gradient.x}x{workgroupConfig.gradient.y}
                </span>
              </div>

              <div className="text-amber-400/80">
                Mode:{' '}
                <span
                  className={
                    computeMode === '16f' ? 'text-green-400' : 'text-yellow-400'
                  }
                >
                  {computeMode}
                </span>
              </div>

              <div className="text-amber-400/80 text-[9px]">
                Tier: {workgroupConfig.tier}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
```

**Your Tasks:**
1. Copy the template above (uses new state system!)
2. Test with WebGPUFullPath component
3. Optional: Add drag-to-reposition functionality
4. Ensure proper error display when WebGPU fails

---

### Component 2.2: WorkgroupControls

**File:** `src/components/neuroevolution/WorkgroupControls.tsx`
**Time:** 45 minutes

**Requirements:**
1. Use `useWorkgroupSettings` hook for state management
2. Toggle: Auto / Manual mode
3. Button group: Manual workgroup size (4, 8, 16, 32)
4. Settings auto-persist to localStorage via the hook
5. Amber/black theme with interactive elements

**IMPORTANT:** This component uses the `useWorkgroupSettings` hook you'll build in Component 2.3

**Code Template:**
```typescript
'use client';

import React from 'react';
import { useWorkgroupSettings } from '@/hooks/useWorkgroupSettings';

const WORKGROUP_SIZES = [4, 8, 16, 32];

export function WorkgroupControls() {
  const { mode, size, setMode, setSize } = useWorkgroupSettings();

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-amber-500/20 rounded-lg p-4 space-y-4">
      <h3 className="text-amber-400 font-bold text-sm">Workgroup Settings</h3>

      {/* Mode Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setMode('auto')}
          className={`
            flex-1 px-3 py-2 rounded text-sm font-bold transition-all
            ${
              mode === 'auto'
                ? 'bg-amber-400 text-black shadow-[0_0_10px_rgba(251,191,36,0.5)]'
                : 'bg-gray-700 text-amber-400/60 hover:text-amber-400'
            }
          `}
        >
          Auto
        </button>

        <button
          onClick={() => setMode('manual')}
          className={`
            flex-1 px-3 py-2 rounded text-sm font-bold transition-all
            ${
              mode === 'manual'
                ? 'bg-amber-400 text-black shadow-[0_0_10px_rgba(251,191,36,0.5)]'
                : 'bg-gray-700 text-amber-400/60 hover:text-amber-400'
            }
          `}
        >
          Manual
        </button>
      </div>

      {/* Size Selection (Manual Mode) */}
      {mode === 'manual' && (
        <div className="space-y-2">
          <label className="text-amber-400/80 text-xs block">
            Workgroup Size: <span className="text-amber-400 font-bold">{size}x{size}</span>
          </label>

          <div className="grid grid-cols-4 gap-2">
            {WORKGROUP_SIZES.map((s) => (
              <button
                key={s}
                onClick={() => setSize(s)}
                className={`
                  px-2 py-1 rounded text-xs font-bold transition-all
                  ${
                    size === s
                      ? 'bg-cyan-500 text-black'
                      : 'bg-gray-700 text-amber-400/60 hover:text-amber-400'
                  }
                `}
              >
                {s}x{s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="text-amber-400/40 text-xs">
        {mode === 'auto'
          ? 'Automatically adjusts based on GPU capabilities'
          : `Fixed workgroup size: ${size}x${size}`}
      </div>
    </div>
  );
}
```

**Your Tasks:**
1. Copy the template above (complete implementation!)
2. Build the `useWorkgroupSettings` hook first (see Component 2.3)
3. Test that mode/size changes persist after page reload
4. Ensure proper integration with parent component

**Integration Note:**
The parent component should pass `size` to `WebGPUFullPath` when in manual mode:
```tsx
const { mode, size } = useWorkgroupSettings();
<WebGPUFullPath manualWorkgroupSize={mode === 'manual' ? size : undefined} />
```

---

### Hook 2.3: useWorkgroupSettings

**File:** `src/hooks/useWorkgroupSettings.ts`
**Time:** 30 minutes

**Requirements:**
1. Manage mode ('auto' | 'manual') and size (4/8/16/32) state
2. Load from localStorage on mount
3. Save to localStorage on change
4. Provide setters and getters
5. Default: auto mode, size 16

**Code Template:**
```typescript
'use client';

import { useState, useEffect } from 'react';

const STORAGE_KEYS = {
  MODE: 'webgpu:workgroup-mode',
  SIZE: 'webgpu:workgroup-size',
};

const DEFAULT_MODE = 'auto' as const;
const DEFAULT_SIZE = 16;

export type WorkgroupMode = 'auto' | 'manual';

interface UseWorkgroupSettingsResult {
  mode: WorkgroupMode;
  size: number;
  setMode: (mode: WorkgroupMode) => void;
  setSize: (size: number) => void;
  reset: () => void;
}

export function useWorkgroupSettings(): UseWorkgroupSettingsResult {
  const [mode, setModeState] = useState<WorkgroupMode>(DEFAULT_MODE);
  const [size, setSizeState] = useState<number>(DEFAULT_SIZE);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const savedMode = localStorage.getItem(STORAGE_KEYS.MODE) as WorkgroupMode | null;
    const savedSize = localStorage.getItem(STORAGE_KEYS.SIZE);

    if (savedMode === 'auto' || savedMode === 'manual') {
      setModeState(savedMode);
    }

    if (savedSize) {
      const parsedSize = parseInt(savedSize, 10);
      if ([4, 8, 16, 32].includes(parsedSize)) {
        setSizeState(parsedSize);
      }
    }
  }, []);

  const setMode = (newMode: WorkgroupMode) => {
    setModeState(newMode);
    try {
      localStorage.setItem(STORAGE_KEYS.MODE, newMode);
    } catch (err) {
      console.error('[useWorkgroupSettings] Failed to save mode:', err);
    }
  };

  const setSize = (newSize: number) => {
    // Validate size
    if (![4, 8, 16, 32].includes(newSize)) {
      console.warn(`[useWorkgroupSettings] Invalid size: ${newSize}. Must be 4, 8, 16, or 32.`);
      return;
    }

    setSizeState(newSize);
    try {
      localStorage.setItem(STORAGE_KEYS.SIZE, newSize.toString());
    } catch (err) {
      console.error('[useWorkgroupSettings] Failed to save size:', err);
    }
  };

  const reset = () => {
    setModeState(DEFAULT_MODE);
    setSizeState(DEFAULT_SIZE);
    try {
      localStorage.removeItem(STORAGE_KEYS.MODE);
      localStorage.removeItem(STORAGE_KEYS.SIZE);
    } catch (err) {
      console.error('[useWorkgroupSettings] Failed to clear localStorage:', err);
    }
  };

  return { mode, size, setMode, setSize, reset };
}
```

**Your Tasks:**
1. Copy the complete template above (fully implemented!)
2. Test localStorage persistence across page reloads
3. Test with WorkgroupControls component
4. Verify validation works (e.g., invalid sizes are rejected)

---

## 📋 PACKAGE 3: TESTING SUITE

### Test 3.1: Redis Publisher Unit Tests

**File:** `__tests__/redis/publisher.test.ts`
**Time:** 30 minutes

**Requirements:**
1. Mock `ioredis` module
2. Test `publishRoutingDecision` function
3. Test `publishAgentStatus` function
4. Test error handling when Redis unavailable
5. Test message format matches specification

**Code Template:**
```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from '@jest/globals';
import { publishRoutingDecision, publishAgentStatus } from '@/lib/redis/publisher';

// Mock ioredis
vi.mock('ioredis', () => ({
  default: vi.fn(() => ({
    connect: vi.fn().mockResolvedValue(undefined),
    publish: vi.fn().mockResolvedValue(1),
    on: vi.fn(),
    quit: vi.fn().mockResolvedValue(undefined),
    status: 'ready',
  })),
}));

describe('Redis Publisher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('publishRoutingDecision', () => {
    it('should publish routing decision with correct format', async () => {
      const mockDecision = {
        id: 'test-id',
        request: {
          id: 'task-id',
          text: 'Test task',
          createdAt: new Date(),
        },
        selectedAgent: {
          id: 'gpt-4',
          name: 'GPT-4',
          strengths: ['code'],
          cost: 0.03,
          latency: 2.5,
        },
        complexityScore: {
          requestId: 'task-id',
          d_var: 0.5,
          factors: { length: 100, punctuation: 5, uniqueTokens: 50 },
        },
        reason: 'Test reason',
        timestamp: new Date(),
      };

      // TODO: Call publishRoutingDecision
      // TODO: Verify publish was called with correct channel and message format
    });

    it('should handle Redis connection errors gracefully', async () => {
      // TODO: Test error handling
    });
  });

  describe('publishAgentStatus', () => {
    it('should publish agent status with correct format', async () => {
      // TODO: Test publishAgentStatus
    });

    it('should clamp load value between 0 and 1', async () => {
      // TODO: Test load clamping
    });
  });
});
```

**Your Tasks:**
1. Complete all TODO tests
2. Add more edge case tests
3. Ensure 100% coverage for publisher.ts
4. Run tests and verify they pass

---

### Test 3.2: Integration Tests

**File:** `__tests__/routing/integration.test.ts`
**Time:** 45 minutes

**Requirements:**
1. Test full flow: TaskRouter → Redis → WebSocket
2. Mock WebSocket server
3. Mock Redis
4. Verify messages published correctly
5. Test error scenarios

**Code Template:**
```typescript
import { describe, it, expect, vi } from '@jest/globals';
import { TaskRouter } from '@/lib/routing/taskRouter';

describe('Routing Integration', () => {
  it('should route task and publish to Redis', async () => {
    const router = new TaskRouter(undefined, true);

    const request = {
      id: 'test-id',
      text: 'Write a Python function',
      metadata: {},
      createdAt: new Date(),
    };

    // TODO: Call router.route() and verify decision
    // TODO: Verify Redis publish was called
  });

  it('should continue routing even if Redis fails', async () => {
    // TODO: Test graceful degradation
  });
});
```

**Your Tasks:**
1. Complete integration tests
2. Test WebSocket message forwarding
3. Test concurrent routing requests
4. Test Redis reconnection logic

---

### Test 3.3: Component Tests

**File:** `__tests__/components/WebGPUOverlay.test.tsx`
**Time:** 30 minutes

**Requirements:**
1. Test component renders with props
2. Test visibility toggle
3. Test display formatting
4. Use @testing-library/react

**Code Template:**
```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from '@jest/globals';
import { WebGPUOverlay } from '@/components/neuroevolution/WebGPUOverlay';

describe('WebGPUOverlay', () => {
  it('should render with stats', () => {
    render(
      <WebGPUOverlay
        fps={60}
        resolution={512}
        workgroupDensity={8}
        workgroupGradient={16}
        computeMode="16f"
      />
    );

    expect(screen.getByText(/60.0/)).toBeInTheDocument();
    // TODO: Add more assertions
  });

  it('should hide when isVisible is false', () => {
    // TODO: Test visibility
  });
});
```

**Your Tasks:**
1. Complete component tests
2. Test RoutingVisualizer
3. Test AgentStatusPanel
4. Test WorkgroupControls
5. Test useWorkgroupSettings hook

---

### Test 3.4: WebGPU Tests

**File:** `__tests__/neuroevolution/adaptive-workgroups.test.ts`
**Time:** 30 minutes

**Requirements:**
1. Test `computeOptimalWorkgroupSize` function
2. Test various GPU capabilities
3. Test edge cases (very low/high limits)

**Code Template:**
```typescript
import { describe, it, expect } from '@jest/globals';
import { computeOptimalWorkgroupSize } from '@/components/neuroevolution/WebGPUFullPath';

describe('Adaptive Workgroups', () => {
  it('should compute optimal size for 512x512', () => {
    const mockLimits = {
      maxComputeWorkgroupSizeX: 256,
      maxComputeWorkgroupSizeY: 256,
      maxComputeInvocationsPerWorkgroup: 256,
    } as GPUSupportedLimits;

    const [wgX, wgY] = computeOptimalWorkgroupSize(512, 16, mockLimits);

    expect(wgX).toBe(8);
    expect(wgY).toBe(8);
  });

  // TODO: Add more tests for different resolutions and GPU limits
});
```

**Your Tasks:**
1. Complete workgroup tests
2. Test all resolution sizes (512, 1024, 2048)
3. Test GPU limit constraints
4. Test gradient complexity adjustment

---

## 🚀 EXECUTION CHECKLIST

### Before You Start
- [ ] Read entire document
- [ ] Review existing codebase structure
- [ ] Check `useWebSocket` hook implementation
- [ ] Review theme colors and patterns
- [ ] Set up testing environment

### Package 1: Redis/WebSocket UI (2.5h)
- [ ] RoutingVisualizer component (90 min)
  - [ ] WebSocket connection
  - [ ] Message handling
  - [ ] Decision card UI
  - [ ] Animations
  - [ ] Test with API
- [ ] AgentStatusPanel component (60 min)
  - [ ] WebSocket subscription
  - [ ] Status cards
  - [ ] Load bars
  - [ ] Stale detection
  - [ ] Test with API

### Package 2: WebGPU UI (2h)
- [ ] WebGPUOverlay component (45 min)
  - [ ] Stats display
  - [ ] Styling
  - [ ] Optional enhancements
- [ ] WorkgroupControls component (45 min)
  - [ ] Mode toggle
  - [ ] Size selector
  - [ ] UI polish
- [ ] useWorkgroupSettings hook (30 min)
  - [ ] State management
  - [ ] localStorage persistence
  - [ ] Validation

### Package 3: Testing (2.75h)
- [ ] Redis publisher tests (30 min)
  - [ ] Unit tests
  - [ ] Mock setup
  - [ ] Coverage
- [ ] Integration tests (45 min)
  - [ ] Full flow
  - [ ] Error scenarios
- [ ] Component tests (60 min)
  - [ ] All components
  - [ ] Rendering
  - [ ] Interactions
- [ ] WebGPU tests (30 min)
  - [ ] Adaptive logic
  - [ ] Edge cases

### Final Review
- [ ] All components styled correctly
- [ ] All tests passing
- [ ] No console errors
- [ ] Responsive design
- [ ] Documentation updated
- [ ] Code formatted and linted

---

## 📝 SUBMISSION CHECKLIST

When you're done, provide:

1. **Files Created** (list with line counts)
2. **Test Results** (all tests passing)
3. **Screenshots** (of components)
4. **Known Issues** (if any)
5. **Time Spent** (actual vs estimated)

---

## 🔗 REFERENCES

**Existing Files to Study:**
- `src/hooks/useWebSocket.ts` - WebSocket hook
- `src/lib/routing/taskRouter.ts` - TaskRouter class
- `src/lib/routing/types.ts` - Type definitions
- `src/components/neuroevolution/WebGPUFullPath.tsx` - WebGPU component
- `test-websocket.html` - WebSocket test page

**API Endpoints:**
- POST `http://localhost:3002/api/routing/test` - Route a task
- GET `http://localhost:3002/api/routing/test` - Get stats

**WebSocket:**
- URL: `ws://localhost:3001`
- Channels: `task:routing`, `agent:status`

---

## ❓ QUESTIONS?

If you encounter any issues or need clarification:

1. Check existing code patterns first
2. Review the design system section
3. Test with the HTML test page
4. Ask specific questions if stuck

---

**Good luck! Take your time and build beautiful, functional components!** 🎨✨

**Estimated Total:** 6h 50m
**Complexity:** Low-Medium
**Fun Level:** High (real-time visualizations!)

---

**Document Version:** 1.0
**Created:** November 10, 2025
**Author:** Claude Code
