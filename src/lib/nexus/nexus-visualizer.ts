// src/lib/nexus/nexus-visualizer.ts
// Phase 17B — Nexus Visualization Bridge (Master Compositor)
// No schema rewrites — integration/telemetry/render only.

import * as THREE from 'three';
import { Clock, WebGLRenderer, Scene, PerspectiveCamera, Group, Texture } from 'three';

// ── Glyph System (canonical types/ids/colors) ───────────────────────────────────
import {
  GlyphNode,
  LabDomain,
  LabId,
  getAllLabs,            // () => GlyphNode[]  (schema-provided canonical node list)
} from '@/lib/glyph/schema';

// ── Anim Spec (normalized curves + helpers) ─────────────────────────────────────
import {
  getPulseScale,         // (latency: number, t: number) => number
  getWarpRotation,       // (risk: number, t: number) => number
  getDriftOffset,        // (complexity: number, t: number) => THREE.Vector3
} from '@/lib/glyph/animSpec';

// ── R3F-free animator bridge (headless) ─────────────────────────────────────────
// TODO: NexusGlyphAnimator needs to be refactored as a class, not a React component
// import { NexusGlyphAnimator } from '@/components/nexus/NexusGlyphAnimator';
// Expected API:
//   new NexusGlyphAnimator(scene: THREE.Scene, glyphRoot: THREE.Group)
//   animator.update(nodes: GlyphNode[], etsByLab: Record<LabId, ETS>, t: number): void

// Temporary placeholder class until refactored
class NexusGlyphAnimator {
  constructor(scene: THREE.Scene, glyphRoot: THREE.Group) {}
  update(nodes: GlyphNode[], etsByLab: Record<LabId, any>, t: number): void {}
  dispose(): void {}
}

// ── Lab Swarm Simulator (100k agents + entropy field) ───────────────────────────
import {
  createSimulator,
// Expected API:
//   createSimulator(params) → {
//     update(dt: number): void,
//     setETSWeights(etsByLab: Record<LabId, ETS>): void,
//     getEntropyTexture(): THREE.Texture, // dynamic heatmap texture
//     dispose(): void
//   }
} from '@/lib/labfidelity/simulator';

// ── Telemetry / Logging ─────────────────────────────────────────────────────────
import { getFirestoreInstance } from '@/lib/firebase';
import {
  collection, query, onSnapshot, Unsubscribe, DocumentData,
} from 'firebase/firestore';

import { VaultLogger } from '@/lib/vault/vault-logger';
import eventBus from '@/lib/EventBus';

// ── Local types ─────────────────────────────────────────────────────────────────
export type ETS = {
  latency: number;     // 0..1
  risk: number;        // 0..1
  complexity: number;  // 0..1
};

type ETSByLab = Partial<Record<LabId, ETS>>;

type NexusVisualizerOptions = {
  fov?: number;
  near?: number;
  far?: number;
  pixelRatioCap?: number; // to guard perf on hiDPI
  background?: number;    // THREE.Color numeric
  entropyOpacity?: number;
  logIntervalSec?: number; // how often to vaultLog summaries
};

const DEFAULTS: Required<NexusVisualizerOptions> = {
  fov: 45,
  near: 0.1,
  far: 2000,
  pixelRatioCap: 1.75,
  background: 0x0b0f14,
  entropyOpacity: 0.6,
  logIntervalSec: 10,
};

export class NexusVisualizer {
  private container: HTMLElement | null = null;
  private renderer!: WebGLRenderer;
  private scene!: Scene;
  private camera!: PerspectiveCamera;
  private clock = new Clock();
  private rafId: number | null = null;

  private root = new Group();            // world root
  private glyphRoot = new Group();       // glyph sub-tree
  private entropyQuad?: THREE.Mesh;      // overlay mesh
  private entropyMat?: THREE.MeshBasicMaterial;

  private animator!: NexusGlyphAnimator;
  private simulator: ReturnType<typeof createSimulator> | null = null;

  private labs: GlyphNode[] = [];
  private etsByLab: ETSByLab = {};
  private unsub: Unsubscribe | null = null;

  private latencyThreshold: number = 75;

