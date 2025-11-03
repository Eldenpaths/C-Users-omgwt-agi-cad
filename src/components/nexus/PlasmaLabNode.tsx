import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { RefreshCw, Zap, Disc, Wind, Target, ArrowLeft, Save } from 'lucide-react';
import { useExperiments } from '@/hooks/useExperiments';

/**
 * DELIVERABLE 1: PlasmaSimulator.ts (Implemented internally for single-file runtime)
 * --------------------------------------------------------------------------------
 * Simulates the physical state of the plasma reactor.
 * This class simulates the Lab Simulator (30 FPS) → Redis Pub/Sub part of the architecture.
 */

interface PlasmaState {
    temperature_K: number;
    pressure_Pa: number;
    composition: { H: number; He: number };
    ionization_percent: number; // 0 to 100
    timestamp: number;
}

class PlasmaSimulator {
    private state: PlasmaState;
    public targetFlux: number; // Represents target energy input (heating power)
    private ambientTemp: number = 300; // 300 K
    private coolingRate: number = 0.05; // Rate of natural heat dissipation
    private maxTemp: number = 10000;
    private maxPressure: number = 1013250; // 10 atm max

    constructor() {
        this.targetFlux = 0;
        this.state = this.getInitialState();
    }

    private getInitialState(): PlasmaState {
        return {
            temperature_K: this.ambientTemp + 50,
            pressure_Pa: 101325, // 1 atm
            composition: { H: 0.95, He: 0.05 },
            ionization_percent: 0,
            timestamp: Date.now(),
        };
    }

    /**
     * @brief Initializes the plasma state.
     */
    init(temp: number, pressure: number): void {
        this.state.temperature_K = Math.min(this.maxTemp, temp);
        this.state.pressure_Pa = Math.min(this.maxPressure, pressure);
        this.state.timestamp = Date.now();
        this.calculateIonization();
    }

    /**
     * @brief Calculates derived properties like ionization and composition change.
     */
    private calculateIonization(): void {
        const T = this.state.temperature_K;
        const T_half = 3000; // Temperature (K) where ionization is 50%
        const steepness = 0.005;

        // Logistic function for smooth ionization curve (0 -> 100%)
        let ionization = 100 / (1 + Math.exp(-steepness * (T - T_half)));
        this.state.ionization_percent = Math.min(99.9, Math.max(0.1, ionization));

        // Composition change: Simple simulation of reaction (H -> He) based on high Ionization
        if (this.state.temperature_K > 4000) {
            const conversionRate = (this.state.ionization_percent / 100) * 0.0001; // small rate
            const H_loss = Math.min(this.state.composition.H, conversionRate);
            this.state.composition.H -= H_loss;
            this.state.composition.He += H_loss;

            // Ensure composition sum is 1 (for consistency)
            const sum = this.state.composition.H + this.state.composition.He;
            this.state.composition.H /= sum;
            this.state.composition.He /= sum;
        }
    }

    /**
     * @brief Steps the simulation forward in time (called at 30 FPS).
     * @param deltaTime Time passed since the last step in milliseconds.
     * @returns A copy of the new PlasmaState.
     */
    step(deltaTime: number): PlasmaState {
        const dt_s = deltaTime / 1000; // delta time in seconds

        // 1. Energy dynamics (Temperature change)
        const heatLoss = (this.state.temperature_K - this.ambientTemp) * this.coolingRate;
        const dT = (this.targetFlux - heatLoss) * dt_s;

        this.state.temperature_K += dT;
        this.state.temperature_K = Math.max(this.ambientTemp, Math.min(this.maxTemp, this.state.temperature_K));

        // 2. Pressure dynamics (Slight stabilization towards a baseline)
        const pressureDrift = (101325 - this.state.pressure_Pa) * 0.01 * dt_s;
        this.state.pressure_Pa += pressureDrift;

        // 3. Recalculate derived properties
        this.calculateIonization();

        this.state.timestamp = Date.now();
        return { ...this.state }; // Return a copy
    }

