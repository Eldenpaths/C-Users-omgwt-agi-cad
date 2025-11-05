import { useEffect, useMemo, useRef, useState } from 'react';
import type { LabId, SimulationEvent, SimulationState } from './types';
import { getSimulationCore } from './core';

/**
 * Subscribe to a simulation for a given labId and expose controls.
 */
export function useSimulation(labId: LabId) {
  const core = useMemo(() => getSimulationCore(), []);
  const [state, setState] = useState<SimulationState | undefined>(() => core.getState(labId));
  const [running, setRunning] = useState(false);

  useEffect(() => {
    const unsub = core.subscribe(labId, (evt: SimulationEvent) => {
      if (evt.type === 'start') setRunning(true);
      if (evt.type === 'stop') setRunning(false);
      if (evt.state) setState(evt.state);
    });
    return () => unsub();
  }, [core, labId]);

  return {
    state,
    running,
    start: () => core.start(labId),
    stop: () => core.stop(labId),
    reset: () => core.reset(labId),
    setContext: (ctx: { userId?: string; agentId?: string }) => core.setContext(ctx),
  };
}

/**
 * Subscribe to frame ticks (derived from step events) for a lab.
 */
export function useFrame(labId: LabId) {
  const core = useMemo(() => getSimulationCore(), []);
  const [frame, setFrame] = useState<{ t: number; dt: number } | null>(null);
  useEffect(() => {
    const unsub = core.subscribe(labId, (evt) => {
      if (evt.type === 'step' && evt.frame) setFrame(evt.frame);
    });
    return () => unsub();
  }, [core, labId]);
  return frame;
}

export default useSimulation;

