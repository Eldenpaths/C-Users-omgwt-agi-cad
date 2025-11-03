'use client';

import { useState, useEffect } from 'react';
import { Zap, Wind, RefreshCw, Target } from 'lucide-react';

// Simplified PlasmaSimulator
class PlasmaSimulator {
  public state: any;
  public targetFlux: number = 0;

  constructor() {
    this.state = {
      temperature_K: 350,
      pressure_Pa: 101325,
      ionization_percent: 0,
      timestamp: Date.now(),
    };
  }

  step(deltaTime: number) {
    const dt_s = deltaTime / 1000;
    const heatLoss = (this.state.temperature_K - 300) * 0.05;
    const dT = (this.targetFlux - heatLoss) * dt_s;

    this.state.temperature_K += dT;
    this.state.temperature_K = Math.max(300, Math.min(10000, this.state.temperature_K));

    const T_half = 3000;
    const steepness = 0.005;
    this.state.ionization_percent = 100 / (1 + Math.exp(-steepness * (this.state.temperature_K - T_half)));
    this.state.timestamp = Date.now();

    return { ...this.state };
  }

  command(action: string, params: any) {
    switch (action) {
      case 'heat':
        this.targetFlux = params.flux || 1500;
        break;
      case 'stop':
        this.targetFlux = 0;
        break;
      case 'vent':
        this.state.pressure_Pa *= 0.75;
        this.targetFlux = 0;
        break;
      case 'refill':
        this.state.pressure_Pa = 101325;
        break;
    }
  }
}

export default function PlasmaLab() {
  const [simulator, setSimulator] = useState<PlasmaSimulator | null>(null);
  const [plasmaState, setPlasmaState] = useState<any>(null);

  useEffect(() => {
    const sim = new PlasmaSimulator();
    setSimulator(sim);

    const intervalId = setInterval(() => {
      if (sim) {
        sim.step(33.3);
        setPlasmaState(sim.state);
      }
    }, 33.3);

    return () => clearInterval(intervalId);
  }, []);

  const handleCommand = (action: string, params: any = {}) => {
    if (simulator) {
      simulator.command(action, params);
    }
  };

  const tempColor = plasmaState?.temperature_K > 2000 ?
    (plasmaState?.temperature_K > 6000 ? 'from-amber-300 to-red-500' : 'from-amber-400 to-orange-500') :
    'from-amber-600 to-amber-800';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Visualization */}
      <div className="flex flex-col items-center justify-center bg-black/30 border border-amber-500/20 rounded-lg p-6">
        <div className="relative w-40 h-40">
          <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${tempColor} animate-pulse`} />
          <div className="absolute inset-0 rounded-full bg-amber-400 blur-2xl opacity-40" />
          <div className="absolute inset-0 flex items-center justify-center text-4xl">⚡</div>
        </div>
        <div className="mt-4 space-y-1 text-center">
          <p className="text-amber-300 text-sm">Temp: {plasmaState?.temperature_K.toFixed(0) || 0} K</p>
          <p className="text-amber-400 text-sm">Ionization: {plasmaState?.ionization_percent.toFixed(1) || 0}%</p>
        </div>
      </div>

      {/* Controls */}
      <div className="space-y-3">
        <button
          onClick={() => handleCommand('heat', { flux: 1500 })}
          className="w-full px-4 py-2 bg-amber-600 hover:bg-amber-500 text-amber-950 rounded font-semibold transition-colors flex items-center justify-center gap-2"
        >
          <Zap className="w-4 h-4" /> IGNITE
        </button>
        <button
          onClick={() => handleCommand('stop')}
          className="w-full px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 rounded font-semibold transition-colors flex items-center justify-center gap-2"
        >
          <Target className="w-4 h-4" /> HALT
        </button>
        <button
          onClick={() => handleCommand('vent')}
          className="w-full px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 rounded font-semibold transition-colors flex items-center justify-center gap-2"
        >
          <Wind className="w-4 h-4" /> VENT
        </button>
        <button
          onClick={() => handleCommand('refill')}
          className="w-full px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 rounded font-semibold transition-colors flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-4 h-4" /> REFILL
        </button>
      </div>
    </div>
  );
}
