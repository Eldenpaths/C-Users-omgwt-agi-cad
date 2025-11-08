import { Telemetry } from '@/lib/learning/telemetry';
import type { TaskContext } from '@/lib/neuroevolution/tasks';
import type { MultiObjectiveAgent } from '@/lib/neuroevolution/agent';
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

  // Simple event emitter (neuroevolution bridge)
  private ee = new Map<string, Set<(payload: any) => void>>();
  // Optional task bindings per lab: used to emit task:completed + tick events with metrics
  private taskBindings = new Map<LabId, { task: TaskContext; agent: MultiObjectiveAgent; generation: number }>();

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

  /** Bind a task context and agent to a lab to enable task:completed emissions. */
  bindTask(labId: LabId, binding: { task: TaskContext; agent: MultiObjectiveAgent; generation?: number }) {
    this.taskBindings.set(labId, { ...binding, generation: binding.generation ?? 0 })
  }

  /** Generic event registration (for neuro hooks). */
  on(event: string, handler: (payload: any) => void) {
    if (!this.ee.has(event)) this.ee.set(event, new Set())
    this.ee.get(event)!.add(handler)
  }
  off(event: string, handler: (payload: any) => void) {
    if (!this.ee.has(event)) return
    this.ee.get(event)!.delete(handler)
  }
  private emitGeneric(event: string, payload: any) {
    const set = this.ee.get(event)
    if (!set) return
    set.forEach((fn) => {
      try { fn(payload) } catch (e) { console.warn('[SimulationCore] generic listener error:', (e as Error).message) }
    })
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

      // Neuroevolution bridge: emit tick with metrics; emit task:completed when done
      const binding = this.taskBindings.get(labId)
      if (binding) {
        const metrics = this.deriveMetrics(next)
        const payload = {
          agentId: this.agentId || 'agent',
          task: binding.task,
          generation: binding.generation,
          agent: binding.agent,
          metrics,
          done: this.isTaskDone(binding.task, next, metrics),
        }
        // tick event for onSimulationTick()
        this.emitGeneric('tick', payload)
        if (payload.done) {
          this.emitGeneric('task:completed', payload)
          // reset timer and bump generation
          const reset: SimulationState = { ...next, timeMs: 0 }
          this.states.set(labId, reset)
          binding.generation += 1
          this.taskBindings.set(labId, binding)
        }
      }
    });
  }

  /** Basic metric derivation; adapters may encode accuracy/energy in values. */
  private deriveMetrics(state: SimulationState) {
    const timeMs = state.timeMs
    const accuracy = typeof state.values.accuracy === 'number' ? state.values.accuracy : 0.5 + 0.5 * Math.tanh((state.values.yieldPercent ?? 0) / 100)
    const energy = typeof state.values.energy === 'number' ? state.values.energy : (state.values.power ?? 0)
    return { timeMs, accuracy, energy }
  }

  /** Determine completion: prefer task.constraints.timeDeadlineMs if present, else 5s. */
  private isTaskDone(task: TaskContext, state: SimulationState, metrics: { timeMs: number }) {
    const deadline = task.constraints.timeDeadlineMs ?? 5000
    return metrics.timeMs >= deadline
  }
}

// Singleton accessor (client-only)
let __core: SimulationCore | null = null;
export function getSimulationCore(): SimulationCore {
  if (!__core) __core = new SimulationCore();
  return __core;
}

export default SimulationCore;
