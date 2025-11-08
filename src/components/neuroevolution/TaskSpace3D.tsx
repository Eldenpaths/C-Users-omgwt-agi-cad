'use client'
import * as React from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { connectMetricsSocket, type MetricsMessage } from '@/lib/neuroevolution/wsClient'
import WebGPUFullPath from '@/components/neuroevolution/WebGPUFullPath'

type AgentPoint = { id: string; x: number; y: number; z: number; color: string; timeMs?: number; accuracy?: number; energy?: number }

function randColor(seed: string) {
  const h = Math.abs([...seed].reduce((a, c) => a + c.charCodeAt(0), 0)) % 360
  return `hsl(${h}deg 70% 55%)`
}

function AgentsCloud({ agents }: { agents: AgentPoint[] }) {
  const ref = React.useRef<any>(null)
  useFrame(() => {})
  return (
    <group ref={ref}>
      {agents.map((a) => (
        <mesh key={a.id} position={[a.x, a.y, a.z]}> 
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshStandardMaterial color={a.color} />
        </mesh>
      ))}
    </group>
  )
}

export default function TaskSpace3D({ agentId = 'demo-agent' }: { agentId?: string }) {
  const [points, setPoints] = React.useState<Record<string, AgentPoint>>({})
  const [showVectors, setShowVectors] = React.useState(true)
  const [showHeat, setShowHeat] = React.useState(true)
  const [showField, setShowField] = React.useState(false)
  const [useWebGpuRender, setUseWebGpuRender] = React.useState(true)
  const [metricMode, setMetricMode] = React.useState<'density' | 'time' | 'accuracy' | 'energy'>('density')
  const [palette, setPalette] = React.useState<'blue-red' | 'green-yellow' | 'plasma' | 'viridis' | 'magma' | 'inferno' | 'custom'>('blue-red')
  const [autoScale, setAutoScale] = React.useState(true)
  const [minRange, setMinRange] = React.useState(0)
  const [maxRange, setMaxRange] = React.useState(1)
  const [customStart, setCustomStart] = React.useState('#0a34cc')
  const [customEnd, setCustomEnd] = React.useState('#e21d19')
  const [customStops, setCustomStops] = React.useState<Array<{ pos: number; color: string }>>([
    { pos: 0.25, color: '#00ffaa' },
    { pos: 0.75, color: '#ffaa00' },
  ])
  const [showEditor, setShowEditor] = React.useState(false)
  const [wsToken, setWsToken] = React.useState<string | null>(null)
  const [wsUrl, setWsUrl] = React.useState<string | null>(null)
  const [wsStatus, setWsStatus] = React.useState<'idle'|'connecting'|'open'|'closed'|'error'>('idle')
  const prevRef = React.useRef<Record<string, AgentPoint>>({})
  const [densityTex, setDensityTex] = React.useState<THREE.Texture | null>(null)
  const [gradientTex, setGradientTex] = React.useState<THREE.Texture | null>(null)

  // Load persisted custom palette
  React.useEffect(() => {
    try {
      const uiRaw = localStorage.getItem('neuro-heatmap-ui')
      if (uiRaw) {
        const ui = JSON.parse(uiRaw)
        if (typeof ui.metricMode === 'string') setMetricMode(ui.metricMode)
        if (typeof ui.palette === 'string') setPalette(ui.palette)
        if (typeof ui.autoScale === 'boolean') setAutoScale(ui.autoScale)
        if (typeof ui.minRange === 'number') setMinRange(ui.minRange)
        if (typeof ui.maxRange === 'number') setMaxRange(ui.maxRange)
        if (typeof ui.showHeat === 'boolean') setShowHeat(ui.showHeat)
        if (typeof ui.showVectors === 'boolean') setShowVectors(ui.showVectors)
        if (typeof ui.showField === 'boolean') setShowField(ui.showField)
        if (typeof ui.showEditor === 'boolean') setShowEditor(ui.showEditor)
        if (typeof ui.useWebGpuRender === 'boolean') setUseWebGpuRender(ui.useWebGpuRender)
      }
      const raw = localStorage.getItem('neuro-heatmap-custom')
      if (raw) {
        const json = JSON.parse(raw)
        if (json.start) setCustomStart(json.start)
        if (json.end) setCustomEnd(json.end)
      }
      const rawStops = localStorage.getItem('neuro-heatmap-stops')
      if (rawStops) {
        const arr = JSON.parse(rawStops)
        if (Array.isArray(arr)) setCustomStops(arr.filter((s: any) => typeof s?.pos === 'number' && typeof s?.color === 'string'))
      }
    } catch {}
  }, [])
  // Persist on change
  React.useEffect(() => {
    try { localStorage.setItem('neuro-heatmap-custom', JSON.stringify({ start: customStart, end: customEnd })) } catch {}
  }, [customStart, customEnd])
  React.useEffect(() => {
    try { localStorage.setItem('neuro-heatmap-stops', JSON.stringify(customStops)) } catch {}
  }, [customStops])

  // Persist full UI state
  React.useEffect(() => {
    try {
      localStorage.setItem('neuro-heatmap-ui', JSON.stringify({
        metricMode, palette, autoScale, minRange, maxRange, showHeat, showVectors, showField, showEditor, useWebGpuRender,
      }))
    } catch {}
  }, [metricMode, palette, autoScale, minRange, maxRange, showHeat, showVectors, showField, showEditor, useWebGpuRender])

  React.useEffect(() => {
    const ws = connectMetricsSocket((msg: MetricsMessage) => {
      const { agentId, metrics } = msg.payload
      // Map task metrics to a 3D point
      const time = Number(metrics.timeMs ?? 0)
      const acc = Number(metrics.accuracy ?? 0)
      const eng = Number(metrics.energy ?? 0)
      const x = Math.tanh((time / 10000) - 0.5) // normalized
      const y = acc - 0.5
      const z = Math.tanh((eng / 100) - 0.5)
      setPoints((p) => ({
        ...p,
        [agentId]: { id: agentId, x, y, z, color: p[agentId]?.color ?? randColor(agentId), timeMs: time, accuracy: acc, energy: eng },
      }))
    }, `agent/${agentId}/metrics`)
    return () => ws.close()
  }, [])

  return (
    <div className="rounded-md border border-zinc-800 p-2">
      <div className="text-sm font-semibold mb-2">Task Space 3D</div>
      <div className="flex flex-wrap items-center gap-4 text-xs mb-2">
        <div className="flex items-center gap-2"> 
          <label className="inline-flex items-center gap-1"><input type="checkbox" checked={showHeat} onChange={(e) => setShowHeat(e.target.checked)} /> Heatmap</label>
          <label className="inline-flex items-center gap-1"><input type="checkbox" checked={showVectors} onChange={(e) => setShowVectors(e.target.checked)} /> Vectors</label>
          <label className="inline-flex items-center gap-1"><input type="checkbox" checked={showField} onChange={(e) => setShowField(e.target.checked)} /> Field</label>
          <label className="inline-flex items-center gap-1"><input type="checkbox" checked={useWebGpuRender} onChange={(e) => setUseWebGpuRender(e.target.checked)} /> Use WebGPU Render</label>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-zinc-400">Metric:</span>
          <select className="bg-zinc-900 border border-zinc-700 rounded px-1 py-0.5"
                  value={metricMode}
                  onChange={(e) => setMetricMode(e.target.value as any)}>
            <option value="density">density</option>
            <option value="time">time</option>
            <option value="accuracy">accuracy</option>
            <option value="energy">energy</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-zinc-400">Palette:</span>
          <select className="bg-zinc-900 border border-zinc-700 rounded px-1 py-0.5"
                  value={palette}
                  onChange={(e) => setPalette(e.target.value as any)}>
            <option value="blue-red">blue→red</option>
            <option value="green-yellow">green→yellow</option>
            <option value="plasma">plasma</option>
            <option value="viridis">viridis</option>
            <option value="magma">magma</option>
            <option value="inferno">inferno</option>
            <option value="custom">custom</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="inline-flex items-center gap-1"><input type="checkbox" checked={autoScale} onChange={(e) => setAutoScale(e.target.checked)} /> Auto-scale</label>
          {!autoScale && (
            <>
              <span className="text-zinc-400">Min</span>
              <input type="range" min={0} max={1} step={0.01} value={minRange} onChange={(e) => setMinRange(parseFloat(e.target.value))} />
              <span className="text-zinc-400">Max</span>
              <input type="range" min={0} max={1} step={0.01} value={maxRange} onChange={(e) => setMaxRange(parseFloat(e.target.value))} />
            </>
          )}
        </div>
        {palette === 'custom' && (
          <div className="flex items-center gap-2">
            <span className="text-zinc-400">Start</span>
            <input type="color" value={customStart} onChange={(e) => setCustomStart(e.target.value)} />
            <span className="text-zinc-400">End</span>
            <input type="color" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} />
            <button className="px-2 py-0.5 border border-zinc-700 rounded" onClick={() => setShowEditor(true)}>Open Palette Editor</button>
          </div>
        )}
        {palette === 'custom' && (
          <div className="flex flex-col gap-2 w-full">
            <div className="text-zinc-400">Stops (pos 0–1)</div>
            {customStops.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <input type="range" min={0} max={1} step={0.01} value={s.pos} onChange={(e) => {
                  const v = parseFloat(e.target.value); setCustomStops(stops => stops.map((x, idx) => idx===i?{...x, pos:v}:x))
                }} />
                <input type="color" value={s.color} onChange={(e) => setCustomStops(stops => stops.map((x, idx) => idx===i?{...x, color:e.target.value}:x))} />
                <button className="px-2 py-0.5 border border-zinc-700 rounded" onClick={() => setCustomStops(stops => stops.filter((_, idx) => idx!==i))}>Remove</button>
              </div>
            ))}
            <div>
              <button className="px-2 py-0.5 border border-zinc-700 rounded" onClick={() => setCustomStops(stops => stops.length<6?[...stops, { pos: 0.5, color: '#ffffff'}]:stops)}>Add Stop</button>
            </div>
          </div>
        )}
      </div>
      <div style={{ height: 320 }}>
        {useWebGpuRender ? (
          <div className="h-full w-full border border-zinc-800 rounded-md overflow-hidden"> 
            <WebGPUFullPath
              points={Object.values(points).map(p => ({ x: p.x, z: p.z, timeMs: p.timeMs, accuracy: p.accuracy, energy: p.energy }))}
              palette={(['viridis','magma','inferno','plasma'] as const).includes(palette as any) ? (palette as any) : 'viridis'}
              metricMode={metricMode as any}
              minRange={minRange}
              maxRange={maxRange}
              size={512}
            />
          </div>
        ) : (
          <Canvas camera={{ position: [1.5, 1.2, 1.5] }}>
            {/* Prefer WebGPU compute if available; otherwise WebGL fallback density splats */}
            <WebGPUComputeDensity points={Object.values(points)} onTextures={(d, g) => { setDensityTex(d); setGradientTex(g) }} size={512} />
            {!densityTex && <DensityCompute points={Object.values(points)} onTexture={setDensityTex} />}
            <ambientLight intensity={0.6} />
            <pointLight position={[3, 3, 3]} />
            <gridHelper args={[4, 8, '#333', '#222']} />
            {showHeat && (
              <Heatmap
                points={Object.values(points)}
                metric={metricMode}
                palette={palette as any}
                autoScale={autoScale}
                minRange={minRange}
                maxRange={maxRange}
                customStart={customStart}
                customEnd={customEnd}
                customStops={customStops}
                densityTex={densityTex}
              />
            )}
            <AgentsCloud agents={Object.values(points)} />
            {showVectors && <Vectors prev={prevRef.current} next={points} />}
            {showField && densityTex && <VectorFieldGPU densityTex={densityTex} gradientTex={gradientTex} cells={16} />}
            <OrbitControls enablePan enableZoom enableRotate />
          </Canvas>
        )}
      </div>
      {showEditor && (
        <PaletteEditorModal
          start={customStart}
          end={customEnd}
          stops={customStops}
          onClose={() => setShowEditor(false)}
          onChange={(next) => setCustomStops(next)}
        />
      )}
    </div>
  )
}

