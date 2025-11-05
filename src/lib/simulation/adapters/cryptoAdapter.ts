import type { SimulationAdapter, SimulationState } from '../types';
import { geometricToyDrift } from '../physics';

/**
 * Crypto simulation adapter.
 * Values: profitPct
 */
export const cryptoAdapter: SimulationAdapter = {
  labId: 'crypto',
  initState: (): SimulationState => ({
    labId: 'crypto',
    timeMs: 0,
    values: {
      profitPct: 0,
    },
  }),
  simulateStep: (state: SimulationState, dt: number): SimulationState => {
    const profitPct = geometricToyDrift(state.values.profitPct, dt, 0.001, 0.02);
    return { labId: 'crypto', timeMs: state.timeMs + dt, values: { profitPct } };
  },
};

export default cryptoAdapter;

