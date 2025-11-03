import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import * as THREE from "three";

type Metrics = {
  latency: number;
  fidelity: number;
  cost: number;
};

const MAX_COUNT = 100000; // Scale up to 100k

interface TesseractState {
  count: number;
  metrics: Metrics;
  // Store particle data in efficient TypedArrays
  positions: Float32Array;
  rotationalVelocities: Float32Array;
  velocities: Float32Array;
  fidelities: Float32Array;
  costs: Float32Array;
  setCount: (count: number) => void;
  metricsHistory: Metrics[];
  updateMetrics: () => void;
  initializeParticles: () => void;
  setMetrics: (newMetrics: Partial<Metrics>) => void;
  selectedInstance: number | null;
  setSelectedInstance: (id: number | null) => void;
}

export const useTesseractStore = create(
  immer<TesseractState>((set) => ({
  count: 100,
  metrics: { latency: 30, fidelity: 0.95, cost: 0.1 },
  positions: new Float32Array(MAX_COUNT * 3),
  velocities: new Float32Array(MAX_COUNT * 3),
  rotationalVelocities: new Float32Array(MAX_COUNT * 2), // x, y for rotation
  fidelities: new Float32Array(MAX_COUNT),
  costs: new Float32Array(MAX_COUNT),
  metricsHistory: [],
  selectedInstance: null,
  setSelectedInstance: (id) => set({ selectedInstance: id }),

  initializeParticles: () => {
    set((state) => {
      for (let i = 0; i < MAX_COUNT; i++) {
        // Positions
        state.positions[i * 3 + 0] = (Math.random() - 0.5) * 15;
        state.positions[i * 3 + 1] = (Math.random() - 0.5) * 15;
        state.positions[i * 3 + 2] = (Math.random() - 0.5) * 15;
        // Translational Velocities (start at 0)
        state.velocities[i * 3 + 0] = 0;
        state.velocities[i * 3 + 1] = 0;
        state.velocities[i * 3 + 2] = 0;
        // Rotational Velocities
        state.rotationalVelocities[i * 2 + 0] = 0.1 + Math.random() * 0.5;
        state.rotationalVelocities[i * 2 + 1] = 0.1 + Math.random() * 0.5;
        // Fidelities
        state.fidelities[i] = 0.7 + Math.random() * 0.3;
        // Costs
        state.costs[i] = 0.05 + Math.random() * 0.35;
      }
    });
  },

  setCount: (count) => set({ count }),

  setMetrics: (newMetrics) =>
    set((state) => {
      state.metrics = { ...state.metrics, ...newMetrics };
    }),

  updateMetrics: () =>
    set((state) => {
      // Add current metrics to history, and keep the history at a fixed length
      const newHistory = [...state.metricsHistory, state.metrics];
      if (newHistory.length > 50) {
        newHistory.shift();
      }
      state.metricsHistory = newHistory;

      state.metrics = {
        latency: Math.max(
          5,
          Math.min(100, state.metrics.latency + (Math.random() - 0.5) * 10)
        ),
        fidelity: Math.min(
          1,
          Math.max(0.7, state.metrics.fidelity + (Math.random() - 0.5) * 0.05)
        ),
        cost: Math.min(
          0.4,
          Math.max(0.05, state.metrics.cost + (Math.random() - 0.5) * 0.02)
        ),
      };
    }),
  }))
);