function Heatmap({ points, metric, palette, autoScale, minRange, maxRange, customStart, customEnd, customStops, densityTex }: {
  points: AgentPoint[];
  metric: 'density' | 'time' | 'accuracy' | 'energy';
  palette: 'blue-red' | 'green-yellow' | 'plasma' | 'viridis' | 'magma' | 'custom';
  autoScale: boolean;
  minRange: number;
  maxRange: number;
  customStart: string;
  customEnd: string;
  customStops: Array<{ pos: number; color: string }>;
  densityTex: THREE.Texture | null;
}) {
  // GPU-driven heatmap using InstancedMesh + custom shader for smooth gradients
  const cells = 32
  const instanceCount = cells * cells
  const ref = React.useRef<THREE.InstancedMesh>(null)
  const [lutTexture, setLutTexture] = React.useState<THREE.DataTexture | null>(null)
  // Try to load exact LUTs from static JSON if available; fall back to generated LUT
  React.useEffect(() => {
    let cancelled = false
    async function loadLUT() {
      if (palette !== 'viridis' && palette !== 'magma' && palette !== 'plasma' && palette !== 'inferno') { setLutTexture(null); return }
      try {
        let url = '/colormaps/viridis-256.json'
        if (palette === 'magma') url = '/colormaps/magma-256.json'
        if (palette === 'plasma') url = '/colormaps/plasma-256.json'
        if (palette === 'inferno') url = '/colormaps/inferno-256.json'
        const res = await fetch(url)
        if (!res.ok) throw new Error('lut not found')
        const arr = await res.json() as number[][]
        // Expect [[r,g,b], ...] in 0..255 or 0..1; normalize to 0..255 uint8
        const size = Array.isArray(arr) ? arr.length : 0
        if (!size || size !== 256) throw new Error('invalid lut size')
        const data = new Uint8Array(size * 3)
        for (let i = 0; i < size; i++) {
          const trip = arr[i]
          const r = trip[0] <= 1 ? Math.round(trip[0] * 255) : Math.round(trip[0])
          const g = trip[1] <= 1 ? Math.round(trip[1] * 255) : Math.round(trip[1])
          const b = trip[2] <= 1 ? Math.round(trip[2] * 255) : Math.round(trip[2])
          data[i*3+0] = r
          data[i*3+1] = g
          data[i*3+2] = b
        }
        const tex = new THREE.DataTexture(data, size, 1, THREE.RGBFormat)
        tex.needsUpdate = true
        tex.minFilter = THREE.LinearFilter
        tex.magFilter = THREE.LinearFilter
        tex.wrapS = THREE.ClampToEdgeWrapping
        tex.wrapT = THREE.ClampToEdgeWrapping
        if (!cancelled) setLutTexture(tex)
      } catch {
        // Fallback to generated LUT approximation
        const tex = createLUTTexture(palette)
        if (!cancelled) setLutTexture(tex)
      }
    }
    loadLUT()
    return () => { cancelled = true }
  }, [palette])

  // Precompute base matrices
  const base = React.useMemo(() => {
    const positions: [number, number, number][] = []
    for (let i = 0; i < cells; i++) {
      for (let j = 0; j < cells; j++) {
        const x = (i / cells) * 2 - 1
        const z = (j / cells) * 2 - 1
        positions.push([x, 0, z])
      }
    }
    return { positions }
  }, [cells])

  const MAX_STOPS = 8
  const MAX_STOPS = 8
  const material = React.useMemo(() => {
    const vertexShader = `
      attribute float aIntensity;
      varying float vI;
      uniform float uPalette; // 0: blue-red, 1: green-yellow, 2: plasma, 3: viridis, 4: magma, 5: custom
      uniform float uMin;
      uniform float uMax;
      uniform vec3 uCustomStart;
      uniform vec3 uCustomEnd;
      uniform int uStopsCount;
      uniform float uStopsPos[8];
      uniform vec3 uStopsCol[8];
      uniform float uUseLUT; // 1.0 when using LUT texture
      uniform float uUseDensityTex; // 1.0 when sampling density texture
      attribute vec2 iuv; // per-instance uv for density tex sampling
      varying vec2 vUV;
      void main() {
        float t = aIntensity;
        vUV = iuv;
        // remap based on uMin/uMax
        t = (t - uMin) / max(0.0001, (uMax - uMin));
        vI = clamp(t, 0.0, 1.0);
        gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
      }
    `
    const fragmentShader = `
      precision mediump float;
      varying float vI;
      varying vec2 vUV;
      uniform float uPalette; // 0: blue-red, 1: green-yellow, 2: plasma, 3: viridis, 4: magma, 5: custom
      uniform vec3 uCustomStart;
      uniform vec3 uCustomEnd;
      uniform int uStopsCount;
      uniform float uStopsPos[8];
      uniform vec3 uStopsCol[8];
      uniform float uUseLUT;
      uniform sampler2D uLUT;
      uniform float uUseDensityTex;
      uniform sampler2D uDensityTex;
      uniform float uMetricMode; // 0 density, 1 time, 2 accuracy, 3 energy
      vec3 gradBlueRed(float t){
        vec3 c1 = vec3(0.1,0.2,0.8);
        vec3 c2 = vec3(0.9,0.2,0.1);
        return mix(c1, c2, smoothstep(0.0,1.0,t));
      }
      vec3 gradGreenYellow(float t){
        vec3 c1 = vec3(0.1,0.8,0.2);
        vec3 c2 = vec3(0.9,0.8,0.1);
        return mix(c1, c2, smoothstep(0.0,1.0,t));
      }
      vec3 gradPlasma(float t){
        // cheap plasma-like gradient
        return vec3(
          0.5 + 0.5*sin(6.2831*(t+0.00)),
          0.5 + 0.5*sin(6.2831*(t+0.33)),
          0.5 + 0.5*sin(6.2831*(t+0.66))
        );
      }
      vec3 gradViridis(float t){
        // simplified viridis approximation
        float r = 0.267 + 0.623*t - 0.126*t*t;
        float g = 0.004 + 1.130*t - 1.150*t*t + 0.280*t*t*t;
        float b = 0.329 + 0.750*t - 0.207*t*t;
        return clamp(vec3(r,g,b), 0.0, 1.0);
      }
      vec3 gradMagma(float t){
        // simplified magma approximation
        float r = 0.000 + 1.250*t - 0.250*t*t;
        float g = 0.000 + 0.600*t;
        float b = 0.200 + 0.700*t + 0.100*sin(6.2831*t);
        return clamp(vec3(r,g,b), 0.0, 1.0);
      }
      float sampleIntensity(){
        if (uUseDensityTex > 0.5) {
          vec4 s = texture2D(uDensityTex, vUV);
          if (uMetricMode < 0.5) return s.r; // density
          if (uMetricMode < 1.5) return s.g; // time
          if (uMetricMode < 2.5) return s.b; // accuracy
          return s.a; // energy
        }
        return vI;
      }
      vec3 palette(float t){
        if (uUseLUT > 0.5) { return texture2D(uLUT, vec2(t, 0.5)).rgb; }
        if (uPalette < 0.5) return gradBlueRed(t);
        if (uPalette < 1.5) return gradGreenYellow(t);
        if (uPalette < 2.5) return gradPlasma(t);
        if (uPalette < 3.5) return gradViridis(t);
        if (uPalette < 4.5) return gradMagma(t);
        // custom with stops
        if (uStopsCount <= 1) return mix(uCustomStart, uCustomEnd, t);
        // find segment
        int idx = 0;
        for (int i=0; i<7; i++){
          if (i < uStopsCount-1) {
            if (t >= uStopsPos[i] && t <= uStopsPos[i+1]) { idx = i; break; }
          }
        }
        float t0 = uStopsPos[idx];
        float t1 = uStopsPos[idx+1];
        vec3 c0 = uStopsCol[idx];
        vec3 c1 = uStopsCol[idx+1];
        float ft = (t - t0) / max(0.0001, (t1 - t0));
        return mix(c0, c1, clamp(ft, 0.0, 1.0));
      }
      void main(){
        float base = sampleIntensity();
        float t = clamp(base, 0.0, 1.0);
        vec3 col = palette(t);
        gl_FragColor = vec4(col, 0.65);
      }
    `
    const m = new THREE.ShaderMaterial({ vertexShader, fragmentShader, transparent: true, uniforms: {
      uPalette: { value: 0.0 }, uMin: { value: 0.0 }, uMax: { value: 1.0 }, uUseLUT: { value: 0.0 },
      uCustomStart: { value: new THREE.Color('#0a34cc').toArray() }, uCustomEnd: { value: new THREE.Color('#e21d19').toArray() },
      uStopsCount: { value: 0 }, uStopsPos: { value: new Array(MAX_STOPS).fill(0) }, uStopsCol: { value: new Array(MAX_STOPS).fill([0,0,0]) },
      uLUT: { value: null }, uUseDensityTex: { value: 0.0 }, uDensityTex: { value: null }, uMetricMode: { value: 0.0 },
    } as any })
    return m
  }, [])

  // Update palette uniform when selection changes
  React.useEffect(() => {
    if (!material) return
    const map: Record<any, number> = { 'blue-red': 0, 'green-yellow': 1, 'plasma': 2, 'viridis': 3, 'magma': 4, 'inferno': 6, 'custom': 5 }
    // @ts-ignore
    material.uniforms.uPalette.value = map[palette]
    const useLUT = palette === 'viridis' || palette === 'magma' || palette === 'plasma' || palette === 'inferno'
    // @ts-ignore
    material.uniforms.uUseLUT.value = useLUT ? 1.0 : 0.0
    // @ts-ignore
    material.uniforms.uLUT.value = useLUT ? lutTexture : null
    // @ts-ignore
    material.needsUpdate = true
  }, [material, palette, lutTexture])

  // Bind density texture
  React.useEffect(() => {
    if (!material) return
    const useDensity = !!densityTex
    // @ts-ignore
    material.uniforms.uUseDensityTex.value = useDensity ? 1.0 : 0.0
    // @ts-ignore
    material.uniforms.uDensityTex.value = densityTex
  }, [material, densityTex])

  // Metric mode uniform for texture channel selection
  React.useEffect(() => {
    if (!material) return
    const map: Record<any, number> = { density: 0, time: 1, accuracy: 2, energy: 3 }
    const code = map[metric]
    // @ts-ignore
    material.uniforms.uMetricMode.value = code
  }, [material, metric])

  // Update min/max and custom colors
  React.useEffect(() => {
    if (!material) return
    // @ts-ignore
    material.uniforms.uMin.value = minRange
    // @ts-ignore
    material.uniforms.uMax.value = maxRange
    // @ts-ignore
    material.uniforms.uCustomStart.value = new THREE.Color(customStart).toArray()
    // @ts-ignore
    material.uniforms.uCustomEnd.value = new THREE.Color(customEnd).toArray()
  }, [material, minRange, maxRange, customStart, customEnd])

  // Update custom stops uniforms when palette=custom
  React.useEffect(() => {
    if (!material) return
    if (palette !== 'custom') return
    const stops = [{ pos: 0, color: customStart }, ...customStops.sort((a,b)=>a.pos-b.pos), { pos: 1, color: customEnd }].slice(0, MAX_STOPS)
    const posArr = new Array(MAX_STOPS).fill(0)
    const colArr = new Array(MAX_STOPS).fill([0,0,0])
    stops.forEach((s, i) => {
      posArr[i] = s.pos
      const c = new THREE.Color(s.color)
      colArr[i] = c.toArray()
    })
    // @ts-ignore
    material.uniforms.uStopsCount.value = stops.length
    // @ts-ignore
    material.uniforms.uStopsPos.value = posArr
    // @ts-ignore
    material.uniforms.uStopsCol.value = colArr
    // @ts-ignore
    material.needsUpdate = true
  }, [material, palette, customStops, customStart, customEnd])

  // Update instance matrices + intensity attribute based on points/metric
  React.useEffect(() => {
    if (!ref.current) return
    const instGeom = ref.current.geometry as THREE.InstancedBufferGeometry
    const density = new Array(cells * cells).fill(0)
    const metricSum = new Array(cells * cells).fill(0)
    const metricCount = new Array(cells * cells).fill(0)
    const idx = (i: number, j: number) => i * cells + j
    points.forEach((p) => {
      const i = clamp(Math.floor(((p.x + 1) / 2) * cells), 0, cells - 1)
      const j = clamp(Math.floor(((p.z + 1) / 2) * cells), 0, cells - 1)
      const k = idx(i, j)
      density[k] += 1
      if (metric !== 'density') {
        const val = metric === 'time' ? (p.timeMs ?? 0) : metric === 'accuracy' ? (p.accuracy ?? 0) : (p.energy ?? 0)
        metricSum[k] += val
        metricCount[k] += 1
      }
    })
    // Build intensity per cell based on chosen metric
    let intensRaw = density
    if (metric !== 'density') {
      intensRaw = intensRaw.map((_, k) => (metricCount[k] ? metricSum[k] / metricCount[k] : 0))
      // normalize metric to reasonable ranges
      if (metric === 'time') {
        const maxV = Math.max(1, ...intensRaw)
        intensRaw = intensRaw.map((v) => v / maxV)
      } else if (metric === 'accuracy') {
        intensRaw = intensRaw.map((v) => Math.min(1, Math.max(0, v)))
      } else if (metric === 'energy') {
        const maxV = Math.max(1, ...intensRaw)
        intensRaw = intensRaw.map((v) => v / maxV)
      }
    } else {
      const maxD = Math.max(1, ...density)
      intensRaw = intensRaw.map((v) => v / maxD)
    }
    // Apply auto-scale
    let minAuto = 0, maxAuto = 1
    if (autoScale) {
      minAuto = intensRaw.reduce((a, b) => Math.min(a, b), 1)
      maxAuto = intensRaw.reduce((a, b) => Math.max(a, b), 0)
      if (maxAuto - minAuto < 1e-6) { minAuto = 0; maxAuto = 1 }
      // Update uniforms
      // @ts-ignore
      material.uniforms.uMin.value = minAuto
      // @ts-ignore
      material.uniforms.uMax.value = maxAuto
    }
    const intens = new Float32Array(instanceCount)
    for (let k = 0; k < instanceCount; k++) intens[k] = intensRaw[k]
    instGeom.setAttribute('aIntensity', new THREE.InstancedBufferAttribute(intens, 1))

    // prepare per-instance UV attribute once
    if (!instGeom.getAttribute('iuv')) {
      const uvs = new Float32Array(instanceCount * 2)
      let idx2 = 0
      for (let i = 0; i < cells; i++) {
        for (let j = 0; j < cells; j++) {
          uvs[idx2++] = (i + 0.5) / cells
          uvs[idx2++] = (j + 0.5) / cells
        }
      }
      instGeom.setAttribute('iuv', new THREE.InstancedBufferAttribute(uvs, 2))
    }

    const mat = new THREE.Matrix4()
    for (let k = 0; k < instanceCount; k++) {
      const v = density[k]
      const h = Math.min(0.6, v * 0.02)
      const [x, , z] = base.positions[k]
      mat.makeScale(2 / cells, h, 2 / cells)
      mat.setPosition(x, h / 2 - 0.001, z)
      ref.current.setMatrixAt(k, mat)
    }
    ref.current.instanceMatrix.needsUpdate = true
  }, [points, base, cells, instanceCount, metric, autoScale, material])

  return (
    <instancedMesh ref={ref} args={[undefined as any, undefined as any, instanceCount]}>
      <boxGeometry />
      <primitive attach="material" object={material} />
    </instancedMesh>
  )
}

