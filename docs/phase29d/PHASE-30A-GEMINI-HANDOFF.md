# Phase 30A - Gemini Handoff: WebGPU Adaptive Workgroups UI

**Date:** November 10, 2025
**Phase:** 30A - WebGPU Adaptive Workgroups & Performance Optimization
**Estimated Time:** 2 hours (UI components only)
**Status:** Backend Complete ✅ | UI Needed ⏳

---

## 🎯 MISSION OVERVIEW

**Phase 30A Goal:** Implement dynamic workgroup sizing based on GPU capabilities with real-time UI visualization.

**What's Already Done (Session 3):**
✅ Enhanced adaptive workgroup algorithm with GPU tier classification
✅ Separate optimization for density vs gradient compute shaders
✅ GPU tier detection (low/medium/high/ultra)
✅ State management system with subscription mechanism
✅ WebGPUFullPath integration with manual override support
✅ Real-time FPS tracking and state updates
✅ Comprehensive error handling

**What You Need to Build:**
⏳ WebGPUOverlay component (displays real-time stats)
⏳ WorkgroupControls component (manual override UI)
⏳ useWorkgroupSettings hook (localStorage persistence)

---

## 📚 WHAT YOU NEED TO KNOW

### Backend Infrastructure (Already Built)

**Location:** `src/lib/webgpu/`

**1. Adaptive Workgroup Logic**
```typescript
import { computeAdaptiveWorkgroups } from '@/lib/webgpu';

// Automatically calculates optimal workgroup sizes
const config = computeAdaptiveWorkgroups(
  resolution,    // 512, 1024, 2048
  pointCount,    // Number of data points
  gridComplexity,// Grid size
  device.limits, // GPU hardware limits
  manualSize     // Optional: 4, 8, 16, or 32
);

// Returns:
// {
//   density: { x: 16, y: 16 },
//   gradient: { x: 16, y: 16 },
//   tier: 'high',
//   computeMode: '16f',
//   maxInvocations: 512
// }
```

**2. State Management System**
```typescript
import { webgpuState, type WebGPURuntimeState } from '@/lib/webgpu';

// Subscribe to state changes
const unsubscribe = webgpuState.subscribe((state: WebGPURuntimeState) => {
  console.log('FPS:', state.fps);
  console.log('Workgroup:', state.workgroupConfig);
  console.log('GPU Tier:', state.gpuTier);
});

// Get current state immediately
const currentState = webgpuState.getState();

// Cleanup
unsubscribe();
```

**State Interface:**
```typescript
interface WebGPURuntimeState {
  fps: number;              // Current FPS (smoothed, updated ~10fps)
  frameTime: number;        // Last frame time in ms
  resolution: number;       // Texture resolution (512, 1024, etc.)
  workgroupConfig: WorkgroupConfig | null;
  computeMode: '16f' | '8bit' | 'unknown';
  gpuTier: 'low' | 'medium' | 'high' | 'ultra' | 'unknown';
  isInitialized: boolean;   // WebGPU ready
  isRunning: boolean;       // Frame loop active
  error: string | null;     // Error message if failed
}
```

**3. Manual Override Support**
```typescript
import WebGPUFullPath from '@/components/neuroevolution/WebGPUFullPath';

// Pass manual workgroup size
<WebGPUFullPath
  manualWorkgroupSize={16}  // 4, 8, 16, or 32 (undefined = auto)
  {...otherProps}
/>
```

---

## 🎨 YOUR TASKS

### Task 1: WebGPUOverlay Component (45 minutes)

**File:** `src/components/neuroevolution/WebGPUOverlay.tsx`

**What It Does:**
- Subscribes to `webgpuState` for real-time updates
- Displays FPS, resolution, workgroup sizes, GPU tier, compute mode
- Positioned in top-left corner as semi-transparent overlay
- Handles initialization and error states

**Complete Implementation:**
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
    const unsubscribe = webgpuState.subscribe(setState);
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

**Your Steps:**
1. Create the file `src/components/neuroevolution/WebGPUOverlay.tsx`
2. Copy the complete implementation above
3. Test by importing and rendering in a page with WebGPUFullPath
4. Verify it shows real-time FPS updates

---

### Task 2: useWorkgroupSettings Hook (30 minutes)

**File:** `src/hooks/useWorkgroupSettings.ts`

**What It Does:**
- Manages workgroup mode ('auto' | 'manual') and size (4, 8, 16, 32)
- Loads settings from localStorage on mount
- Saves settings to localStorage on change
- Validates size inputs
- Provides reset functionality

