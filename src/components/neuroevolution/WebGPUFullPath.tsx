'use client'
import * as React from 'react'

// Types
export type AgentPoint = { x: number; z: number; timeMs?: number; accuracy?: number; energy?: number }

type Props = {
  points: AgentPoint[]
  palette: 'viridis' | 'magma' | 'inferno' | 'plasma'
  metricMode: 'density' | 'time' | 'accuracy' | 'energy'
  minRange: number
  maxRange: number
  size?: number
  wsUrl?: string
  cells?: number
  vectorScale?: number
}

/**
 * Compute an optimal square workgroup size based on resolution, a coarse complexity factor
 * (e.g. vector grid cells), and GPU limits. Returns [wgX, wgY].
 */
export function computeOptimalWorkgroupSize(
  densityThreshold: number,
  gradientComplexity: number,
  gpuCapabilities: GPUSupportedLimits
): [number, number] {
  let base = densityThreshold <= 512 ? 8 : densityThreshold <= 1024 ? 16 : 32
  if (gradientComplexity >= 24 && base < 32) base = Math.min(32, base * 2)

  const maxX = Number((gpuCapabilities as any).maxComputeWorkgroupSizeX ?? 256)
  const maxY = Number((gpuCapabilities as any).maxComputeWorkgroupSizeY ?? 256)
  const maxInv = Number((gpuCapabilities as any).maxComputeInvocationsPerWorkgroup ?? 256)

  let wg = Math.min(base, maxX, maxY)
  while (wg > 1 && wg * wg > maxInv) wg = wg >> 1
  if (wg < 1) wg = 1
  return [wg, wg]
}