// GPU density compute: render agent points as splats into an offscreen texture for heatmap sampling
// Multi-channel accumulation: R=density, G=time (normalized), B=accuracy, A=energy (normalized)
function DensityCompute({ points, onTexture }: { points: AgentPoint[]; onTexture: (t: THREE.Texture) => void }) {
  const { gl } = require('@react-three/fiber').useThree()
  const sceneRef = React.useRef(new THREE.Scene())
  const camRef = React.useRef(new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1))
  const rtRef = React.useRef<THREE.WebGLRenderTarget | null>(null)
  const meshRef = React.useRef<THREE.Points | null>(null)
  const res = 256

  React.useEffect(() => {
    rtRef.current = new THREE.WebGLRenderTarget(res, res, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, wrapS: THREE.ClampToEdgeWrapping, wrapT: THREE.ClampToEdgeWrapping })
    const geo = new THREE.BufferGeometry()
    const max = Math.max(1, points.length)
    const positions = new Float32Array(max * 3)
    const metrics = new Float32Array(max * 4)
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('metric', new THREE.BufferAttribute(metrics, 4))
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      vertexShader: `
        attribute vec3 position; attribute vec4 metric;
        varying vec4 vM;
        void main(){
          vM = metric;
          gl_Position = vec4(position.xy, 0.0, 1.0);
          gl_PointSize = 2.0;
        }`,
      fragmentShader: `
        precision mediump float; varying vec4 vM;
        void main(){
          float d = length(gl_PointCoord - vec2(0.5));
          float w = exp(-16.0*d*d);
          vec4 col = vM * w;
          gl_FragColor = col;
        }`,
    })
    const pts = new THREE.Points(geo, mat)
    meshRef.current = pts
    sceneRef.current.add(pts)
  }, [])

  require('@react-three/fiber').useFrame(() => {
    if (!rtRef.current || !meshRef.current) return
    // map agent x,z in [-1,1] to clip-space
    const attr = meshRef.current.geometry.getAttribute('position') as THREE.BufferAttribute
    const arr = attr.array as Float32Array
    const marr = (meshRef.current.geometry.getAttribute('metric') as THREE.BufferAttribute).array as Float32Array
    const N = Math.min(points.length, arr.length / 3)
    for (let i = 0; i < N; i++) {
      const p = points[i]
      arr[i*3+0] = THREE.MathUtils.clamp(p.x, -1, 1)
      arr[i*3+1] = THREE.MathUtils.clamp(p.z, -1, 1)
      arr[i*3+2] = 0
      // normalize metrics: time to ~[0,1] using 10s window; accuracy already ~[0,1]; energy scaled by 200
      const tn = Math.min(1, Math.max(0, (p.timeMs ?? 0) / 10000))
      const an = Math.min(1, Math.max(0, (p.accuracy ?? 0)))
      const en = Math.min(1, Math.max(0, (p.energy ?? 0) / 200))
      marr[i*4+0] = 1.0 // density weight
      marr[i*4+1] = tn
      marr[i*4+2] = an
      marr[i*4+3] = en
    }
    attr.needsUpdate = true
    ;(meshRef.current.geometry.getAttribute('metric') as THREE.BufferAttribute).needsUpdate = true
    gl.setRenderTarget(rtRef.current)
    gl.clearColor()
    gl.clear(true, true, true)
    gl.render(sceneRef.current, camRef.current)
    gl.setRenderTarget(null)
    onTexture(rtRef.current.texture)
  })

  return null
}