  private opts: Required<NexusVisualizerOptions>;
  private lastLogT = 0;

  constructor(opts?: NexusVisualizerOptions) {
    this.opts = { ...DEFAULTS, ...(opts ?? {}) };

    eventBus.on('control_change', (data: any) => {
      if (data.control === 'latencyThreshold') {
        this.latencyThreshold = data.value;
      }
    });
  }

  /** Mounts Three renderer into a DOM container and starts rendering */
  mount = (container: HTMLElement) => {
    if (this.container) throw new Error('NexusVisualizer is already mounted.');
    this.container = container;

    // ── Renderer ────────────────────────────────────────────────────────────────
    this.renderer = new WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setClearColor(this.opts.background, 1);
    const pr = Math.min(window.devicePixelRatio || 1, this.opts.pixelRatioCap);
    this.renderer.setPixelRatio(pr);
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(this.renderer.domElement);

    // ── Scene & Camera ─────────────────────────────────────────────────────────
    this.scene = new Scene();
    this.camera = new PerspectiveCamera(
      this.opts.fov,
      container.clientWidth / container.clientHeight,
      this.opts.near,
      this.opts.far,
    );
    this.camera.position.set(0, 0, 64);

    // ── World graph ────────────────────────────────────────────────────────────
    this.scene.add(this.root);
    this.root.add(this.glyphRoot);

    // ── Data bootstrap ─────────────────────────────────────────────────────────
    this.labs = getAllLabs();                 // canonical node list (no schema mutations)
    this.etsByLab = this.seedETS(this.labs);  // start with safe defaults

    // ── Subsystems ─────────────────────────────────────────────────────────────
    this.animator = new NexusGlyphAnimator(this.scene, this.glyphRoot);
    this.simulator = createSimulator({
      maxAgents: 100_000,
      bounds: { x: 0, y: 0, width: 256, height: 256 },
      entropyGridSize: 512,
    });
    // TODO: Convert etsByLab to swarm weights
    // this.simulator.setETSWeights(this.etsByLab);

    // Entropy heatmap plane (screen-aligned, z-sorted behind glyphs)
    this.setupEntropyOverlay(this.simulator.getEntropyTexture());

    // Firestore stream: lab_telemetry
    this.beginTelemetryStream();

    // Start loop
    this.clock.start();
    this.tick();
    this.onResize = this.onResize.bind(this);
    window.addEventListener('resize', this.onResize);
  };

  /** Cleanly tears down everything */
  dispose = () => {
    if (!this.container) return;

    window.removeEventListener('resize', this.onResize);
    if (this.unsub) { this.unsub(); this.unsub = null; }

    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    if (this.simulator) {
      this.simulator.dispose();
      this.simulator = null;
    }

    if (this.entropyMat) {
      this.entropyMat.dispose();
      this.entropyMat = undefined;
    }

    this.renderer.dispose();
    this.container.removeChild(this.renderer.domElement);
    this.container = null;
  };

  /** Manual ETS update (optional programmatic injection) */
  setETS = (etsByLab: Partial<ETSByLab>) => {
    Object.entries(etsByLab).forEach(([lab, ets]) => {
      if (ets) this.etsByLab[lab as LabId] = clampETS(ets);
    });
    // TODO: Convert etsByLab to swarm weights
    // if (this.simulator) this.simulator.setETSWeights(this.etsByLab);
  };

  // ─────────────────────────── Internals ───────────────────────────────────────

  private tick = () => {
    const dt = this.clock.getDelta();
    const t = this.clock.elapsedTime;

    // Simulator → entropy field
    this.simulator?.update(dt);
    if (this.entropyMat) {
      (this.entropyMat.map as Texture).needsUpdate = true;
    }

    // Animator → glyph transforms (using animSpec helpers)
    this.animator.update(this.labs, this.etsByLab as any, t);

    // Pulse effect for latencyThreshold
    const pulse = 1 + 0.05 * Math.sin(t * (this.latencyThreshold / 100) * 5);
    this.glyphRoot.scale.set(pulse, pulse, pulse);

    // Occasional Vault log (aggregate)
    if (t - this.lastLogT >= this.opts.logIntervalSec) {
      this.lastLogT = t;
      this.logSummary();
    }

    this.renderer.render(this.scene, this.camera);
    this.rafId = requestAnimationFrame(this.tick);
  };