    /**
     * @brief Handles external Agent commands (DELIVERABLE 3).
     */
    command(action: string, params: any): void {
        switch (action) {
            case 'heat':
                // Set targetFlux high to drive temperature towards the max
                this.targetFlux = params.flux || 1500;
                break;
            case 'vent':
                // Rapidly decrease pressure
                this.state.pressure_Pa *= 0.75;
                this.state.pressure_Pa = Math.max(1000, this.state.pressure_Pa);
                this.targetFlux = 0; // Turn off heating during vent
                break;
            case 'refill':
                // Reset composition and pressure to initial conditions
                this.state.composition = { H: 0.95, He: 0.05 };
                this.state.pressure_Pa = 101325;
                break;
            case 'stop':
                this.targetFlux = 0;
                break;
            default:
                console.warn(`Unknown command: ${action}`);
        }
    }

    /**
     * @brief Gets data formatted for external systems (Nexus/Firestore).
     */
    getVisualizationData(): object {
        return {
            T: this.state.temperature_K,
            P: this.state.pressure_Pa,
            I: this.state.ionization_percent,
            H: this.state.composition.H,
            He: this.state.composition.He,
            timestamp: this.state.timestamp,
        };
    }
}

/**
 * DELIVERABLE 2: Plasma Lab Nexus Client (App Component)
 * --------------------------------------------------------------------------------
 * Renders the state and provides the Agent Command Interface.
 */

