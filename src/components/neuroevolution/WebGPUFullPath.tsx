'use client'
import * as React from 'react'

type AgentPoint = { x: number; z: number; timeMs?: number; accuracy?: number; energy?: number }

type Props = {
  points: AgentPoint[]
  palette: 'viridis' | 'magma' | 'inferno' | 'plasma'
  metricMode: 'density' | 'time' | 'accuracy' | 'energy'
  minRange: number
  maxRange: number
  size?: number
  /** Optional WebSocket URL to stream RGBA float32 tiles into the density texture */
  wsUrl?: string
}

export default function WebGPUFullPath({ points, palette, metricMode, minRange, maxRange, size = 512, wsUrl }: Props) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null)
  const rafRef = React.useRef<number | null>(null)

  React.useEffect(() => {
    let cancel = false
    let device: GPUDevice | null = null
    let context: GPUCanvasContext | null = null
    let densityTex: GPUTexture | null = null
    let gradientTex: GPUTexture | null = null
    let densityPipeline: GPUComputePipeline | null = null
    let gradientPipeline: GPUComputePipeline | null = null
    let heatmapPipeline: GPURenderPipeline | null = null
    let vectorPipeline: GPURenderPipeline | null = null
    const [fps, setFps] = [React.useRef(0), React.useRef(0)] as any
    const lastFrameRef = React.useRef<number>(performance.now())
    const wgpsRef = React.useRef<number>(0)
    let sampler: GPUSampler | null = null
    let lutTex: GPUTexture | null = null
    let pointsBuf: GPUBuffer | null = null
    let uSizeBuf: GPUBuffer | null = null
    let uParamsBuf: GPUBuffer | null = null
    let heatmapBG: GPUBindGroup | null = null
    let gradientBG: GPUBindGroup | null = null
    let densityBG: GPUBindGroup | null = null
    let vectorBG: GPUBindGroup | null = null

    const quadVerts = new Float32Array([
      -1, -1, 0, 0,  1, -1, 1, 0,  -1, 1, 0, 1,
      -1, 1, 0, 1,   1, -1, 1, 0,   1, 1, 1, 1,
    ])

    async function init() {
      if (!canvasRef.current) return
      if (!('gpu' in navigator)) return
      const adapter = await (navigator as any).gpu.requestAdapter()
      if (!adapter) return
      device = await adapter.requestDevice()
      context = canvasRef.current.getContext('webgpu') as unknown as GPUCanvasContext
      const format = (navigator as any).gpu.getPreferredCanvasFormat()
      context.configure({ device, format, alphaMode: 'premultiplied' })

      // Compute shaders (16f + 8bit fallback)
      const densityCS16 = /* wgsl */`
        struct Point { x: f32, z: f32, t: f32, a: f32, e: f32 };
        @group(0) @binding(0) var<storage, read> points: array<Point>;
        @group(0) @binding(1) var outImg: texture_storage_2d<rgba16float, write>;
        @group(0) @binding(2) var<uniform> uSize: vec2<f32>;
        @compute @workgroup_size(8,8)
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
            r = r + w * 1.0;
            g = g + w * P.t;
            b = b + w * P.a;
            a = a + w * P.e;
          }
          let col = vec4<f32>(r, g, b, a);
          let maxv = max(1.0, max(col.x, max(col.y, max(col.z, col.w))));
          textureStore(outImg, vec2<i32>(i32(gid.x), i32(gid.y)), clamp(col / maxv, vec4<f32>(0.0), vec4<f32>(1.0)));
        }
      `;

      const densityCS8 = /* wgsl */`
        struct Point { x: f32, z: f32, t: f32, a: f32, e: f32 };
        @group(0) @binding(0) var<storage, read> points: array<Point>;
        @group(0) @binding(1) var outImg: texture_storage_2d<rgba8unorm, write>;
        @group(0) @binding(2) var<uniform> uSize: vec2<f32>;
        @compute @workgroup_size(8,8)
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
            r = r + w * 1.0;
            g = g + w * P.t;
            b = b + w * P.a;
            a = a + w * P.e;
          }
          let col = vec4<f32>(r, g, b, a);
          let maxv = max(1.0, max(col.x, max(col.y, max(col.z, col.w))));
          textureStore(outImg, vec2<i32>(i32(gid.x), i32(gid.y)), clamp(col / maxv, vec4<f32>(0.0), vec4<f32>(1.0)));
        }
      `;

      const gradientCS16 = /* wgsl */`
        @group(0) @binding(0) var src: texture_2d<f32>;
        @group(0) @binding(1) var dst: texture_storage_2d<rg16float, write>;
        @group(0) @binding(2) var<uniform> uSize: vec2<f32>;
        fn s(x: i32, y: i32) -> f32 {
          let cl = vec2<i32>(clamp(x, 0, i32(uSize.x)-1), clamp(y, 0, i32(uSize.y)-1));
          let uv = (vec2<f32>(vec2<i32>(cl)) + vec2<f32>(0.5,0.5)) / uSize;
          return textureSampleLevel(src, samplerLinear, uv, 0.0).r;
        }
        @compute @workgroup_size(16,16)
        fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
          let x = i32(gid.x); let y = i32(gid.y);
          if (x >= i32(uSize.x) || y >= i32(uSize.y)) { return; }
          let dx = 0.5 * (s(x+1,y) - s(x-1,y));
          let dy = 0.5 * (s(x,y+1) - s(x,y-1));
          textureStore(dst, vec2<i32>(x,y), vec4<f32>(dx, dy, 0.0, 0.0));
        }
      `;

      const gradientCS8 = /* wgsl */`
        @group(0) @binding(0) var src: texture_2d<f32>;
        @group(0) @binding(1) var dst: texture_storage_2d<rg8unorm, write>;
        @group(0) @binding(2) var<uniform> uSize: vec2<f32>;
        fn s(x: i32, y: i32) -> f32 {
          let cl = vec2<i32>(clamp(x, 0, i32(uSize.x)-1), clamp(y, 0, i32(uSize.y)-1));
          let uv = (vec2<f32>(vec2<i32>(cl)) + vec2<f32>(0.5,0.5)) / uSize;
          return textureSampleLevel(src, samplerLinear, uv, 0.0).r;
        }
        @compute @workgroup_size(16,16)
        fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
          let x = i32(gid.x); let y = i32(gid.y);
          if (x >= i32(uSize.x) || y >= i32(uSize.y)) { return; }
          let dx = 0.5 * (s(x+1,y) - s(x-1,y));
          let dy = 0.5 * (s(x,y+1) - s(x,y-1));
          let rg = vec2<f32>(clamp(0.5 + 0.5*dx, 0.0, 1.0), clamp(0.5 + 0.5*dy, 0.0, 1.0));
          textureStore(dst, vec2<i32>(x,y), vec4<f32>(rg, 0.0, 0.0));
        }
      `;

      // Helper to create textures + pipelines with fallback
      async function createWithFallback(prefer16f: boolean) {
        const tryFormats = (prefer16f
          ? [['rgba16float','rg16float'], ['rgba8unorm','rg8unorm']]
          : [['rgba8unorm','rg8unorm']] ) as Array<[GPUTextureFormat, GPUTextureFormat]>;
        let ok = false;
        for (const [df, gf] of tryFormats) {
          try {
            const d = device.createTexture({ size: [size, size, 1], format: df, usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST });
            const g = device.createTexture({ size: [size, size, 1], format: gf, usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING });
            const dcs = (df === 'rgba16float') ? densityCS16 : densityCS8;
            const gcs = (gf === 'rg16float') ? gradientCS16 : gradientCS8;
            const dpipe = device.createComputePipeline({ layout: 'auto', compute: { module: device.createShaderModule({ code: dcs }), entryPoint: 'main' } });
            const gpipe = device.createComputePipeline({ layout: 'auto', compute: { module: device.createShaderModule({ code: gcs }), entryPoint: 'main' } });
            densityTex = d; gradientTex = g; densityPipeline = dpipe; gradientPipeline = gpipe; ok = true; break;
          } catch (e) {
            // try next pair
          }
        }
        if (!ok) { throw new Error('Failed to create compute pipelines for both 16f and 8bit formats'); }
      }

      await createWithFallback(true)

      sampler = device.createSampler({ minFilter: 'linear', magFilter: 'linear', addressModeU: 'clamp-to-edge', addressModeV: 'clamp-to-edge' })

      // LUT load
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
      const pts = new Float32Array(Math.max(1, points.length) * ptsStride)
      for (let i = 0; i < Math.max(1, points.length); i++) {
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

      // Pipelines (compute + render)
      // Pipelines already created by fallback helper

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

      const vectorVS = /* wgsl */`
        struct Out { @builtin(position) pos: vec4<f32>, @location(0) col: vec3<f32> };
        @group(0) @binding(0) var uGradientTex: texture_2d<f32>;
        @group(0) @binding(1) var uSampler: sampler;
        fn rotFromAxisAngle(axis: vec3<f32>, angle: f32) -> mat3x3<f32> {
          let s = sin(angle); let c = cos(angle); let oc = 1.0 - c;
          return mat3x3<f32>(
            oc*axis.x*axis.x + c,        oc*axis.x*axis.y - axis.z*s, oc*axis.z*axis.x + axis.y*s,
            oc*axis.x*axis.y + axis.z*s, oc*axis.y*axis.y + c,        oc*axis.y*axis.z - axis.x*s,
            oc*axis.z*axis.x - axis.y*s, oc*axis.y*axis.z + axis.x*s, oc*axis.z*axis.z + c);
        }
        @vertex fn vs_main(@location(0) pos: vec3<f32>, @location(2) iuv: vec2<f32>, @location(3) ipos: vec3<f32>) -> Out {
          let g = textureSample(uGradientTex, uSampler, iuv).rg * 2.0 - 1.0;
          var dir = normalize(vec3<f32>(g.x, 0.0, g.y));
          if (abs(dir.x) + abs(dir.z) < 1e-4) { dir = vec3<f32>(0.0, 1.0, 0.0); }
          let up = vec3<f32>(0.0, 1.0, 0.0);
          let c = clamp(dot(up, dir), -1.0, 1.0);
          let ang = acos(c);
          var axis = normalize(cross(up, dir));
          if (length(axis) < 1e-4) { axis = vec3<f32>(1.0,0.0,0.0); }
          let R = rotFromAxisAngle(axis, ang);
          let mag = clamp(length(g) * 5.0, 0.05, 0.3);
          var p = pos; p.y *= mag; p *= 0.01; p = R * p; p += ipos;
          var o: Out; o.pos = vec4<f32>(p, 1.0);
          o.col = vec3<f32>(1.0, 1.0 - clamp(mag, 0.0, 1.0), 0.3);
          return o;
        }`
      const vectorFS = /* wgsl */`@fragment fn fs_main(@location(0) col: vec3<f32>) -> @location(0) vec4<f32> { return vec4<f32>(col, 0.9); }`
      vectorPipeline = device.createRenderPipeline({
        layout: 'auto',
        vertex: { module: device.createShaderModule({ code: vectorVS }), entryPoint: 'vs_main', buffers: [ { arrayStride: 12, attributes: [ { shaderLocation: 0, offset: 0, format: 'float32x3' } ] }, { arrayStride: 8, stepMode: 'instance', attributes: [ { shaderLocation: 2, offset: 0, format: 'float32x2' } ] }, { arrayStride: 12, stepMode: 'instance', attributes: [ { shaderLocation: 3, offset: 0, format: 'float32x3' } ] } ] },
        fragment: { module: device.createShaderModule({ code: vectorFS }), entryPoint: 'fs_main', targets: [{ format }] },
        primitive: { topology: 'triangle-list' },
      })

      // Bind groups
      densityBG = device.createBindGroup({ layout: densityPipeline.getBindGroupLayout(0), entries: [ { binding: 0, resource: { buffer: pointsBuf } }, { binding: 1, resource: densityTex.createView() }, { binding: 2, resource: { buffer: uSizeBuf } } ] })
      gradientBG = device.createBindGroup({ layout: gradientPipeline.getBindGroupLayout(0), entries: [ { binding: 0, resource: densityTex.createView() }, { binding: 1, resource: gradientTex.createView() }, { binding: 2, resource: { buffer: uSizeBuf } } ] })
      heatmapBG = device.createBindGroup({ layout: heatmapPipeline.getBindGroupLayout(0), entries: [ { binding: 0, resource: densityTex.createView() }, { binding: 1, resource: sampler }, { binding: 2, resource: lutTex!.createView() }, { binding: 3, resource: { buffer: uParamsBuf } } ] })
      vectorBG = device.createBindGroup({ layout: vectorPipeline.getBindGroupLayout(0), entries: [ { binding: 0, resource: gradientTex.createView() }, { binding: 1, resource: sampler } ] })

      const quadBuf = device.createBuffer({ size: quadVerts.byteLength, usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST })
      device.queue.writeBuffer(quadBuf, 0, quadVerts)

      // Instance buffers for vector grid
      const cells = 16
      const iuv = new Float32Array(cells * cells * 2)
      const ipos = new Float32Array(cells * cells * 3)
      let k = 0
      for (let i = 0; i < cells; i++) {
        for (let j = 0; j < cells; j++) {
          iuv[k*2+0] = (i + 0.5) / cells; iuv[k*2+1] = (j + 0.5) / cells
          ipos[k*3+0] = (i / cells) * 2 - 1; ipos[k*3+1] = 0.02; ipos[k*3+2] = (j / cells) * 2 - 1
          k++
        }
      }
      const iuvBuf = device.createBuffer({ size: iuv.byteLength, usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST })
      const iposBuf = device.createBuffer({ size: ipos.byteLength, usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST })
      device.queue.writeBuffer(iuvBuf, 0, iuv)
      device.queue.writeBuffer(iposBuf, 0, ipos)

      // Build a small arrow mesh (shaft + cone) in local space (Y up)
      // Shaft: low-poly cylinder; Head: low-poly cone. Positions only (normals not used).
      const segments = 12
      const shaftRadius = 0.03
      const shaftH = 0.7
      const headRadius = 0.07
      const headH = 0.3
      const totalH = shaftH + headH // should equal 1.0 scale in shader before magnitude scaling

      const shaftVerts: number[] = []
      for (let i = 0; i < segments; i++) {
        const a0 = (i / segments) * Math.PI * 2
        const a1 = ((i + 1) / segments) * Math.PI * 2
        const x0 = Math.cos(a0) * shaftRadius
        const z0 = Math.sin(a0) * shaftRadius
        const x1 = Math.cos(a1) * shaftRadius
        const z1 = Math.sin(a1) * shaftRadius
        // two triangles per quad (bottom at y=0, top at y=shaftH)
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
      const apexY = totalH
      for (let i = 0; i < segments; i++) {
        const a0 = (i / segments) * Math.PI * 2
        const a1 = ((i + 1) / segments) * Math.PI * 2
        const x0 = Math.cos(a0) * headRadius
        const z0 = Math.sin(a0) * headRadius
        const x1 = Math.cos(a1) * headRadius
        const z1 = Math.sin(a1) * headRadius
        // side triangle (base ring at y=shaftH, apex at y=apexY)
        coneVerts.push(
          x0, shaftH, z0,
          x1, shaftH, z1,
          0, apexY, 0,
        )
      }
      const arrowPos = new Float32Array(shaftVerts.length + coneVerts.length)
      arrowPos.set(shaftVerts, 0)
      arrowPos.set(coneVerts, shaftVerts.length)
      const arrowVertCount = arrowPos.length / 3
      const arrowBuf = device.createBuffer({ size: arrowPos.byteLength, usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST })
      device.queue.writeBuffer(arrowBuf, 0, arrowPos)

      const frame = () => {
        if (cancel || !device || !context) return
        // Compute density + gradient
        const enc = device.createCommandEncoder()
        const pass = enc.beginComputePass()
        pass.setPipeline(densityPipeline!)
        pass.setBindGroup(0, densityBG!)
        pass.dispatchWorkgroups(Math.ceil(size/16), Math.ceil(size/16), 1)
        pass.end()
        const pass2 = enc.beginComputePass()
        pass2.setPipeline(gradientPipeline!)
        pass2.setBindGroup(0, gradientBG!)
        pass2.dispatchWorkgroups(Math.ceil(size/16), Math.ceil(size/16), 1)
        pass2.end()
        device.queue.submit([enc.finish()])

        // Render heatmap
        const texView = context.getCurrentTexture().createView()
        const enc2 = device.createCommandEncoder()
        const rp = enc2.beginRenderPass({ colorAttachments: [{ view: texView, clearValue: { r:0,g:0,b:0,a:1 }, loadOp: 'clear', storeOp: 'store' }] })
        rp.setPipeline(heatmapPipeline!)
        rp.setBindGroup(0, heatmapBG!)
        rp.setVertexBuffer(0, quadBuf)
        rp.draw(6, 1, 0, 0)
        rp.end()
        device.queue.submit([enc2.finish()])

        // Render vector field (overlay)
        const enc3 = device.createCommandEncoder()
        const rp2 = enc3.beginRenderPass({ colorAttachments: [{ view: context.getCurrentTexture().createView(), loadOp: 'load', storeOp: 'store' }] })
        rp2.setPipeline(vectorPipeline!)
        rp2.setBindGroup(0, vectorBG!)
        rp2.setVertexBuffer(0, arrowBuf)
        rp2.setVertexBuffer(1, iuvBuf)
        rp2.setVertexBuffer(2, iposBuf)
        rp2.draw(arrowVertCount, cells*cells, 0, 0)
        rp2.end()
        device.queue.submit([enc3.finish()])

        const now = performance.now()
        const dt = now - lastFrameRef.current
        lastFrameRef.current = now
        const instFps = dt > 0 ? 1000 / dt : 0
        // simple low-pass filter
        fps.current = fps.current * 0.9 + instFps * 0.1
        // Approx workgroups per second: density (8x8), gradient (16x16)
        const wgDensity = Math.ceil(size/8) * Math.ceil(size/8)
        const wgGradient = Math.ceil(size/16) * Math.ceil(size/16)
        wgpsRef.current = (wgDensity + wgGradient) * fps.current
        rafRef.current = requestAnimationFrame(frame)
      }
      frame()
    }

    init()

    // Optional: stream RGBA float32 buffer into density texture via WebSocket
    let socket: WebSocket | null = null
    if (wsUrl) {
      try {
        socket = new WebSocket(wsUrl)
        socket.onmessage = (event) => {
          if (!device || !densityTex) return
          try {
            // Expect JSON array of length size*size*4 (Float32 RGBA)
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

    return () => {
      cancel = true
      try { if (socket && socket.readyState === WebSocket.OPEN) socket.close() } catch {}
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [points, palette, metricMode, minRange, maxRange, size])

  return (
    <div className="relative w-full h-[320px]">
      <canvas ref={canvasRef} className="w-full h-full block" />
      <div className="absolute top-1 right-1 text-[10px] px-2 py-1 bg-black/50 border border-white/10 rounded space-y-0.5 text-white">
        <div>FPS: {Math.round((fps as any).current || 0)}</div>
        <div>Res: {size}²</div>
        <div>WG/s: {Math.round((wgpsRef as any).current || 0)}</div>
      </div>
    </div>
  )
}
