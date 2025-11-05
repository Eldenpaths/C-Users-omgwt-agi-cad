import type { SimulationAdapter, SimulationState } from '../types';
import { meanRevertingDrift, logistic } from '../physics';

/**
 * Plasma simulation adapter.
 * Values: temperatureK, ionization
 */
export const plasmaAdapter: SimulationAdapter = {
  labId: 'plasma',
  initState: (): SimulationState => ({
    labId: 'plasma',
    timeMs: 0,
    values: {
      temperatureK: 350,
      ionization: 0,
    },
  }),
  simulateStep: (state: SimulationState, dt: number): SimulationState => {
    const tempTarget = 5000;
    const temperatureK = meanRevertingDrift(state.values.temperatureK, tempTarget, dt, 0.15, 0.03, 300, 12000);
    const ionization = 100 * logistic(temperatureK - 3000, 0.002, 0);
    return {
      labId: 'plasma',
      timeMs: state.timeMs + dt,
      values: { temperatureK, ionization },
    };
  },
};

export default plasmaAdapter;