const PlasmaLabNode = () => {
    // State to hold the simulator instance and the current data flow state
    const [simulator, setSimulator] = useState<PlasmaSimulator | null>(null);
    const [plasmaState, setPlasmaState] = useState<any>(null);
    const [inputTemp, setInputTemp] = useState(5000);
    const [statusMessage, setStatusMessage] = useState('Initializing...');

    // Experiment persistence
    const { saveExperiment } = useExperiments('plasma');
    const [isSaving, setIsSaving] = useState(false);
    const [commandHistory, setCommandHistory] = useState<Array<{timestamp: number, command: string, params: any}>>([]);

    // Function to handle agent commands
    const handleCommand = useCallback((action: string, params: any = {}) => {
        if (simulator) {
            simulator.command(action, params);

            // Track command history for persistence
            setCommandHistory(prev => [...prev, {
                timestamp: Date.now(),
                command: action,
                params
            }]);

            let msg = '';
            switch (action) {
                case 'heat':
                    msg = `Agent Command: Firing main heater (Flux: ${params.flux || 1500})`;
                    break;
                case 'vent':
                    msg = 'Agent Command: Venting plasma chamber.';
                    break;
                case 'refill':
                    msg = 'Agent Command: Refilling fuel mix.';
                    break;
                case 'stop':
                    msg = 'Agent Command: Halting all systems.';
                    break;
                default:
                    msg = `Command sent: ${action}`;
            }
            setStatusMessage(msg);
        }
    }, [simulator]);

    // Save experiment handler
    const handleSave = async () => {
        if (!simulator) return;

        setIsSaving(true);
        try {
            const experimentId = await saveExperiment({
                labId: 'plasma',
                title: `Plasma Experiment ${new Date().toLocaleString()}`,
                description: statusMessage,
                commands: commandHistory as any,
                finalState: simulator.getVisualizationData(),
                tags: ['plasma', 'physics'],
                isPublic: false,
                status: 'completed'
            });

            alert(`Experiment saved! ID: ${experimentId}`);
            setCommandHistory([]); // Reset history
        } catch (error: any) {
            alert('Failed to save experiment: ' + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    // UseEffect to manage the 30 FPS simulation loop (Simulates Pub/Sub subscription)
    useEffect(() => {
        // 1. Initialize Simulator
        const sim = new PlasmaSimulator();
        sim.init(350, 101325); // Start slightly above ambient
        setSimulator(sim);
        setStatusMessage('Simulation ready. Standby mode.');

        // 2. Start 30 FPS Update Loop
        const updateInterval = 1000 / 30; // ~33.3ms
        const intervalId = setInterval(() => {
            if (sim) {
                // Step the simulation
                sim.step(updateInterval);
                // The 'setPlasmaState' call simulates the Nexus Client subscribing
                // to the Redis Pub/Sub stream, receiving updates < 100ms.
                setPlasmaState(sim.getVisualizationData());
            }
        }, updateInterval);

        return () => clearInterval(intervalId); // Cleanup interval on unmount
    }, []);

    // Derived values for visualization
    const { tempColor, sphereSize, particleDensity, glowSize } = useMemo(() => {
        if (!plasmaState) {
            return { tempColor: 'gray', sphereSize: 'w-20 h-20', particleDensity: 0, glowSize: '0' };
        }

        const T = plasmaState.T;
        const P = plasmaState.P;
        const I = plasmaState.I / 100; // Ionization (0 to 1)

        // Sphere Color based on Temperature
        let color = 'bg-blue-300';
        if (T > 2000) color = 'bg-yellow-300';
        if (T > 4000) color = 'bg-orange-400';
        if (T > 6000) color = 'bg-red-500';
        if (T > 8000) color = 'bg-pink-600';

        // Sphere Size based on Pressure (higher pressure = tighter plasma = smaller/more intense)
        const minSize = 24; // w-24
        const maxSize = 48; // w-48
        const sizeRatio = Math.min(1, Math.max(0, (P - 10000) / (1013250 - 10000))); // normalize pressure
        const currentSize = maxSize - (sizeRatio * (maxSize - minSize));

        // Glow based on Ionization
        const glowPx = Math.round(I * 32);

        return {
            tempColor: color,
            sphereSize: `w-[${currentSize}rem] h-[${currentSize}rem]`,
            particleDensity: Math.round(I * 10), // Number of particles to draw
            glowSize: `${glowPx}px`,
        };
    }, [plasmaState]);

    if (!plasmaState) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
                <p>Loading Plasma Simulator...</p>
            </div>
        );
    }

    // Formatting utility
    const formatValue = (value: number, unit: string) => `${value.toFixed(2)}${unit}`;

    // Helper component for the glowing plasma sphere
    const PlasmaSphere = () => (
        <div className="relative flex items-center justify-center">
            {/* The Plasma Core */}
            <div
                className={`relative rounded-full transition-all duration-300 ${tempColor}`}
                style={{
                    boxShadow: `0 0 10px 5px rgba(255,255,255,0.6), 0 0 ${glowSize} 15px rgba(255,100,200,0.8)`,
                    width: 160,
                    height: 160,
                    opacity: plasmaState.I / 100, // Core opacity based on Ionization
                }}
            >
                {/* Particle Emitter (simplified) */}
                {Array.from({ length: particleDensity }).map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-1 h-1 rounded-full bg-white opacity-50"
                        style={{
                            top: `${Math.random() * 100}%`,
                            left: `${Math.random() * 100}%`,
                            transform: `translate(-50%, -50%)`,
                            animation: `flicker ${Math.random() * 2 + 0.5}s ease-in-out infinite alternate`,
                        }}
                    ></div>
                ))}
            </div>

            {/* CSS for flicker animation */}
            <style jsx>{`
                @keyframes flicker {
                    0% { opacity: 0.1; transform: scale(0.8); }
                    100% { opacity: 1; transform: scale(1.2); }
                }
            `}</style>
        </div>
    );

    const TelemetryCard = ({ title, value, color }: { title: string; value: string | number; color: string }) => (
        <div className="p-4 bg-gray-700/50 rounded-lg flex flex-col justify-between">
            <p className="text-sm text-gray-400 uppercase tracking-wider">{title}</p>
            <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
        </div>
    );

    return (
        <div className="min-h-screen p-4 sm:p-8 bg-gray-950 text-white font-inter">
            <header className="mb-8 border-b border-indigo-700 pb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-indigo-400 flex items-center">
                            <Disc className="w-6 h-6 mr-2 animate-spin" />
                            Plasma Lab Nexus Node (v1.0)
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">Simulating 30 FPS Real-time Data Flow</p>
                    </div>
                    <Link href="/labs">
                        <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium transition duration-150 flex items-center space-x-2">
                            <ArrowLeft className="w-4 h-4" />
                            <span>Back to Labs</span>
                        </button>
                    </Link>
                </div>
            </header>

            <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* STATUS AND CONTROLS (Agent Interface) */}
                <section className="lg:col-span-1 p-6 bg-gray-800 rounded-xl shadow-lg border border-gray-700">
                    <h2 className="text-xl font-semibold mb-4 text-indigo-300 border-b border-indigo-900 pb-2">
                        Agent Command Interface
                    </h2>

                    {/* Command Buttons */}
                    <div className="space-y-3 mb-6">
                        <div className="flex items-center space-x-2">
                            <input
                                type="number"
                                value={inputTemp}
                                onChange={(e) => setInputTemp(Number(e.target.value))}
                                className="w-24 p-2 bg-gray-700 border border-gray-600 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                min={1000}
                                max={10000}
                            />
                            <button
                                onClick={() => handleCommand('heat', { flux: inputTemp * 0.1 })}
                                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition duration-150 shadow-md shadow-red-900/50"
                            >
                                <Zap className="w-4 h-4 inline mr-2" />
                                HEAT Plasma ({inputTemp} K Target)
                            </button>
                        </div>
                        <button
                            onClick={() => handleCommand('stop')}
                            className="w-full px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-sm font-medium transition duration-150 shadow-md shadow-yellow-900/50"
                        >
                            <Target className="w-4 h-4 inline mr-2" />
                            HALT Heating (Stop Flux)
                        </button>
                        <button
                            onClick={() => handleCommand('vent')}
                            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition duration-150 shadow-md shadow-blue-900/50"
                        >
                            <Wind className="w-4 h-4 inline mr-2" />
                            VENT Chamber
                        </button>
                        <button
                            onClick={() => handleCommand('refill')}
                            className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium transition duration-150 shadow-md shadow-green-900/50"
                        >
                            <RefreshCw className="w-4 h-4 inline mr-2" />
                            REFILL Fuel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving || commandHistory.length === 0}
                            className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition duration-150 shadow-md shadow-purple-900/50"
                        >
                            <Save className="w-4 h-4 inline mr-2" />
                            {isSaving ? 'Saving...' : 'SAVE Experiment'}
                        </button>
                    </div>

                    <div className="mt-8 p-3 bg-gray-700 rounded-lg text-sm text-gray-300">
                        <p className="font-mono text-xs">
                            <span className="text-indigo-400">STATUS:</span> {statusMessage}
                        </p>
                    </div>

                </section>

                {/* VISUALIZATION */}
                <section className="lg:col-span-2 p-6 bg-gray-800 rounded-xl shadow-lg border border-gray-700">
                    <h2 className="text-xl font-semibold mb-6 text-indigo-300 border-b border-indigo-900 pb-2">
                        Plasma Chamber Visualization
                    </h2>
                    <div className="flex justify-center items-center h-96 bg-gray-900 rounded-lg p-4 relative overflow-hidden">
                        {/* Chamber Border */}
                        <div className="absolute inset-4 rounded-lg border-4 border-indigo-800/50 pointer-events-none"></div>
                        <PlasmaSphere />
                    </div>
                </section>

                {/* REAL-TIME READOUTS (Nexus Data) */}
                <section className="lg:col-span-3 p-6 bg-gray-800 rounded-xl shadow-lg border border-gray-700">
                    <h2 className="text-xl font-semibold mb-4 text-indigo-300 border-b border-indigo-900 pb-2">
                        Real-Time Telemetry (100ms Latency Target)
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <TelemetryCard title="Temperature" value={formatValue(plasmaState.T, ' K')} color="text-red-400" />
                        <TelemetryCard title="Pressure" value={formatValue(plasmaState.P, ' Pa')} color="text-yellow-400" />
                        <TelemetryCard title="Ionization %" value={formatValue(plasmaState.I, ' %')} color="text-pink-400" />
                        <TelemetryCard title="H Composition" value={formatValue(plasmaState.H * 100, ' %')} color="text-blue-400" />
                        <TelemetryCard title="He Composition" value={formatValue(plasmaState.He * 100, ' %')} color="text-green-400" />
                        <TelemetryCard title="Heat Flux (Internal)" value={formatValue(simulator?.targetFlux || 0, ' W')} color="text-orange-400" />
                        <TelemetryCard title="Timestamp (ms)" value={plasmaState.timestamp} color="text-gray-400" />
                    </div>
                </section>
            </main>
        </div>
    );
};

export default PlasmaLabNode;