// GPU Vector Field using density texture gradient for orientation
function VectorFieldGPU({ densityTex, gradientTex, cells = 16 }: { densityTex: THREE.Texture; gradientTex?: THREE.Texture | null; cells?: number }) {
  const { gl, scene, camera } = require('@react-three/fiber').useThree()
  const ref = React.useRef<THREE.InstancedMesh>(null)
  React.useEffect(() => {
    if (!ref.current) return
    const instGeom = ref.current.geometry as THREE.InstancedBufferGeometry
    const count = cells * cells
    // per-instance attributes: iuv, ipos
    const iuv = new Float32Array(count * 2)
    const ipos = new Float32Array(count * 3)
    let k = 0
    for (let i = 0; i < cells; i++) {
      for (let j = 0; j < cells; j++) {
        const u = (i + 0.5) / cells
        const v = (j + 0.5) / cells
        iuv[k*2+0] = u; iuv[k*2+1] = v
        // map to world [-1,1]
        ipos[k*3+0] = (i / cells) * 2 - 1
        ipos[k*3+1] = 0.02
        ipos[k*3+2] = (j / cells) * 2 - 1
        k++
      }
    }
    instGeom.setAttribute('iuv', new THREE.InstancedBufferAttribute(iuv, 2))
    instGeom.setAttribute('ipos', new THREE.InstancedBufferAttribute(ipos, 3))
  }, [cells])

  const material = React.useMemo(() => {
    const vs = `
      attribute vec3 position; attribute vec2 iuv; attribute vec3 ipos;
      uniform sampler2D uDensityTex; uniform sampler2D uGradientTex; uniform float uTexSize; uniform float uUseGradientTex;
      varying vec3 vColor;
      mat3 rotFromAxisAngle(vec3 axis, float angle){
        float s = sin(angle), c = cos(angle); float oc = 1.0 - c;
        return mat3(
          oc*axis.x*axis.x + c,        oc*axis.x*axis.y - axis.z*s, oc*axis.z*axis.x + axis.y*s,
          oc*axis.x*axis.y + axis.z*s, oc*axis.y*axis.y + c,        oc*axis.y*axis.z - axis.x*s,
          oc*axis.z*axis.x - axis.y*s, oc*axis.y*axis.z + axis.x*s, oc*axis.z*axis.z + c
        );
      }
      void main(){
        vec2 g;
        if (uUseGradientTex > 0.5) {
          vec3 v = texture2D(uGradientTex, iuv).rgb;
          g = vec2(v.r * 2.0 - 1.0, v.g * 2.0 - 1.0);
        } else {
          float dx = 1.0 / uTexSize;
          float dz = 1.0 / uTexSize;
          float rpx = texture2D(uDensityTex, iuv + vec2(dx,0.0)).r;
          float rmx = texture2D(uDensityTex, iuv - vec2(dx,0.0)).r;
          float rpz = texture2D(uDensityTex, iuv + vec2(0.0,dz)).r;
          float rmz = texture2D(uDensityTex, iuv - vec2(0.0,dz)).r;
          g = vec2(rpx - rmx, rpz - rmz);
        }
        vec3 dir = normalize(vec3(g.x, 0.0, g.y));
        if (!all(greaterThan(abs(dir), vec3(0.0001)))) dir = vec3(0.0,1.0,0.0);
        vec3 up = vec3(0.0,1.0,0.0);
        float c = clamp(dot(up, dir), -1.0, 1.0);
        float ang = acos(c);
        vec3 axis = normalize(cross(up, dir));
        if (length(axis) < 0.0001) axis = vec3(1.0,0.0,0.0);
        mat3 R = rotFromAxisAngle(axis, ang);
        // base geometry is unit cylinder aligned with Y; apply rotation and scale
        float len = clamp(length(g)*5.0, 0.05, 0.3);
        vec3 p = position; p.y *= len; p *= 0.01;
        p = R * p;
        p += ipos;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        vColor = vec3(1.0, 1.0 - clamp(len*3.0,0.0,1.0), 0.3);
      }`
    const fs = `
      precision mediump float; varying vec3 vColor;
      void main(){ gl_FragColor = vec4(vColor, 0.9); }
    `
    return new THREE.ShaderMaterial({ vertexShader: vs, fragmentShader: fs, transparent: true })
  }, [])

  React.useEffect(() => {
    if (!ref.current) return
    // @ts-ignore
    ref.current.material.uniforms = { uDensityTex: { value: densityTex }, uGradientTex: { value: gradientTex || null }, uUseGradientTex: { value: gradientTex ? 1.0 : 0.0 }, uTexSize: { value: 256.0 } }
    // @ts-ignore
    ref.current.material.needsUpdate = true
  }, [densityTex, gradientTex])

  return (
    <instancedMesh ref={ref} args={[undefined as any, undefined as any, cells * cells]}>
      <cylinderGeometry args={[1,1,1,6]} />
      <primitive object={material} attach="material" />
    </instancedMesh>
  )
}