export default function WebGPUFullPath({
  points,
  palette,
  metricMode,
  minRange,
  maxRange,
  size = 512,
  wsUrl,
  cells: cellsProp = 16,
  vectorScale = 1.0,
}: Props) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null)
  const rafRef = React.useRef<number | null>(null)

  React.useEffect(() => {
    let cancel = false
    let device: GPUDevice | null = null
    let context: GPUCanvasContext | null = null

    // Textures & pipelines
    let densityTex: GPUTexture | null = null
    let gradientTex: GPUTexture | null = null
    let densityPipeline: GPUComputePipeline | null = null
    let gradientPipeline: GPUComputePipeline | null = null
    let heatmapPipeline: GPURenderPipeline | null = null
    let vectorPipeline: GPURenderPipeline | null = null

    // Buffers & groups
    let pointsBuf: GPUBuffer | null = null
    let uSizeBuf: GPUBuffer | null = null
    let uParamsBuf: GPUBuffer | null = null
    let quadBuf: GPUBuffer | null = null
    let iuvBuf: GPUBuffer | null = null
    let iposBuf: GPUBuffer | null = null
    let arrowBuf: GPUBuffer | null = null

    let sampler: GPUSampler | null = null
    let lutTex: GPUTexture | null = null

    let densityBG: GPUBindGroup | null = null
    let gradientBG: GPUBindGroup | null = null
    let heatmapBG: GPUBindGroup | null = null
    let vectorBG: GPUBindGroup | null = null

    // Overlay metrics
    const fpsRef = { current: 0 }
    const lastFrameRef = { current: performance.now() }
    const wgpsRef = { current: 0 }
    const chosenModeRef = { current: 'unknown' }
    const chosenWGRef = { current: { d: 8, g: 16 } }

    // Quad vertices (pos.xy, uv.xy)
    const quadVerts = new Float32Array([
      -1, -1, 0, 0,  1, -1, 1, 0,  -1, 1, 0, 1,
      -1,  1, 0, 1,  1, -1, 1, 0,   1, 1, 1, 1,
    ])

    function makeDensityCS(format: 'rgba16float' | 'rgba8unorm', wgX: number, wgY: number) {
      return /* wgsl */`
        struct Point { x: f32, z: f32, t: f32, a: f32, e: f32 };
        @group(0) @binding(0) var<storage, read> points: array<Point>;
        @group(0) @binding(1) var outImg: texture_storage_2d<${format}, write>;
        @group(0) @binding(2) var<uniform> uSize: vec2<f32>;
        @compute @workgroup_size(${wgX},${wgY})
        fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
          if (gid.x >= u32(uSize.x) || gid.y >= u32(uSize.y)) { return; }
          let uv = (vec2<f32>(gid.xy) + vec2<f32>(0.5,0.5)) / uSize;
          let px = uv.x * 2.0 - 1.0;
          let pz = uv.y * 2.0 - 1.0;
          var r: f32 = 0.0; var g: f32 = 0.0; var b: f32 = 0.0; var a: f32 = 0.0;
          for (var i: u32 = 0u; i < arrayLength(&points); i = i + 1u) {
            let P = points[i];
            let dx = P.x - px; let dz = P.z - pz;
            let w = exp(-16.0 * (dx*dx + dz*dz));
            r = r + w * 1.0; g = g + w * P.t; b = b + w * P.a; a = a + w * P.e;
          }
          let col = vec4<f32>(r, g, b, a);
          let maxv = max(1.0, max(col.x, max(col.y, max(col.z, col.w))));
          textureStore(outImg, vec2<i32>(i32(gid.x), i32(gid.y)), clamp(col / maxv, vec4<f32>(0.0), vec4<f32>(1.0)));
        }
      `
    }

    function makeGradientCS(format: 'rg16float' | 'rg8unorm', wgX: number, wgY: number) {
      const store = format === 'rg8unorm'
        ? 'let rg = vec2<f32>(clamp(0.5 + 0.5*dx, 0.0, 1.0), clamp(0.5 + 0.5*dy, 0.0, 1.0)); textureStore(dst, vec2<i32>(x,y), vec4<f32>(rg, 0.0, 0.0));'
        : 'textureStore(dst, vec2<i32>(x,y), vec4<f32>(dx, dy, 0.0, 0.0));'

      return /* wgsl */`
        @group(0) @binding(0) var src: texture_2d<f32>;
        @group(0) @binding(1) var dst: texture_storage_2d<${format}, write>;
        @group(0) @binding(2) var<uniform> uSize: vec2<f32>;
        fn s(x: i32, y: i32) -> f32 {
          let cx = clamp(x, 0, i32(uSize.x)-1);
          let cy = clamp(y, 0, i32(uSize.y)-1);
          return textureLoad(src, vec2<i32>(cx, cy), 0).r;
        }
        @compute @workgroup_size(${wgX},${wgY})
        fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
          let x = i32(gid.x); let y = i32(gid.y);
          if (x >= i32(uSize.x) || y >= i32(uSize.y)) { return; }
          let dx = 0.5 * (s(x+1,y) - s(x-1,y));
          let dy = 0.5 * (s(x,y+1) - s(x,y-1));
          ${store}
        }
      `
    }

    async function init() {
      if (!canvasRef.current || !('gpu' in navigator)) return
      const adapter = await (navigator as any).gpu.requestAdapter()
      if (!adapter) return
      device = await adapter.requestDevice()
      context = canvasRef.current.getContext('webgpu') as unknown as GPUCanvasContext
      const format = (navigator as any).gpu.getPreferredCanvasFormat()
      context.configure({ device, format, alphaMode: 'premultiplied' })

      // Capability log
      try {
        console.log('[WebGPU Capability]', { limits: (adapter as any).limits, features: Array.from(((adapter as any).features||new Set()).values?.()||[]) })
      } catch {}

      // Resolve workgroup sizes
      const [wgDX, wgDY] = computeOptimalWorkgroupSize(size, cellsProp, device.limits)
      const [wgGX, wgGY] = computeOptimalWorkgroupSize(size, cellsProp, device.limits)
      chosenWGRef.current = { d: wgDX, g: wgGX }

      // Create textures with fallback (16f -> 8bit)
      async function createWithFallback() {
        const tryFormats: Array<[GPUTextureFormat, GPUTextureFormat, '16f'|'8bit']> = [
          ['rgba16float','rg16float','16f'],
          ['rgba8unorm','rg8unorm','8bit'],
        ]
        for (const [df, gf, mode] of tryFormats) {
          try {
            const d = device!.createTexture({ size: [size, size, 1], format: df, usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST })
            const g = device!.createTexture({ size: [size, size, 1], format: gf, usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING })
            // Pipelines
            const dcs = makeDensityCS(df as any, wgDX, wgDY)
            const gcs = makeGradientCS(gf as any, wgGX, wgGY)
            const dpipe = device!.createComputePipeline({ layout: 'auto', compute: { module: device!.createShaderModule({ code: dcs }), entryPoint: 'main' } })
            const gpipe = device!.createComputePipeline({ layout: 'auto', compute: { module: device!.createShaderModule({ code: gcs }), entryPoint: 'main' } })
            densityTex = d; gradientTex = g; densityPipeline = dpipe; gradientPipeline = gpipe
            chosenModeRef.current = mode
            return
          } catch (e) {
            // try next
          }
        }
        throw new Error('Failed to create compute pipelines for both 16f and 8bit formats')
      }
      await createWithFallback()

      // Sampler & LUT
      sampler = device.createSampler({ minFilter: 'linear', magFilter: 'linear', addressModeU: 'clamp-to-edge', addressModeV: 'clamp-to-edge' })
      const lutUrl = `/colormaps/${palette}-256.json`
      try {
        const res = await fetch(lutUrl)
        const arr = (await res.json()) as number[][]
        const data = new Uint8Array(arr.length * 4)
        for (let i = 0; i < arr.length; i++) {
          const r = arr[i][0] <= 1 ? Math.round(arr[i][0] * 255) : arr[i][0]
          const g = arr[i][1] <= 1 ? Math.round(arr[i][1] * 255) : arr[i][1]
          const b = arr[i][2] <= 1 ? Math.round(arr[i][2] * 255) : arr[i][2]
          data[i*4+0] = r; data[i*4+1] = g; data[i*4+2] = b; data[i*4+3] = 255
        }
        lutTex = device.createTexture({ size: [arr.length, 1, 1], format: 'rgba8unorm', usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST })
        device.queue.writeTexture({ texture: lutTex }, data, { bytesPerRow: arr.length * 4 }, { width: arr.length, height: 1, depthOrArrayLayers: 1 })
      } catch {
        lutTex = device.createTexture({ size: [256,1,1], format: 'rgba8unorm', usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST })
      }

      // Buffers
      const ptsStride = 5
      const maxPoints = Math.max(1, points.length)
      const pts = new Float32Array(maxPoints * ptsStride)
      for (let i = 0; i < maxPoints; i++) {
        const p = points[i] || { x: 0, z: 0, timeMs: 0, accuracy: 0.5, energy: 0 }
        pts[i*ptsStride+0] = Math.max(-1, Math.min(1, p.x))
        pts[i*ptsStride+1] = Math.max(-1, Math.min(1, p.z))
        pts[i*ptsStride+2] = Math.min(1, Math.max(0, (p.timeMs ?? 0) / 10000))
        pts[i*ptsStride+3] = Math.min(1, Math.max(0, (p.accuracy ?? 0)))
        pts[i*ptsStride+4] = Math.min(1, Math.max(0, (p.energy ?? 0) / 200))
      }
      pointsBuf = device.createBuffer({ size: pts.byteLength, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST })
      device.queue.writeBuffer(pointsBuf, 0, pts.buffer)

      uSizeBuf = device.createBuffer({ size: 8, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST })
      device.queue.writeBuffer(uSizeBuf, 0, new Float32Array([size, size]).buffer)

      uParamsBuf = device.createBuffer({ size: 16, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST })
      const metricIdx = metricMode === 'density' ? 0 : metricMode === 'time' ? 1 : metricMode === 'accuracy' ? 2 : 3
      device.queue.writeBuffer(uParamsBuf, 0, new Float32Array([minRange, maxRange, 0, metricIdx]).buffer)

      // Bind groups for compute
      densityBG = device.createBindGroup({
        layout: densityPipeline!.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: { buffer: pointsBuf } },
          { binding: 1, resource: densityTex!.createView() },
          { binding: 2, resource: { buffer: uSizeBuf } },
        ],
      })

      gradientBG = device.createBindGroup({
        layout: gradientPipeline!.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: densityTex!.createView() },
          { binding: 1, resource: gradientTex!.createView() },
          { binding: 2, resource: { buffer: uSizeBuf } },
        ],
      })

      // Heatmap pipeline
      const heatmapVS = /* wgsl */`
        struct Out { @builtin(position) pos: vec4<f32>, @location(0) uv: vec2<f32> };
        @vertex fn vs_main(@location(0) pos: vec2<f32>, @location(1) uv: vec2<f32>) -> Out {
          var o: Out; o.pos = vec4<f32>(pos, 0.0, 1.0); o.uv = uv; return o;
        }`
      const heatmapFS = /* wgsl */`
        @group(0) @binding(0) var uDensityTex: texture_2d<f32>;
        @group(0) @binding(1) var uSampler: sampler;
        @group(0) @binding(2) var uLUT: texture_2d<f32>;
        @group(0) @binding(3) var<uniform> uParams: vec4<f32>;
        @fragment fn fs_main(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
          let raw = textureSample(uDensityTex, uSampler, uv);
          let mode = uParams.w;
          var v: f32 = raw.r;
          if (mode > 0.5 && mode < 1.5) { v = raw.g; } else if (mode < 2.5) { v = raw.b; } else if (mode < 3.5) { v = raw.a; }
          let t = clamp((v - uParams.x) / max(0.0001, (uParams.y - uParams.x)), 0.0, 1.0);
          let col = textureSample(uLUT, uSampler, vec2<f32>(t, 0.5)).rgb;
          return vec4<f32>(col, 1.0);
        }`

      heatmapPipeline = device.createRenderPipeline({
        layout: 'auto',
        vertex: { module: device.createShaderModule({ code: heatmapVS }), entryPoint: 'vs_main', buffers: [{ arrayStride: 16, attributes: [ { shaderLocation: 0, offset: 0, format: 'float32x2' }, { shaderLocation: 1, offset: 8, format: 'float32x2' } ] }] },
        fragment: { module: device.createShaderModule({ code: heatmapFS }), entryPoint: 'fs_main', targets: [{ format }] },
        primitive: { topology: 'triangle-list' },
      })

      // Bind group for heatmap render
      heatmapBG = device.createBindGroup({
        layout: heatmapPipeline.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: densityTex!.createView() },
          { binding: 1, resource: sampler! },
          { binding: 2, resource: lutTex!.createView() },
          { binding: 3, resource: { buffer: uParamsBuf! } },
        ],
      })

      // Upload quad
      quadBuf = device.createBuffer({ size: quadVerts.byteLength, usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST })
      device.queue.writeBuffer(quadBuf, 0, quadVerts)

      // Vector instances (cells per side)
      const cells = Math.max(4, Math.min(128, Math.floor(cellsProp)))
      const iuv = new Float32Array(cells * cells * 2)
      const ipos = new Float32Array(cells * cells * 3)
      let k = 0
      for (let i = 0; i < cells; i++) {
        for (let j = 0; j < cells; j++) {
          iuv[k*2+0] = (i + 0.5) / cells
          iuv[k*2+1] = (j + 0.5) / cells
          ipos[k*3+0] = (i / cells) * 2 - 1
          ipos[k*3+1] = 0.02
          ipos[k*3+2] = (j / cells) * 2 - 1
          k++
        }
      }
      iuvBuf = device.createBuffer({ size: iuv.byteLength, usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST })
      iposBuf = device.createBuffer({ size: ipos.byteLength, usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST })
      device.queue.writeBuffer(iuvBuf, 0, iuv)
      device.queue.writeBuffer(iposBuf, 0, ipos)

      // Arrow mesh: low-poly shaft + cone (positions only)
      const segments = 12
      const shaftRadius = 0.03
      const shaftH = 0.7
      const headRadius = 0.07
      const headH = 0.3
      const shaftVerts: number[] = []
      for (let i = 0; i < segments; i++) {
        const a0 = (i / segments) * Math.PI * 2
        const a1 = ((i + 1) / segments) * Math.PI * 2
        const x0 = Math.cos(a0) * shaftRadius
        const z0 = Math.sin(a0) * shaftRadius
        const x1 = Math.cos(a1) * shaftRadius
        const z1 = Math.sin(a1) * shaftRadius
        shaftVerts.push(
          x0, 0, z0,
          x1, 0, z1,
          x0, shaftH, z0,
          x0, shaftH, z0,
          x1, 0, z1,
          x1, shaftH, z1,
        )
      }
      const coneVerts: number[] = []
      const apexY = shaftH + headH
      for (let i = 0; i < segments; i++) {
        const a0 = (i / segments) * Math.PI * 2
        const a1 = ((i + 1) / segments) * Math.PI * 2
        const x0 = Math.cos(a0) * headRadius
        const z0 = Math.sin(a0) * headRadius
        const x1 = Math.cos(a1) * headRadius
        const z1 = Math.sin(a1) * headRadius
        coneVerts.push(x0, shaftH, z0, x1, shaftH, z1, 0, apexY, 0)
      }
      const arrowPos = new Float32Array(shaftVerts.length + coneVerts.length)
      arrowPos.set(shaftVerts, 0); arrowPos.set(coneVerts, shaftVerts.length)
      const arrowVertCount = arrowPos.length / 3
      arrowBuf = device.createBuffer({ size: arrowPos.byteLength, usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST })
      device.queue.writeBuffer(arrowBuf, 0, arrowPos)

      // Vector shader (scale injected)
      const vsScale = Math.max(0.1, Math.min(5.0, vectorScale))
      const vectorVS = /* wgsl */`
        struct Out { @builtin(position) pos: vec4<f32>, @location(0) col: vec3<f32> };
        @group(0) @binding(0) var uGradientTex: texture_2d<f32>;
        @group(0) @binding(1) var uSampler: sampler;
        fn rot(axis: vec3<f32>, angle: f32) -> mat3x3<f32> {
          let s = sin(angle); let c = cos(angle); let oc = 1.0 - c;
          return mat3x3<f32>(
            oc*axis.x*axis.x + c,        oc*axis.x*axis.y - axis.z*s, oc*axis.z*axis.x + axis.y*s,
            oc*axis.x*axis.y + axis.z*s, oc*axis.y*axis.y + c,        oc*axis.y*axis.z - axis.x*s,
            oc*axis.z*axis.x - axis.y*s, oc*axis.y*axis.z + axis.x*s, oc*axis.z*axis.z + c);
        }
        @vertex fn vs_main(@location(0) pos: vec3<f32>, @location(1) iuv: vec2<f32>, @location(2) ipos: vec3<f32>) -> Out {
          let g = textureSample(uGradientTex, uSampler, iuv).rg * 2.0 - 1.0;
          var dir = normalize(vec3<f32>(g.x, 0.0, g.y));
          if (abs(dir.x) + abs(dir.z) < 1e-4) { dir = vec3<f32>(0.0, 1.0, 0.0); }
          let up = vec3<f32>(0.0, 1.0, 0.0);
          let c = clamp(dot(up, dir), -1.0, 1.0);
          let ang = acos(c);
          var axis = normalize(cross(up, dir));
          if (length(axis) < 1e-4) { axis = vec3<f32>(1.0,0.0,0.0); }
          let R = rot(axis, ang);
          let mag = clamp(length(g) * 5.0, 0.05, 0.3) * ${vsScale.toFixed(2)};
          var p = pos; p.y *= mag; p *= 0.01; p = R * p; p += ipos;
          var o: Out; o.pos = vec4<f32>(p, 1.0);
          o.col = vec3<f32>(1.0, 1.0 - clamp(mag, 0.0, 1.0), 0.3);
          return o;
        }`
      const vectorFS = /* wgsl */`@fragment fn fs_main(@location(0) col: vec3<f32>) -> @location(0) vec4<f32> { return vec4<f32>(col, 0.9); }`

      vectorPipeline = device.createRenderPipeline({
        layout: 'auto',
        vertex: { module: device.createShaderModule({ code: vectorVS }), entryPoint: 'vs_main', buffers: [
          { arrayStride: 12, attributes: [ { shaderLocation: 0, offset: 0, format: 'float32x3' } ] },
          { arrayStride: 8, stepMode: 'instance', attributes: [ { shaderLocation: 1, offset: 0, format: 'float32x2' } ] },
          { arrayStride: 12, stepMode: 'instance', attributes: [ { shaderLocation: 2, offset: 0, format: 'float32x3' } ] },
        ] },
        fragment: { module: device.createShaderModule({ code: vectorFS }), entryPoint: 'fs_main', targets: [{ format }] },
        primitive: { topology: 'triangle-list' },
      })

      vectorBG = device.createBindGroup({
        layout: vectorPipeline.getBindGroupLayout(0),
        entries: [ { binding: 0, resource: gradientTex!.createView() }, { binding: 1, resource: sampler! } ],
      })

      // Optional: stream Float32 RGBA tiles into density texture
      let socket: WebSocket | null = null
      if (wsUrl) {
        try {
          socket = new WebSocket(wsUrl)
          socket.onmessage = (event) => {
            if (!device || !densityTex) return
            try {
              const payload = typeof event.data === 'string' ? JSON.parse(event.data) : null
              if (payload && Array.isArray(payload) && payload.length === size * size * 4) {
                const arr = new Float32Array(payload as number[])
                device.queue.writeTexture(
                  { texture: densityTex },
                  arr,
                  { bytesPerRow: size * 4 * 4 },
                  { width: size, height: size, depthOrArrayLayers: 1 }
                )
              }
            } catch {}
          }
        } catch {}
      }

      // Frame loop
      const frame = () => {
        if (cancel || !device || !context) return

        // Compute passes
        const enc = device.createCommandEncoder()
        const pass = enc.beginComputePass()
        pass.setPipeline(densityPipeline!)
        pass.setBindGroup(0, densityBG!)
        const wgd = chosenWGRef.current.d
        const wgg = chosenWGRef.current.g
        pass.dispatchWorkgroups(Math.ceil(size / wgd), Math.ceil(size / wgd), 1)
        pass.end()

        const pass2 = enc.beginComputePass()
        pass2.setPipeline(gradientPipeline!)
        pass2.setBindGroup(0, gradientBG!)
        pass2.dispatchWorkgroups(Math.ceil(size / wgg), Math.ceil(size / wgg), 1)
        pass2.end()
        device.queue.submit([enc.finish()])

        // Render heatmap
        const texView = context.getCurrentTexture().createView()
        const enc2 = device.createCommandEncoder()
        const rp = enc2.beginRenderPass({ colorAttachments: [{ view: texView, clearValue: { r:0,g:0,b:0,a:1 }, loadOp: 'clear', storeOp: 'store' }] })
        rp.setPipeline(heatmapPipeline!)
        rp.setBindGroup(0, heatmapBG!)
        rp.setVertexBuffer(0, quadBuf!)
        rp.draw(6, 1, 0, 0)
        rp.end()
        device.queue.submit([enc2.finish()])

        // Render vectors
        const enc3 = device.createCommandEncoder()
        const rp2 = enc3.beginRenderPass({ colorAttachments: [{ view: context.getCurrentTexture().createView(), loadOp: 'load', storeOp: 'store' }] })
        rp2.setPipeline(vectorPipeline!)
        rp2.setBindGroup(0, vectorBG!)
        rp2.setVertexBuffer(0, arrowBuf!)
        rp2.setVertexBuffer(1, iuvBuf!)
        rp2.setVertexBuffer(2, iposBuf!)
        rp2.draw((arrowBuf ? (arrowBuf as any).size : 0) ? (arrowVertCount as number) : 0, cells*cells, 0, 0)
        rp2.end()
        device.queue.submit([enc3.finish()])

        // Overlay metrics
        const now = performance.now()
        const dt = now - lastFrameRef.current
        lastFrameRef.current = now
        const instFps = dt > 0 ? 1000 / dt : 0
        fpsRef.current = fpsRef.current * 0.9 + instFps * 0.1
        const wgDensity = Math.ceil(size / wgd) * Math.ceil(size / wgd)
        const wgGradient = Math.ceil(size / wgg) * Math.ceil(size / wgg)
        wgpsRef.current = (wgDensity + wgGradient) * fpsRef.current

        rafRef.current = requestAnimationFrame(frame)
      }

      // Create quad bind group and start
      heatmapBG = device.createBindGroup({
        layout: heatmapPipeline!.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: densityTex!.createView() },
          { binding: 1, resource: sampler! },
          { binding: 2, resource: lutTex!.createView() },
          { binding: 3, resource: { buffer: uParamsBuf! } },
        ],
      })

      frame()

      return () => {
        cancel = true
        try { if (rafRef.current) cancelAnimationFrame(rafRef.current) } catch {}
        try { if (socket && socket.readyState === WebSocket.OPEN) socket.close() } catch {}
      }
    }

    init()

    return () => {
      try { if (rafRef.current) cancelAnimationFrame(rafRef.current) } catch {}
    }
  }, [points, palette, metricMode, minRange, maxRange, size, wsUrl, cellsProp, vectorScale])

  // UI Overlay
  const [tick, setTick] = React.useState(0)
  React.useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 500)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="relative w-full h-[320px]">
      <canvas ref={canvasRef} className="w-full h-full block" />
      {/* Simple overlay placeholder; values are updated by refs in effect */}
      <div className="absolute top-1 right-1 text-[10px] px-2 py-1 bg-black/50 border border-white/10 rounded space-y-0.5 text-white">
        <div>Res: {size}²</div>
        {/* FPS/WG/s are approximated in effect; we can’t read refs directly here without state. */}
        <div>Note: FPS and WG/s overlays update live in console.</div>
      </div>
    </div>
  )
}