  private onResize() {
    if (!this.container) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  private setupEntropyOverlay(tex: Texture) {
    // Fullscreen, always behind glyphRoot (render order)
    const plane = new THREE.PlaneGeometry(2, 2);
    const mat = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      opacity: this.opts.entropyOpacity,
      depthTest: false,
      depthWrite: false,
    });

    const quad = new THREE.Mesh(plane, mat);
    quad.frustumCulled = false;
    quad.renderOrder = -999; // firmly behind
    // Use a dedicated scene layer: render as post-like overlay using an orthographic cam trick.
    // Here we place the quad in the main scene with NDC-size via onBeforeRender.
    quad.onBeforeRender = (_, __, ___, camera) => {
      // Pin the quad in front of the camera with NDC mapping
      quad.position.set(0, 0, -1);
      quad.scale.set(this.camera.aspect >= 1 ? this.camera.aspect : 1, this.camera.aspect < 1 ? 1 / this.camera.aspect : 1, 1);
    };

    this.scene.add(quad);
    this.entropyQuad = quad;
    this.entropyMat = mat;
  }

  private beginTelemetryStream() {
    // lab_telemetry expected shape:
    // doc.id === LabId, data: { latency:number, risk:number, complexity:number }
    const q = query(collection(getFirestoreInstance(), 'lab_telemetry'));
    this.unsub = onSnapshot(q, (snap) => {
      const next: Partial<ETSByLab> = {};
      snap.forEach((doc) => {
        const id = doc.id as LabId;
        const d = doc.data() as DocumentData;
        const ets: ETS = {
          latency: Number(d?.latency ?? 0),
          risk: Number(d?.risk ?? 0),
          complexity: Number(d?.complexity ?? 0),
        };
        next[id] = clampETS(ets);
      });
      this.setETS(next);
    }, (err) => {
      VaultLogger.log({
        log_type: 'system_alert',
        data: { message: String(err) },
        source: 'nexus_visualizer'
      });
      // Keep running with last-known-good ETS
    });
  }

  private logSummary() {
    // Aggregate entropy & ETS for VaultLogger
    const avg = averageETS(this.etsByLab);
    const max = maxETS(this.etsByLab);
    VaultLogger.log({
      log_type: 'system_alert',
      data: {
        phase: '17B',
        ets_avg: avg,
        ets_max: max,
        labs: Object.keys(this.etsByLab).length,
        timestamp: Date.now(),
      },
      source: 'nexus_visualizer'
    });
  }

  private seedETS(nodes: GlyphNode[]): ETSByLab {
    const m: ETSByLab = Object.create(null);
    nodes.forEach((n) => {
      m[n.id as LabId] = { latency: 0.25, risk: 0.25, complexity: 0.25 }; // neutral baseline
    });
    return m;
  }
}

// ─────────────────────────── Helpers ───────────────────────────────────────────

function clamp01(x: number) { return Math.max(0, Math.min(1, x)); }

function clampETS(ets: ETS): ETS {
  return {
    latency: clamp01(ets.latency),
    risk: clamp01(ets.risk),
    complexity: clamp01(ets.complexity),
  };
}

function averageETS(map: ETSByLab) {
  let L = 0, R = 0, C = 0, n = 0;
  for (const k in map) {
    const e = map[k as LabId];
    if (!e) continue;
    L += e.latency; R += e.risk; C += e.complexity; n++;
  }
  if (!n) return { latency: 0, risk: 0, complexity: 0 };
  return { latency: L / n, risk: R / n, complexity: C / n };
}

function maxETS(map: ETSByLab) {
  let L = 0, R = 0, C = 0;
  for (const k in map) {
    const e = map[k as LabId];
    if (!e) continue;
    if (e.latency > L) L = e.latency;
    if (e.risk > R) R = e.risk;
    if (e.complexity > C) C = e.complexity;
  }
  return { latency: L, risk: R, complexity: C };
}