// WebGPU density accumulation via compute shader (fallbacks to no-op if WebGPU unavailable)
function WebGPUComputeDensity({ points, onTextures, size = 512 }: { points: AgentPoint[]; onTextures: (d: THREE.Texture, g: THREE.Texture | null) => void; size?: number }) {
  const [supported, setSupported] = React.useState(false)
  React.useEffect(() => { setSupported(!!(navigator as any).gpu) }, [])
  const texRef = React.useRef<THREE.DataTexture | null>(null)
  const gradRef = React.useRef<THREE.DataTexture | null>(null)
  const res = size

  React.useEffect(() => {
    if (!supported) return
    let cancelled = false
    let device: GPUDevice
    let queue: GPUQueue
    let outTex: GPUTexture
    let gradTex: GPUTexture
    let outBuf: GPUBuffer
    let gradBuf: GPUBuffer
    let pointBuf: GPUBuffer

    const init = async () => {
      const adapter = await (navigator as any).gpu.requestAdapter()
      if (!adapter) return
      device = await adapter.requestDevice()
      queue = device.queue

      // Create output texture RGBA8
      outTex = device.createTexture({
        size: [res, res, 1],
        format: 'rgba8unorm',
        usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_SRC | GPUTextureUsage.TEXTURE_BINDING,
      })

      gradTex = device.createTexture({
        size: [res, res, 1],
        format: 'rg8unorm',
        usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_SRC | GPUTextureUsage.TEXTURE_BINDING,
      })

      // Buffer to read back texture
      outBuf = device.createBuffer({
        size: res * res * 4,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
      })

      gradBuf = device.createBuffer({
        size: res * res * 2,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
      })

      // Create point buffer (x,z,t,a,e) normalized in [-1,1] / [0,1]
      const maxPoints = Math.max(1, points.length)
      const pointStride = 5
      const arr = new Float32Array(maxPoints * pointStride)
      for (let i = 0; i < maxPoints; i++) {
        const p = points[i] || { x: 0, z: 0, timeMs: 0, accuracy: 0.5, energy: 0 }
        arr[i*pointStride+0] = Math.max(-1, Math.min(1, p.x))
        arr[i*pointStride+1] = Math.max(-1, Math.min(1, p.z))
        arr[i*pointStride+2] = Math.min(1, Math.max(0, (p.timeMs ?? 0) / 10000))
        arr[i*pointStride+3] = Math.min(1, Math.max(0, (p.accuracy ?? 0)))
        arr[i*pointStride+4] = Math.min(1, Math.max(0, (p.energy ?? 0) / 200))
      }
      pointBuf = device.createBuffer({
        size: arr.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        mappedAtCreation: true,
      })
      new Float32Array(pointBuf.getMappedRange()).set(arr)
      pointBuf.unmap()

      const module = device.createShaderModule({ code: `
        struct Point { x: f32, z: f32, t: f32, a: f32, e: f32 };
        @group(0) @binding(0) var<storage, read> points: array<Point>;
        @group(0) @binding(1) var outImg: texture_storage_2d<rgba8unorm, write>;
        @group(0) @binding(2) var<uniform> uSize: vec2<f32>;

        // Accumulate per-pixel by looping points (O(N*M) but GPU parallel over pixels)
        @compute @workgroup_size(8,8)
        fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
          if (gid.x >= u32(uSize.x) || gid.y >= u32(uSize.y)) { return; }
          let uv = (vec2<f32>(gid.xy) + vec2<f32>(0.5,0.5)) / uSize;
          // map to world [-1,1]
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
          // normalize to 0..1 (simple clamp)
          let col = vec4<f32>(r, g, b, a);
          let maxv = max(1.0, max(col.x, max(col.y, max(col.z, col.w))));
          let outv = clamp(col / maxv, vec4<f32>(0.0), vec4<f32>(1.0));
          textureStore(outImg, vec2<i32>(i32(gid.x), i32(gid.y)), outv);
        }
      ` })

      const pipeline = device.createComputePipeline({
        layout: 'auto',
        compute: { module, entryPoint: 'main' },
      })

      // Gradient compute:
      const gradModule = device.createShaderModule({ code: `
        @group(0) @binding(0) var src: texture_2d<f32>;
        @group(0) @binding(1) var dst: texture_storage_2d<rg8unorm, write>;
        @group(0) @binding(2) var<uniform> uSize: vec2<f32>;
        fn sample(x: i32, y: i32) -> f32 {
          let uv = (vec2<f32>(f32(x), f32(y)) + vec2<f32>(0.5,0.5)) / uSize;
          return textureSampleLevel(src, textureSampler, uv, 0.0).r;
        }
        @compute @workgroup_size(16,16)
        fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
          let x = i32(gid.x); let y = i32(gid.y);
          if (x >= i32(uSize.x) || y >= i32(uSize.y)) { return; }
          let dx = 1;
          let dy = 1;
          let rpx = sample(x+dx, y);
          let rmx = sample(x-dx, y);
          let rpz = sample(x, y+dy);
          let rmz = sample(x, y-dy);
          let gx = rpx - rmx;
          let gy = rpz - rmz;
          // pack normalized gradient into 0..1 for rg8
          let mag = max(1e-5, sqrt(gx*gx + gy*gy));
          let nx = clamp(gx / mag * 0.5 + 0.5, 0.0, 1.0);
          let ny = clamp(gy / mag * 0.5 + 0.5, 0.0, 1.0);
          textureStore(dst, vec2<i32>(x,y), vec4<f32>(nx, ny, 0.0, 1.0));
        }
      ` })
      // Note: textureSampler requires a sampler binding in WGSL; for simplicity use textureLoad if supported.
      // In practice you would provide a separate sampler binding and sample with it.
      const gradPipeline = device.createComputePipeline({ layout: 'auto', compute: { module: gradModule, entryPoint: 'main' } })

      const uBuf = device.createBuffer({ size: 8, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST })
      const bind = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: { buffer: pointBuf } },
          { binding: 1, resource: outTex.createView() },
          { binding: 2, resource: { buffer: uBuf } },
        ],
      })

      const uBuf2 = device.createBuffer({ size: 8, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST })
      const gradBind = device.createBindGroup({
        layout: gradPipeline.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: outTex.createView() },
          { binding: 1, resource: gradTex.createView() },
          { binding: 2, resource: { buffer: uBuf2 } },
        ],
      })

      // Create three.js DataTexture to receive readback and pass into pipeline
      const texData = new Uint8Array(res * res * 4)
      const threeTex = new THREE.DataTexture(texData, res, res, THREE.RGBAFormat)
      threeTex.needsUpdate = true
      threeTex.minFilter = THREE.LinearFilter
      threeTex.magFilter = THREE.LinearFilter
      threeTex.wrapS = THREE.ClampToEdgeWrapping
      threeTex.wrapT = THREE.ClampToEdgeWrapping
      texRef.current = threeTex
      const gData = new Uint8Array(res * res * 2)
      const gTex = new THREE.DataTexture(gData, res, res, THREE.LuminanceAlphaFormat)
      gTex.needsUpdate = true
      gTex.minFilter = THREE.LinearFilter
      gTex.magFilter = THREE.LinearFilter
      gTex.wrapS = THREE.ClampToEdgeWrapping
      gTex.wrapT = THREE.ClampToEdgeWrapping
      gradRef.current = gTex
      onTextures(threeTex, gTex)

      const tick = async () => {
        if (cancelled) return
        // Update points buffer
        const arr2 = new Float32Array(points.length * 5)
        for (let i = 0; i < points.length; i++) {
          const p = points[i]
          arr2[i*5+0] = Math.max(-1, Math.min(1, p.x))
          arr2[i*5+1] = Math.max(-1, Math.min(1, p.z))
          arr2[i*5+2] = Math.min(1, Math.max(0, (p.timeMs ?? 0) / 10000))
          arr2[i*5+3] = Math.min(1, Math.max(0, (p.accuracy ?? 0)))
          arr2[i*5+4] = Math.min(1, Math.max(0, (p.energy ?? 0) / 200))
        }
        const tmp = device.createBuffer({ size: arr2.byteLength, usage: GPUBufferUsage.COPY_SRC, mappedAtCreation: true })
        new Float32Array(tmp.getMappedRange()).set(arr2); tmp.unmap()
        const enc = device.createCommandEncoder()
        enc.copyBufferToTexture({ buffer: tmp, bytesPerRow: arr2.byteLength, rowsPerImage: 1 }, { texture: outTex }, [0,0,1]) // dummy to silence unused
        enc.copyBufferToBuffer(tmp, 0, pointBuf, 0, arr2.byteLength)
        device.queue.submit([enc.finish()])

        device.queue.writeBuffer(uBuf, 0, new Float32Array([res, res]).buffer)
        device.queue.writeBuffer(uBuf2, 0, new Float32Array([res, res]).buffer)

        const cmd = device.createCommandEncoder()
        const pass = cmd.beginComputePass()
        pass.setPipeline(pipeline)
        pass.setBindGroup(0, bind)
        pass.dispatchWorkgroups(Math.ceil(res/8), Math.ceil(res/8), 1)
        pass.end()
        // Copy texture to buffer for readback
        cmd.copyTextureToBuffer({ texture: outTex }, { buffer: outBuf, bytesPerRow: res*4, rowsPerImage: res }, [res, res, 1])
        // Run density compute
        device.queue.submit([cmd.finish()])

        // Run gradient compute pass
        const cmd2 = device.createCommandEncoder()
        const pass2 = cmd2.beginComputePass()
        pass2.setPipeline(gradPipeline)
        pass2.setBindGroup(0, gradBind)
        pass2.dispatchWorkgroups(Math.ceil(res/16), Math.ceil(res/16), 1)
        pass2.end()
        cmd2.copyTextureToBuffer({ texture: gradTex }, { buffer: gradBuf, bytesPerRow: res*2, rowsPerImage: res }, [res, res, 1])
        device.queue.submit([cmd2.finish()])

        await outBuf.mapAsync(GPUMapMode.READ)
        const copy = new Uint8Array(outBuf.getMappedRange())
        texData.set(copy)
        threeTex.needsUpdate = true
        outBuf.unmap()
        // Map gradient buffer
        await gradBuf.mapAsync(GPUMapMode.READ)
        const gcopy = new Uint8Array(gradBuf.getMappedRange())
        gData.set(gcopy)
        gTex.needsUpdate = true
        gradBuf.unmap()
        tmp.destroy()
        if (!cancelled) requestAnimationFrame(tick as any)
      }
      requestAnimationFrame(tick as any)
    }
    init()
    return () => { cancelled = true }
  }, [supported, points])

  return null
}

