import type { Frame } from './types';

/**
 * Time-step scheduler for simulations. Uses setInterval for consistent dt.
 */
export class SimulationScheduler {
  private intervalId: NodeJS.Timeout | null = null;
  private lastT = 0;
  private subscribers = new Set<(frame: Frame) => void>();

  constructor(private stepMs = 100) {}

  /** Subscribe to frame ticks. Returns unsubscribe function. */
  subscribe(cb: (frame: Frame) => void): () => void {
    this.subscribers.add(cb);
    return () => this.subscribers.delete(cb);
  }

  /** Start ticking; no-op if already running. */
  start() {
    if (this.intervalId) return;
    this.lastT = Date.now();
    this.intervalId = setInterval(() => {
      const now = Date.now();
      const dt = now - this.lastT;
      this.lastT = now;
      const frame: Frame = { t: now, dt };
      this.subscribers.forEach((cb) => {
        try {
          cb(frame);
        } catch (_) {
          // isolate subscriber failures
        }
      });
    }, this.stepMs);
  }

  /** Stop ticking; safe if not running. */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /** Change step interval and restart if needed. */
  setStepMs(ms: number) {
    const running = !!this.intervalId;
    this.stop();
    this.stepMs = ms;
    if (running) this.start();
  }
}

export default SimulationScheduler;

