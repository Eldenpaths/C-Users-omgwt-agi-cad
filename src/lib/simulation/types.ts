/**
 * Common types for the Simulation Core.
 */

export type LabId = 'plasma' | 'spectral' | 'chemistry' | 'crypto';

/**
 * A single simulation frame tick.
 */
export interface Frame {
  /** Epoch ms at tick time */
  t: number;
  /** Delta time in milliseconds since previous tick */
  dt: number;
}

/**
 * Generic simulation state shared across lab types.
 */
export interface SimulationState {
  labId: LabId;
  /** Accumulated simulation time in ms */
  timeMs: number;
  /**
   * Lab-specific numeric values to chart. For example:
   * - plasma: { temperatureK, ionization }
   * - spectral: { intensity, wavelengthNm }
   * - chemistry: { yieldPercent }
   * - crypto: { profitPct }
   */
  values: Record<string, number>;
}

/**
 * Lifecycle events emitted by the core.
 */
export type SimulationEventType = 'start' | 'stop' | 'step' | 'reset';

export interface SimulationEvent {
  type: SimulationEventType;
  labId: LabId;
  state: SimulationState;
  frame?: Frame;
}

/**
 * Adapter contract for all labs.
 */
export interface SimulationAdapter {
  /** Lab identifier handled by the adapter */
  labId: LabId;
  /** Initialize a default starting state for the lab */
  initState: () => SimulationState;
  /**
   * Simulate one step. Receives current state and time delta in ms.
   * Returns the next state (immutably or the same reference with updated values).
   */
  simulateStep: (state: SimulationState, dt: number) => SimulationState;
}