// Build a 1D DataTexture LUT for viridis/magma using approximations (256 samples)
function createLUTTexture(palette: string) {
  const size = 256
  const data = new Uint8Array(size * 3)
  for (let i = 0; i < size; i++) {
    const t = i / (size - 1)
    let r = 0, g = 0, b = 0
    if (palette === 'viridis') {
      r = Math.max(0, Math.min(1, 0.267 + 0.623*t - 0.126*t*t))
      g = Math.max(0, Math.min(1, 0.004 + 1.130*t - 1.150*t*t + 0.280*t*t*t))
      b = Math.max(0, Math.min(1, 0.329 + 0.750*t - 0.207*t*t))
    } else if (palette === 'magma') {
      r = Math.max(0, Math.min(1, 0.000 + 1.250*t - 0.250*t*t))
      g = Math.max(0, Math.min(1, 0.000 + 0.600*t))
      b = Math.max(0, Math.min(1, 0.200 + 0.700*t + 0.100*Math.sin(6.2831*t)))
    } else {
      r = t; g = 0.2 + 0.6*(1.0 - Math.abs(0.5 - t)*2.0); b = 1.0 - t
    }
    data[i*3+0] = Math.round(r * 255)
    data[i*3+1] = Math.round(g * 255)
    data[i*3+2] = Math.round(b * 255)
  }
  const tex = new THREE.DataTexture(data, size, 1, THREE.RGBFormat)
  tex.needsUpdate = true
  tex.minFilter = THREE.LinearFilter
  tex.magFilter = THREE.LinearFilter
  tex.wrapS = THREE.ClampToEdgeWrapping
  tex.wrapT = THREE.ClampToEdgeWrapping
  return tex
}

