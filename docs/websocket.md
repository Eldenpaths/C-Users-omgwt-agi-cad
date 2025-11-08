# WebSocket Streaming

## Payload Shape
The renderer accepts tiles for the density texture as a flattened **Float32 RGBA** array of size `N * N * 4`:

- R: density
- G: time (normalized 0..1)
- B: accuracy (normalized 0..1)
- A: energy (normalized 0..1)

Example message (JSON array):

```json
[0.01, 0.00, 0.52, 0.10, 0.03, 0.00, 0.50, 0.12, ...]
```

The client writes the tile directly to the GPU texture via `queue.writeTexture` without CPU readback.

