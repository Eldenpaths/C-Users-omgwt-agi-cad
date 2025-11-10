# WebGPU UI Integration Guide for Gemini

**Phase:** 29D
**Date:** November 10, 2025
**Status:** Ready for UI Development

---

## Overview

This guide explains how to integrate with the WebGPU adaptive workgroup system when building UI components (overlay, controls, etc.).

**What's Already Done:**
✅ Enhanced adaptive workgroup logic
✅ GPU tier classification
✅ State management system
✅ WebGPUFullPath component integration
✅ Real-time FPS tracking

**What You Need to Build:**
⏳ WebGPUOverlay component (displays stats)
⏳ WorkgroupControls component (manual override)
⏳ useWorkgroupSettings hook (localStorage persistence)

---

## State Management

### Accessing WebGPU State

The WebGPU component exposes its state through a global singleton:

```typescript
import { webgpuState, type WebGPURuntimeState } from '@/lib/webgpu';

// Subscribe to state changes
const unsubscribe = webgpuState.subscribe((state: WebGPURuntimeState) => {
  console.log('FPS:', state.fps);
  console.log('Workgroup config:', state.workgroupConfig);
});

// Get current state immediately
const currentState = webgpuState.getState();

// Clean up when component unmounts
unsubscribe();
```

### State Interface

```typescript
interface WebGPURuntimeState {
  // Performance metrics
  fps: number;              // Current FPS (smoothed)
  frameTime: number;        // Last frame time in ms

  // Configuration
  resolution: number;       // Texture resolution (512, 1024, etc.)
  workgroupConfig: WorkgroupConfig | null;
  computeMode: '16f' | '8bit' | 'unknown';

  // GPU info
  gpuTier: 'low' | 'medium' | 'high' | 'ultra' | 'unknown';
  gpuLimits: {
    maxInvocations: number;
    maxWorkgroupX: number;
    maxWorkgroupY: number;
  } | null;

  // Status
  isInitialized: boolean;   // WebGPU ready
  isRunning: boolean;        // Frame loop active
  error: string | null;      // Error message if failed

  // Timestamps
  lastUpdate: number;        // Last state update timestamp
}

interface WorkgroupConfig {
  density: { x: number; y: number };    // Density compute workgroup
  gradient: { x: number; y: number };   // Gradient compute workgroup
  tier: GPUTier;
  computeMode: '16f' | '8bit';
  maxInvocations: number;
}
```

---

## Component Integration Examples

### Example 1: WebGPUOverlay (React Component)

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

---

### Example 2: WorkgroupControls with Manual Override

```typescript
'use client';

import React from 'react';
import { useWorkgroupSettings } from '@/hooks/useWorkgroupSettings';

export function WorkgroupControls() {
  const { mode, size, setMode, setSize } = useWorkgroupSettings();

  // Note: Changing size requires re-rendering WebGPUFullPath component
  // Pass manualWorkgroupSize prop to WebGPUFullPath

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
            {[4, 8, 16, 32].map((s) => (
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

---

### Example 3: useWorkgroupSettings Hook

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

---

## Integration with WebGPUFullPath

### Passing Manual Override

```tsx
import WebGPUFullPath from '@/components/neuroevolution/WebGPUFullPath';
import { useWorkgroupSettings } from '@/hooks/useWorkgroupSettings';

function MyComponent() {
  const { mode, size } = useWorkgroupSettings();

  // Only pass manualWorkgroupSize when in manual mode
  const manualSize = mode === 'manual' ? size : undefined;

  return (
    <div className="relative">
      <WebGPUFullPath
        points={myPoints}
        palette="viridis"
        metricMode="density"
        minRange={0}
        maxRange={1}
        size={512}
        manualWorkgroupSize={manualSize}  // Pass manual override
      />

      {/* Overlay will automatically read state */}
      <WebGPUOverlay isVisible={true} />
    </div>
  );
}
```

---

## Performance Considerations

### State Update Frequency

The WebGPU component throttles state updates to avoid overhead:

- **FPS updates:** ~10 times per second (every 100ms)
- **Config updates:** Only on initialization or change
- **Status updates:** On start/stop only

This keeps React re-renders minimal while providing smooth visual updates.

### Subscription Best Practices

```typescript
// ✅ Good: Single subscription, clean cleanup
useEffect(() => {
  const unsubscribe = webgpuState.subscribe(setState);
  return () => unsubscribe();
}, []);

// ❌ Bad: Multiple subscriptions or missing cleanup
useEffect(() => {
  webgpuState.subscribe(setState);
  // Missing: return cleanup function
}, []);
```

---

## Testing

### Test State Updates

```typescript
import { webgpuState, updateWorkgroupConfig } from '@/lib/webgpu';

// Simulate state update
updateWorkgroupConfig({
  density: { x: 16, y: 16 },
  gradient: { x: 16, y: 16 },
  tier: 'high',
  computeMode: '16f',
  maxInvocations: 512,
});

// Verify state
const state = webgpuState.getState();
console.log('Current workgroup:', state.workgroupConfig);
```

---

## Common Patterns

### Conditional Rendering Based on GPU Tier

```typescript
const { gpuTier } = webgpuState.getState();

if (gpuTier === 'low') {
  // Show warning or reduce quality
  return <div>Low-end GPU detected. Performance may be limited.</div>;
}
```

### Displaying GPU Information

```typescript
function GPUInfo() {
  const [state, setState] = useState(webgpuState.getState());

  useEffect(() => {
    return webgpuState.subscribe(setState);
  }, []);

  return (
    <div>
      <h3>GPU Information</h3>
      <div>Tier: {state.gpuTier}</div>
      <div>Max Invocations: {state.gpuLimits?.maxInvocations || 'N/A'}</div>
      <div>Compute Mode: {state.computeMode}</div>
    </div>
  );
}
```

---

## Troubleshooting

### Overlay Not Updating

**Problem:** Overlay shows stale or no data

**Solution:**
1. Check subscription is set up correctly
2. Verify WebGPUFullPath is rendering
3. Check console for WebGPU initialization errors
4. Ensure `isInitialized` is true before rendering

### Manual Override Not Working

**Problem:** Changing size doesn't affect workgroups

**Solution:**
1. Verify `manualWorkgroupSize` prop is passed to WebGPUFullPath
2. Check that value is 4, 8, 16, or 32
3. Component needs to re-mount or re-initialize when size changes
4. Check console logs for "Manual: Yes" confirmation

### State Not Persisting

**Problem:** Settings reset on page reload

**Solution:**
1. Check localStorage is available (not in incognito/private mode)
2. Verify useWorkgroupSettings hook is loading from storage
3. Check browser console for localStorage errors
4. Ensure storage keys match: `webgpu:workgroup-mode`, `webgpu:workgroup-size`

---

## Summary

**Key Points:**
- Use `webgpuState` singleton for accessing WebGPU state
- Subscribe in `useEffect` with cleanup
- State updates are throttled for performance
- Manual overrides passed via `manualWorkgroupSize` prop
- Use `useWorkgroupSettings` hook for persistent settings

**Files to Reference:**
- `src/lib/webgpu/webgpuState.ts` - State management
- `src/lib/webgpu/adaptiveWorkgroups.ts` - Adaptive logic
- `src/components/neuroevolution/WebGPUFullPath.tsx` - Integration example

---

**Ready to build! All the infrastructure is in place.** 🚀

**Next:** Build WebGPUOverlay, WorkgroupControls, and useWorkgroupSettings as specified in the Gemini package.