function PerformanceField({ points, metric }: { points: AgentPoint[]; metric: 'density' | 'time' | 'accuracy' | 'energy' }) {
  // Derive a coarse vector field from intensity gradients
  const cells = 16
  const count = cells * cells
  const ref = React.useRef<THREE.InstancedMesh>(null)

  React.useEffect(() => {
    if (!ref.current) return
    const field = new Array(cells).fill(0).map(() => new Array(cells).fill(0))
    const idx = (i: number, j: number) => i * cells + j
    const accum = new Array(cells * cells).fill(0)
    const cnt = new Array(cells * cells).fill(0)
    points.forEach((p) => {
      const i = clamp(Math.floor(((p.x + 1) / 2) * cells), 0, cells - 1)
      const j = clamp(Math.floor(((p.z + 1) / 2) * cells), 0, cells - 1)
      const k = idx(i, j)
      if (metric === 'density') { accum[k] += 1; cnt[k] += 1 }
      else if (metric === 'time') { accum[k] += (p.timeMs ?? 0); cnt[k] += 1 }
      else if (metric === 'accuracy') { accum[k] += (p.accuracy ?? 0); cnt[k] += 1 }
      else { accum[k] += (p.energy ?? 0); cnt[k] += 1 }
    })
    // average and normalize
    let maxV = 1
    for (let i = 0; i < cells; i++) for (let j = 0; j < cells; j++) {
      const k = idx(i, j)
      const v = cnt[k] ? accum[k] / cnt[k] : 0
      field[i][j] = v
      maxV = Math.max(maxV, v)
    }
    for (let i = 0; i < cells; i++) for (let j = 0; j < cells; j++) field[i][j] /= maxV

    const mat = new THREE.Matrix4()
    const quat = new THREE.Quaternion()
    const scale = new THREE.Vector3()
    const yAxis = new THREE.Vector3(0, 1, 0)
    const color = new THREE.Color()
    let idxInst = 0
    for (let i = 1; i < cells - 1; i++) {
      for (let j = 1; j < cells - 1; j++) {
        const dx = field[i + 1][j] - field[i - 1][j]
        const dz = field[i][j + 1] - field[i][j - 1]
        const dir = new THREE.Vector3(dx, 0, dz)
        const len = Math.min(0.3, dir.length())
        if (len < 1e-3) continue
        const x = (i / cells) * 2 - 1
        const z = (j / cells) * 2 - 1
        const from = new THREE.Vector3(x, 0.02, z)
        const to = from.clone().add(dir.normalize().multiplyScalar(0.2))
        const mid = from.clone().add(to).multiplyScalar(0.5)
        quat.setFromUnitVectors(yAxis, to.clone().sub(from).normalize())
        scale.set(0.008, 0.1, 0.008)
        mat.compose(mid, quat, scale)
        ref.current!.setMatrixAt(idxInst, mat)
        color.setHSL(Math.max(0, 0.66 - len * 2), 0.8, 0.5)
        // @ts-ignore
        ref.current!.setColorAt?.(idxInst, color)
        idxInst++
      }
    }
    ref.current.count = idxInst
    ref.current.instanceMatrix.needsUpdate = true
    // @ts-ignore
    ref.current.instanceColor && (ref.current.instanceColor.needsUpdate = true)
  }, [points, metric])

  return (
    <instancedMesh ref={ref} args={[undefined as any, undefined as any, cells * cells]}>
      <cylinderGeometry args={[1, 1, 1, 6]} />
      <meshStandardMaterial vertexColors opacity={0.7} transparent />
    </instancedMesh>
  )
}

