import type { SimulationAdapter, SimulationState } from '../types';
import { oscillator, meanRevertingDrift } from '../physics';

/**
 * Spectral simulation adapter.
 * Values: wavelengthNm, intensity
 */
export const spectralAdapter: SimulationAdapter = {
  labId: 'spectral',
  initState: (): SimulationState => ({
    labId: 'spectral',
    timeMs: 0,
    values: {
      wavelengthNm: 550,
      intensity: 40,
    },
  }),
  simulateStep: (state: SimulationState, dt: number): SimulationState => {
    const t = state.timeMs + dt;
    const wavelengthNm = meanRevertingDrift(state.values.wavelengthNm, 550, dt, 0.05, 0.005, 380, 750);
    const intensity = Math.max(0, Math.min(100, state.values.intensity + oscillator(t, 10, 3000)));
    return { labId: 'spectral', timeMs: t, values: { wavelengthNm, intensity } };
  },
};

export default spectralAdapter;

