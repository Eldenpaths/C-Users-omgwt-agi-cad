import type { SimulationAdapter, SimulationState } from '../types';
import { meanRevertingDrift } from '../physics';

/**
 * Chemistry simulation adapter.
 * Values: yieldPercent, temperatureC
 */
export const chemistryAdapter: SimulationAdapter = {
  labId: 'chemistry',
  initState: (): SimulationState => ({
    labId: 'chemistry',
    timeMs: 0,
    values: {
      yieldPercent: 25,
      temperatureC: 22,
    },
  }),
  simulateStep: (state: SimulationState, dt: number): SimulationState => {
    const yieldPercent = meanRevertingDrift(state.values.yieldPercent, 60, dt, 0.05, 0.01, 0, 100);
    const temperatureC = meanRevertingDrift(state.values.temperatureC, 65, dt, 0.08, 0.01, 0, 150);
    return { labId: 'chemistry', timeMs: state.timeMs + dt, values: { yieldPercent, temperatureC } };
  },
};

export default chemistryAdapter;