function Vectors({ prev, next }: { prev: Record<string, AgentPoint>; next: Record<string, AgentPoint> }) {
  // Instanced arrows (shafts + cones) representing displacement vectors
  const ids = React.useMemo(() => Object.keys(next), [next])
  const shaftRef = React.useRef<THREE.InstancedMesh>(null)
  const headRef = React.useRef<THREE.InstancedMesh>(null)

  React.useEffect(() => {
    const shaft = shaftRef.current
    const head = headRef.current
    if (!shaft || !head) return
    const mat = new THREE.Matrix4()
    const quat = new THREE.Quaternion()
    const scale = new THREE.Vector3()
    const yAxis = new THREE.Vector3(0, 1, 0)
    let idx = 0
    ids.forEach((id) => {
      const a = prev[id]
      const b = next[id]
      if (!a || !b) return
      const from = new THREE.Vector3(a.x, a.y, a.z)
      const to = new THREE.Vector3(b.x, b.y, b.z)
      const dir = new THREE.Vector3().subVectors(to, from)
      const len = Math.max(1e-4, dir.length())
      const mid = new THREE.Vector3().addVectors(from, to).multiplyScalar(0.5)
      const n = dir.clone().normalize()

      // Shaft (cylinder)
      quat.setFromUnitVectors(yAxis, n)
      scale.set(0.01, len / 2, 0.01)
      mat.compose(mid, quat, scale)
      shaft.setMatrixAt(idx, mat)
      const c = new THREE.Color().setHSL(Math.max(0, 0.66 - Math.min(0.66, len * 2)), 0.8, 0.5)
      // @ts-ignore
      shaft.setColorAt?.(idx, c)

      // Head (cone) at end
      const headPos = from.clone().add(n.clone().multiplyScalar(len))
      const headScale = Math.max(0.04, Math.min(0.12, len * 0.3))
      scale.set(headScale, headScale, headScale)
      mat.compose(headPos, quat, scale)
      head.setMatrixAt(idx, mat)
      // @ts-ignore
      head.setColorAt?.(idx, c)
      idx++
    })
    shaft.count = idx
    head.count = idx
    shaft.instanceMatrix.needsUpdate = true
    head.instanceMatrix.needsUpdate = true
    // @ts-ignore
    shaft.instanceColor && (shaft.instanceColor.needsUpdate = true)
    // @ts-ignore
    head.instanceColor && (head.instanceColor.needsUpdate = true)
    // update prev snapshot after applying
    Object.assign(prev, next)
  }, [ids, next, prev])

  const count = Math.max(1, ids.length)
  return (
    <group>
      <instancedMesh ref={shaftRef} args={[undefined as any, undefined as any, count]}>
        <cylinderGeometry args={[1, 1, 1, 6]} />
        <meshStandardMaterial vertexColors opacity={0.7} transparent />
      </instancedMesh>
      <instancedMesh ref={headRef} args={[undefined as any, undefined as any, count]}>
        <coneGeometry args={[1, 1, 8]} />
        <meshStandardMaterial vertexColors opacity={0.9} transparent />
      </instancedMesh>
    </group>
  )
}

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)) }

// Simple palette editor modal with draggable stops over a gradient bar
function PaletteEditorModal({ start, end, stops, onClose, onChange }: {
  start: string; end: string; stops: Array<{ pos: number; color: string }>; onClose: () => void; onChange: (stops: Array<{ pos: number; color: string }>) => void
}) {
  const barRef = React.useRef<HTMLDivElement>(null)
  const [dragIdx, setDragIdx] = React.useState<number | null>(null)

  const onMouseMove = (e: React.MouseEvent) => {
    if (dragIdx === null) return
    const el = barRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    let t = (e.clientX - rect.left) / rect.width
    t = Math.max(0, Math.min(1, t))
    onChange(stops.map((s, i) => i === dragIdx ? { ...s, pos: t } : s))
  }
  const onMouseUp = () => setDragIdx(null)

  React.useEffect(() => {
    const up = () => setDragIdx(null)
    window.addEventListener('mouseup', up)
    return () => window.removeEventListener('mouseup', up)
  }, [])

  const gradientCSS = `linear-gradient(90deg, ${start} 0%, ${stops.map(s => `${s.color} ${Math.round(s.pos*100)}%`).join(', ')}, ${end} 100%)`

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onMouseMove={onMouseMove} onMouseUp={onMouseUp}>
      <div className="bg-zinc-900 border border-zinc-700 rounded p-4 w-[600px]">
        <div className="text-sm font-semibold mb-3">Palette Editor</div>
        <div ref={barRef} className="relative h-6 rounded mb-3" style={{ background: gradientCSS }}>
          {stops.map((s, i) => (
            <div key={i}
                 className="absolute top-[-4px] w-3 h-3 border border-white rounded-full cursor-ew-resize"
                 style={{ left: `${s.pos * 100}%`, background: s.color, transform: 'translateX(-50%)' }}
                 onMouseDown={() => setDragIdx(i)} />
          ))}
        </div>
        <div className="max-h-40 overflow-auto mb-3">
          {stops.map((s, i) => (
            <div key={i} className="flex items-center gap-2 mb-2">
              <span className="text-xs text-zinc-400 w-10">{s.pos.toFixed(2)}</span>
              <input type="color" value={s.color} onChange={(e) => onChange(stops.map((x, idx) => idx===i?{...x, color:e.target.value}:x))} />
              <button className="px-2 py-0.5 border border-zinc-700 rounded" onClick={() => onChange(stops.filter((_, idx) => idx!==i))}>Remove</button>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 justify-between">
          <button className="px-2 py-0.5 border border-zinc-700 rounded" onClick={() => onChange([...stops, { pos: 0.5, color: '#ffffff' }])}>Add Stop</button>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 border border-zinc-700 rounded" onClick={onClose}>Close</button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="px-2 py-0.5 border border-zinc-700 rounded"
            onClick={async () => {
              try {
                const res = await fetch('/api/neuro/ws/token')
                const json = await res.json()
                if (json?.ok && json?.token) {
                  setWsToken(json.token)
                  const proto = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss' : 'ws'
                  const url = `${proto}://${window.location.host}/api/neuro/metrics?topic=${encodeURIComponent(`agent/${agentId}/metrics`)}&token=${json.token}`
                  setWsUrl(url)
                }
              } catch (e) {
                console.error('ws token', e)
              }
            }}
          >Get WS Token</button>
          {wsUrl && (
            <>
              <span className="text-zinc-400 hidden md:inline">{wsUrl}</span>
              <button
                className="px-2 py-0.5 border border-zinc-700 rounded"
                onClick={async () => {
                  try {
                    if (!wsUrl) return
                    await navigator.clipboard.writeText(wsUrl)
                  } catch (e) {
                    console.error('copy failed', e)
                  }
                }}
              >Copy WS URL</button>
              <button
                className="px-2 py-0.5 border border-zinc-700 rounded"
                onClick={() => {
                  try {
                    if (!wsUrl) return
                    setWsStatus('connecting')
                    const ws = new WebSocket(wsUrl)
                    ws.onopen = () => setWsStatus('open')
                    ws.onclose = () => setWsStatus('closed')
                    ws.onerror = () => setWsStatus('error')
                  } catch {
                    setWsStatus('error')
                  }
                }}
              >Test WS</button>
              <span className="text-zinc-400">Status: {wsStatus}</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