**Complete Implementation:**
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

    try {
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
    } catch (err) {
      console.error('[useWorkgroupSettings] Failed to load from localStorage:', err);
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

**Your Steps:**
1. Create the file `src/hooks/useWorkgroupSettings.ts`
2. Copy the complete implementation above
3. Test localStorage persistence by changing settings and reloading page
4. Test validation by trying invalid sizes

---

### Task 3: WorkgroupControls Component (45 minutes)

**File:** `src/components/neuroevolution/WorkgroupControls.tsx`

**What It Does:**
- Uses `useWorkgroupSettings` hook for state management
- Provides Auto/Manual mode toggle buttons
- Shows size selector (4x4, 8x8, 16x16, 32x32) when in manual mode
- Settings automatically persist via the hook

**Complete Implementation:**
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

**Your Steps:**
1. Create the file `src/components/neuroevolution/WorkgroupControls.tsx`
2. Copy the complete implementation above
3. Build the `useWorkgroupSettings` hook first (Task 2)
4. Test mode switching and size selection
5. Verify settings persist after page reload

---

## 🔗 INTEGRATION EXAMPLE

Once all three components are built, integrate them in a parent component:

```typescript
'use client';

import React from 'react';
import WebGPUFullPath from '@/components/neuroevolution/WebGPUFullPath';
import { WebGPUOverlay } from '@/components/neuroevolution/WebGPUOverlay';
import { WorkgroupControls } from '@/components/neuroevolution/WorkgroupControls';
import { useWorkgroupSettings } from '@/hooks/useWorkgroupSettings';

export default function WebGPUDemo() {
  const { mode, size } = useWorkgroupSettings();

  // Only pass manual size when in manual mode
  const manualSize = mode === 'manual' ? size : undefined;

  return (
    <div className="relative w-full h-screen">
      {/* WebGPU Renderer */}
      <WebGPUFullPath
        points={myPoints}
        palette="viridis"
        metricMode="density"
        minRange={0}
        maxRange={1}
        size={1024}
        manualWorkgroupSize={manualSize}  // Connect to controls
      />

      {/* Stats Overlay (auto-updates from state) */}
      <WebGPUOverlay isVisible={true} />

      {/* Control Panel */}
      <div className="absolute bottom-4 right-4">
        <WorkgroupControls />
      </div>
    </div>
  );
}
```

---

## ✅ TESTING CHECKLIST

### WebGPUOverlay
- [ ] Component renders when WebGPU is initialized
- [ ] Shows correct FPS (updates in real-time)
- [ ] Shows correct resolution
- [ ] Shows workgroup sizes for both density and gradient
- [ ] Shows GPU tier and compute mode
- [ ] Hides when `isVisible={false}`
- [ ] Displays error message when WebGPU fails

### useWorkgroupSettings Hook
- [ ] Defaults to auto mode, size 16
- [ ] Loads saved settings from localStorage
- [ ] `setMode` updates state and localStorage
- [ ] `setSize` updates state and localStorage
- [ ] Size validation rejects invalid values
- [ ] `reset()` clears localStorage and restores defaults
- [ ] Settings persist across page reloads

### WorkgroupControls
- [ ] Mode toggle buttons work correctly
- [ ] Active mode has amber background with glow
- [ ] Size buttons only show in manual mode
- [ ] Selected size has cyan background
- [ ] Clicking size buttons updates hook state
- [ ] Info text changes based on mode
- [ ] Settings persist after page reload

### Integration
- [ ] Controls affect WebGPUFullPath workgroup size
- [ ] Overlay shows updated workgroup sizes when mode/size changes
- [ ] Switching from manual to auto shows adaptive sizes in overlay
- [ ] Manual mode shows fixed sizes in overlay
- [ ] No console errors

---

## 📊 ESTIMATED TIME BREAKDOWN

| Task | Time | Complexity |
|------|------|------------|
| WebGPUOverlay | 45 min | Low (copy-paste + test) |
| useWorkgroupSettings | 30 min | Low (copy-paste + test) |
| WorkgroupControls | 45 min | Low (copy-paste + test) |
| **Total** | **2 hours** | **Low** |

---

## 🎓 KEY CONCEPTS

### Why State Subscription?
The WebGPU rendering happens in `requestAnimationFrame` callbacks (non-React). By using a global state manager with subscriptions, we can:
1. Update state from WebGPU callbacks
2. Subscribe to state changes in React components
3. Avoid prop drilling
4. Keep components decoupled

### Why Throttled Updates?
FPS updates are throttled to ~10fps to avoid excessive React re-renders while still providing smooth visual feedback.

### Why Manual Override?
Allows power users to:
- Force specific workgroup sizes for debugging
- Test performance across different configurations
- Override adaptive logic when needed

---

## 📚 REFERENCE DOCUMENTS

**Already Read These:**
- `docs/phase29d/WebGPU-UI-Integration-Guide.md` - Comprehensive integration guide
- `docs/phase29d/GEMINI-OFFLOAD-PACKAGE.md` - Full package with all components

**Backend Code:**
- `src/lib/webgpu/adaptiveWorkgroups.ts` - Adaptive logic
- `src/lib/webgpu/webgpuState.ts` - State management
- `src/components/neuroevolution/WebGPUFullPath.tsx` - Integration example

**Session Reports:**
- `SESSION-3-COMPLETE.md` - WebGPU backend implementation summary

---

## 🚀 SUBMISSION

When complete, provide:

1. **Files Created:**
   - `src/components/neuroevolution/WebGPUOverlay.tsx` (with line count)
   - `src/components/neuroevolution/WorkgroupControls.tsx` (with line count)
   - `src/hooks/useWorkgroupSettings.ts` (with line count)

2. **Test Results:**
   - All checklist items verified
   - Screenshots showing:
     - Overlay displaying stats
     - Controls in both auto and manual mode
     - Settings persisting after reload

3. **Time Spent:**
   - Actual time vs estimated 2 hours

4. **Known Issues:**
   - Any problems encountered

---

## ❓ TROUBLESHOOTING

**Overlay not updating:**
- Check WebGPUFullPath is rendering
- Check console for errors
- Verify `isInitialized` is true in state

**Settings not persisting:**
- Check localStorage is available (not incognito mode)
- Check browser console for storage errors
- Verify storage keys match: `webgpu:workgroup-mode`, `webgpu:workgroup-size`

**Manual override not working:**
- Verify `manualWorkgroupSize` prop is passed to WebGPUFullPath
- Check that component re-renders when size changes
- Look for console log: `Manual: Yes`

---

**Status:** Ready to build! All backend infrastructure complete.
**Complexity:** Low (all code provided, just copy-paste and test)
**Fun Level:** High (real-time GPU visualization!)

**Good luck! Build something beautiful!** 🎨✨

---

**Document Version:** 1.0
**Created:** November 10, 2025
**Phase:** 30A - WebGPU Adaptive Workgroups
**Author:** Claude Code
