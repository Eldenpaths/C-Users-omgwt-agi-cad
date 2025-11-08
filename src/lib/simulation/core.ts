import { Telemetry } from '@/lib/learning/telemetry';
import SimulationScheduler from './scheduler';
import type { LabId, SimulationAdapter, SimulationEvent, SimulationState } from './types';
import { plasmaAdapter } from './adapters/plasmaAdapter';
import { spectralAdapter } from './adapters/spectralAdapter';
import { chemistryAdapter } from './adapters/chemistryAdapter';
import { cryptoAdapter } from './adapters/cryptoAdapter';

/**
 * Unified Simulation Core.
 * Manages lab adapters, runs a single scheduler, and notifies subscribers.
 */
export class SimulationCore {
  private adapters = new Map<LabId, SimulationAdapter>();
  private states = new Map<LabId, SimulationState>();
  private running = new Set<LabId>();
  private listeners = new Map<LabId, Set<(evt: SimulationEvent) => void>>();
  private scheduler: SimulationScheduler | null = null;
  private userId?: string;
  private agentId?: string;

  constructor() {
    // Register built-in adapters
    [plasmaAdapter, spectralAdapter, chemistryAdapter, cryptoAdapter].forEach((a) => this.registerAdapter(a));
  }

  /** Register a lab adapter. */
  registerAdapter(adapter: SimulationAdapter) {
    this.adapters.set(adapter.labId, adapter);
    // Initialize default state
    const s = adapter.initState();
    this.states.set(adapter.labId, s);
  }

  /** Set context for telemetry attribution. */
  setContext(ctx: { userId?: string; agentId?: string }) {
    this.userId = ctx.userId;
    this.agentId = ctx.agentId;
  }

  /** Get current state for a lab. */
  getState(labId: LabId): SimulationState | undefined {
    return this.states.get(labId);
  }

  /** Subscribe to events for a lab. */
  subscribe(labId: LabId, cb: (evt: SimulationEvent) => void): () => void {
    if (!this.listeners.has(labId)) this.listeners.set(labId, new Set());
    this.listeners.get(labId)!.add(cb);
    return () => this.listeners.get(labId)!.delete(cb);
  }

  /** Notify listeners of an event. */
  private emit(evt: SimulationEvent) {
    const ls = this.listeners.get(evt.labId);
    if (!ls) return;
    ls.forEach((cb) => {
      try {
        cb(evt);
      } catch (error) {
        console.error('[SimulationCore] Listener error:', error);
      }
    });
  }

  /** Start simulation for a lab. */
  async start(labId: LabId) {
    if (this.running.has(labId)) return;
    this.running.add(labId);
    // Ensure scheduler
    if (!this.scheduler) {
      this.scheduler = new SimulationScheduler(100);
      this.scheduler.subscribe((frame) => this.stepAll(frame.dt, frame));
      this.scheduler.start();
    }
    const state = this.states.get(labId)!;
    this.emit({ type: 'start', labId, state });
    await Telemetry.logEvent({ userId: this.userId || 'system', agentId: this.agentId, labType: labId, event: 'simulation_start' });
  }

  /** Stop a lab simulation; stops scheduler if no labs running. */
  async stop(labId: LabId) {
    if (!this.running.has(labId)) return;
    this.running.delete(labId);
    const state = this.states.get(labId)!;
    this.emit({ type: 'stop', labId, state });
    await Telemetry.logEvent({ userId: this.userId || 'system', agentId: this.agentId, labType: labId, event: 'simulation_stop' });
    if (this.running.size === 0 && this.scheduler) {
      this.scheduler.stop();
      this.scheduler = null;
    }
  }

  /** Reset a lab to its initial state. */
  reset(labId: LabId) {
    const adapter = this.adapters.get(labId);
    if (!adapter) return;
    const s = adapter.initState();
    this.states.set(labId, s);
    this.emit({ type: 'reset', labId, state: s });
  }

  /** Step all running labs using dt in ms. */
  private stepAll(dt: number, frame?: { t: number; dt: number }) {
    this.running.forEach((labId) => {
      const adapter = this.adapters.get(labId)!;
      const cur = this.states.get(labId)!;
      const next = adapter.simulateStep(cur, dt);
      this.states.set(labId, next);
      this.emit({ type: 'step', labId, state: next, frame });
    });
  }
}

// Singleton accessor (client-only)
let __core: SimulationCore | null = null;
export function getSimulationCore(): SimulationCore {
  if (!__core) __core = new SimulationCore();
  return __core;
}

export default SimulationCore;
