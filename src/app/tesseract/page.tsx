"use client";

import { useState, useEffect } from 'react';
import { VaultLogger } from '@/lib/vault/vault-logger';
import vaultLogger from './VaultLogger';
import dynamic from 'next/dynamic';
import { getFirestoreInstance } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy, Timestamp, limit } from 'firebase/firestore';
import { useControls } from 'leva';


const PerformanceChart = dynamic(() => import('@/components/tesseract/PerformanceChart'), { ssr: false });
const DelegationLog = dynamic(() => import('@/components/tesseract/DelegationLog'), { ssr: false });
const ControlPanel = dynamic(() => import('@/components/tesseract/ControlPanel'), { ssr: false });

/**
 * A placeholder component for visualizing engine performance curves.
 * This would be replaced with a real charting library like Recharts or Chart.js.
 */
function EnginePerformanceChart({ engineName, data, color, predictiveAlert }: { engineName: string, data: { particles: number, latency: number }[], color: string, predictiveAlert: any }) {
  // This is a simplified SVG representation. A real implementation would be more robust.
  const path = data.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.particles / 1000} ${100 - p.latency}`).join(' ');

  const isActiveAlert = predictiveAlert && predictiveAlert.context && predictiveAlert.context.engine === engineName;
  const borderColor = isActiveAlert ? 'border-red-500 animate-pulse' : 'border-transparent';

  return (
    <div className={`forge-panel p-4 rounded-lg border-2 ${borderColor}`}>
      <h4 className="text-sm font-bold text-white mb-2">{engineName} Performance Curve</h4>
      <svg viewBox="0 0 100 100" className="w-full h-40">
        <path d={path} stroke={color} strokeWidth="2" fill="none" />
        <text x="50" y="98" fill="white" fontSize="5" textAnchor="middle">Particles (k)</text>
        <text x="2" y="50" fill="white" fontSize="5" transform="rotate(-90, 2, 50)">Latency (ms)</text>
      </svg>
    </div>
  );
}


export default function OperatorTriageConsole() {
  const [metrics, setMetrics] = useState<any[]>([]);
  const [predictiveAlert, setPredictiveAlert] = useState<any>(null);
  const [thresholdHistory, setThresholdHistory] = useState<{ value: number; timestamp: Date }[]>([]);
  const [tuneBanner, setTuneBanner] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });
  const [latencyStdDev, setLatencyStdDev] = useState<number>(0);
  const [alertSensitivityHistory, setAlertSensitivityHistory] = useState<{ value: number; timestamp: Date }[]>([]);

  const [{ latencyThreshold, learningMode, alertSensitivity }] = useControls(() => ({
    latencyThreshold: {
      value: 75,
      min: 0,
      max: 500,
      step: 1,
      label: 'Latency Threshold (ms)',
    },
    learningMode: {
      value: true,
      label: 'Learning Mode',
    },
    alertSensitivity: {
      value: 'Medium',
      options: ['Low', 'Medium', 'High'],
      label: 'Alert Sensitivity',
    },
  }));

  // Convert string alertSensitivity to number
  const alertSensitivityValue = alertSensitivity === 'Low' ? 0.25 : alertSensitivity === 'High' ? 0.75 : 0.5;

  // Placeholder data based on your benchmark plan. You would replace this with your actual results.
  const rapierBenchmarkData = [
    { particles: 10000, latency: 10 },
    { particles: 50000, latency: 15 },
    { particles: 100000, latency: 25 },
    { particles: 200000, latency: 85 }, // Latency spike
  ];

  const taichiBenchmarkData = [
    { particles: 10000, latency: 30 },
    { particles: 50000, latency: 35 },
    { particles: 100000, latency: 40 },
    { particles: 200000, latency: 45 },
  ];

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const eventBus = require('@/lib/EventBus').default;
      const performanceLookupTable = require('@/lib/monitoring/PerformanceLookupTable').default;

      eventBus.on('predictive_alert', (data: any) => {
        setPredictiveAlert(data);
        VaultLogger.log({
          log_type: 'predictive_alert',
          data,
          source: 'PerformanceLookupTable',
        });
      });

      eventBus.on('heuristic_update', (data: any) => {
        setThresholdHistory(prev => [...prev, { value: data.newT, timestamp: new Date(data.timestamp) }]);
        setAlertSensitivityHistory(prev => [...prev, { value: data.newS, timestamp: new Date(data.timestamp) }]);
        setTuneBanner({ message: `Tuned Automatically (ΔT: ${((data.newT - data.oldT) / data.oldT * 100).toFixed(2)}%, ΔS: ${((data.newS - data.oldS) / data.oldS * 100).toFixed(2)}%)`, visible: true });
        setTimeout(() => setTuneBanner({ message: '', visible: false }), 5000);
      });

      performanceLookupTable.addThreshold({
        metricName: 'engine_latency',
        value: 80,
        callback: (metric) => {
          VaultLogger.log({
            log_type: 'system_alert',
            data: {
              message: `High latency detected in ${metric.context.engine} engine.`,
              metric,
            },
            source: 'PerformanceLookupTable',
          });
        },
      });

      const q = query(collection(getFirestoreInstance(), "performance_logs"), orderBy("timestamp", "desc"), limit(50));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const newMetrics: any[] = [];
        const currentLatencies: number[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data && data.timestamp) {
            const timestamp = (data.timestamp as Timestamp).toDate();
            newMetrics.push({
              value: data.value,
              timestamp: timestamp,
            });
            currentLatencies.push(data.value);
          }
        });
        setMetrics(newMetrics.reverse());
        if (currentLatencies.length > 1) {
          const stdDev = require('simple-statistics').standardDeviation(currentLatencies);
          setLatencyStdDev(stdDev);
        }
      });

      return () => unsubscribe();
    }
  }, []);

  const logDummyData = () => {
    vaultLogger.logPerformance({
      metricName: 'engine_latency',
      value: Math.random() * 100 + 20, // Random latency between 20 and 120
      unit: 'ms',
      context: { engine: 'Rapier' },
    });
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8 font-sans">
      <header className="text-center mb-12">
        <h1 className="text-5xl font-extrabold text-cyan-400">Operator Triage Console</h1>
        <p className="text-gray-400 mt-2">Real-time monitoring of the Nexus Multi-Engine Delegator (NMED).</p>
        {learningMode && (
          <div className="mt-2 text-cyan-400 font-bold animate-pulse">Learning Mode Active</div>
        )}
        {predictiveAlert && (
          <div className="mt-4 p-2 bg-yellow-500/20 text-yellow-300 rounded-lg animate-pulse">
            <span className="font-bold">PREDICTIVE ALERT ACTIVE:</span> High latency slope detected ({predictiveAlert.slope.toFixed(4)})
          </div>
        )}
        {tuneBanner.visible && (
          <div className="mt-4 p-2 bg-cyan-500/20 text-cyan-300 rounded-lg animate-pulse">
            <span className="font-bold">Self-Tuning Active ✓:</span> {tuneBanner.message}
          </div>
        )}
      </header>

      <main className="max-w-6xl mx-auto">
        <div className="fixed top-24 right-4 z-10">
          <ControlPanel />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <EnginePerformanceChart
            engineName="Rapier"
            data={rapierBenchmarkData}
            color="#48BB78" // Green
            predictiveAlert={predictiveAlert}
          />
          <EnginePerformanceChart
            engineName="Taichi (WebGPU)"
            data={taichiBenchmarkData}
            color="#4299E1" // Blue
            predictiveAlert={predictiveAlert}
          />
        </div>

        <div className="mt-6">
          <button onClick={logDummyData} className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded">
            Log Dummy Latency Spike
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <PerformanceChart metricName="Engine Latency" data={metrics} color="#F59E0B" threshold={latencyThreshold} prediction={predictiveAlert} thresholdHistory={thresholdHistory} alertSensitivity={alertSensitivityValue} latencyStdDev={latencyStdDev} alertSensitivityHistory={alertSensitivityHistory} />
          <DelegationLog />
        </div>
      </main>
    </div>
  );
}





























