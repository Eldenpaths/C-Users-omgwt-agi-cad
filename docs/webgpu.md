# WebGPU Setup

## `WebGPUFullPath` Component
Renders heatmap + vector field fully on the GPU. Generates density and gradient via compute and then draws the heatmap/LUT and vectors.

### Props
- `points`: `{ x, z, timeMs?, accuracy?, energy? }[]`
- `palette`: `'viridis' | 'magma' | 'inferno' | 'plasma'`
- `metricMode`: `'density' | 'time' | 'accuracy' | 'energy'`
- `minRange`, `maxRange`: normalization window
- `size`: render/compute resolution (e.g., 256/512/1024)
- `cells?`: vector grid density (8/16/32)
- `vectorScale?`: scale multiplier for vector length
- `wsUrl?`: optional WebSocket endpoint for RGBA Float32 tile streaming

### Fallback Behavior
- Attempts 16‑bit float storage (rgba16float/rg16float); if unavailable, falls back to 8‑bit unorm (rgba8unorm/rg8unorm).
- When WebGPU is disabled or the toggle is off, use the compatibility Canvas path.

### LUT Storage
Exact colormaps live in `public/colormaps/` (e.g., `viridis-256.json`). Each file contains 256 triplets in 0..1 or 0..255.

### Overlay
- FPS: frames per second
- Res: active resolution
- Mode: compute precision in use (16f or 8‑bit)
- WG: workgroup sizes used for density and gradient passes
- WG/s: estimated workgroups per second, useful for scaling tests

## Adaptive Workgroups
Workgroup size is chosen based on resolution. Typical mapping:

```ts
function getOptimalWorkgroupSize(resolution: number) {
  return resolution <= 512 ? 8 : resolution <= 1024 ? 16 : 32
}
```

