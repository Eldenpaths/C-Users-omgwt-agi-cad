
/**
 * @file PerformanceLookupTable.ts
 * @description A real-time performance lookup table (PLT) to enable proactive decision-making.
 */
import { getFirestoreInstance } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, limit, doc, getDoc, setDoc } from "firebase/firestore";
import { linearRegression, standardDeviation } from 'simple-statistics';
import eventBus from '@/lib/EventBus';
import { sha256, stableStringify } from '@/lib/vault/index';

interface PerformanceMetric {
  id: string;
  metricName: string;
  value: number;
  unit: string;
  timestamp: Date;
  context?: any;
}

type Threshold = {
  metricName: string;
  value: number;
  callback: (metric: PerformanceMetric) => void;
};

const N_SAMPLES_FOR_TUNE = 10;
const TUNE_COOLDOWN_MS = 60 * 1000; // 60 seconds
const AUTO_TUNE_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

class PerformanceLookupTable {
  private performanceMetrics: Map<string, PerformanceMetric> = new Map();
  private thresholds: Threshold[] = [];
  private isListening = false;
  private latencyHistory: [number, number][] = [];
  private predictionWindow: number = 5;
  private alertSensitivity: number = 0.5; // S
  private latencyThreshold: number = 75; // T

  // Heuristic_v4 parameters
  private alpha: number = 0.05;
  private beta: number = 0.02;
  private gamma: number = 0.1; // Placeholder
  private delta: number = 0.1; // Placeholder
  private T_min: number = 20;
  private T_max: number = 200;
  private S_min: number = 0.1;
  private S_max: number = 1.0;
  private lastTuneTime: number = 0;
  private manualOverride: boolean = false;
  private learningMode: boolean = true;
  private settingsHistory: { T: number; S: number; timestamp: number }[] = [];

  // Placeholder for these metrics
  private alertFrequency: number = 0;
  private falsePositiveRatio: number = 0;
  private consecutiveFalsePositives: number = 0;

  constructor() {
    this.listenToPerformanceMetrics();
    this.loadConsoleSettings();

    eventBus.on('control_change', (data: any) => {
      if (data.control === 'predictionWindow') {
        this.predictionWindow = data.value;
      }
      if (data.control === 'alertSensitivity') {
        switch (data.value) {
          case 'Low':
            this.alertSensitivity = 0.25;
            break;
          case 'Medium':
            this.alertSensitivity = 0.5;
            break;
          case 'High':
            this.alertSensitivity = 0.75;
            break;
        }
      }
      if (data.control === 'latencyThreshold') {
        this.latencyThreshold = data.value;
        this.manualOverride = true; // Manual override disables learning mode
      }
      if (data.control === 'learningMode') {
        this.learningMode = data.value;
        if (!data.value) this.manualOverride = true; // Disabling learning mode implies manual override
      }
    });

    setInterval(this.autoTuneLoop, AUTO_TUNE_INTERVAL_MS);
  }

  private async loadConsoleSettings() {
    const db = getFirestoreInstance();
    const settingsRef = doc(db, 'console_settings', 'default');
    const docSnap = await getDoc(settingsRef);
    if (docSnap.exists()) {
      const settings = docSnap.data();
      this.latencyThreshold = settings.latencyThreshold ?? this.latencyThreshold;
      this.alertSensitivity = settings.alertSensitivity ?? this.alertSensitivity;
      this.predictionWindow = settings.predictionWindow ?? this.predictionWindow;
      this.learningMode = settings.learningMode ?? this.learningMode;
    }
  }

  private autoTuneLoop = async () => {
    if (!this.learningMode || this.manualOverride) {
      return;
    }
    if (Date.now() - this.lastTuneTime < TUNE_COOLDOWN_MS) {
      eventBus.emit('cooldownTriggered', { timeLeft: TUNE_COOLDOWN_MS - (Date.now() - this.lastTuneTime) });
      return;
    }

    if (this.latencyHistory.length >= N_SAMPLES_FOR_TUNE) {
      const currentLatencies = this.latencyHistory.map(d => d[1]);
      const meanLatency = currentLatencies.reduce((a, b) => a + b, 0) / currentLatencies.length;
      const stdDevLatency = standardDeviation(currentLatencies);

      // Rollback trigger: latency > 2 sigma from mean
      if (Math.abs(currentLatencies[currentLatencies.length - 1] - meanLatency) > 2 * stdDevLatency) {
        this.rollbackSettings();
        eventBus.emit('rollbackTriggered', { reason: 'Latency deviation > 2σ' });
        return;
      }

      this.tuneThresholds();
      this.lastTuneTime = Date.now();
      this.manualOverride = false; // Reset manual override after auto-tune
    }
  };

  private async rollbackSettings() {
    if (this.settingsHistory.length > 0) {
      const lastSettings = this.settingsHistory.pop();
      if (lastSettings) {
        this.latencyThreshold = lastSettings.T;
        this.alertSensitivity = lastSettings.S;
        const db = getFirestoreInstance();
        const settingsRef = doc(db, 'console_settings', 'default');
        await setDoc(settingsRef, {
          latencyThreshold: lastSettings.T,
          alertSensitivity: lastSettings.S,
        }, { merge: true });
        eventBus.emit('heuristic_update', {
          oldT: this.latencyThreshold, newT: lastSettings.T, oldS: this.alertSensitivity, newS: lastSettings.S,
          deltaT: lastSettings.T - this.latencyThreshold,
          deltaS: lastSettings.S - this.alertSensitivity,
          timestamp: Date.now(),
          metricsHash: 'rollback',
        });
      }
    }
  }

  private async tuneThresholds() {
    const db = getFirestoreInstance();
    const settingsRef = doc(db, 'console_settings', 'default');

    const currentLatencies = this.latencyHistory.map(d => d[1]);
    const currentMeanLatency = currentLatencies.reduce((a, b) => a + b, 0) / currentLatencies.length;
    const line = linearRegression(this.latencyHistory);
    const currentSlope = line.m;

    const oldT = this.latencyThreshold;
    const oldS = this.alertSensitivity;

    // Store current settings for potential rollback
    this.settingsHistory.push({ T: oldT, S: oldS, timestamp: Date.now() });
    if (this.settingsHistory.length > 3) { // Keep last 3 states
      this.settingsHistory.shift();
    }

    // Update T (latencyThreshold)
    let newT = oldT + this.alpha * (currentMeanLatency - oldT);
    const maxTChange = oldT * 0.05;
    newT = Math.max(oldT - maxTChange, Math.min(oldT + maxTChange, newT));
    newT = Math.max(this.T_min, Math.min(this.T_max, newT));

    // Update S (alertSensitivity)
    let newS = oldS + this.beta * (currentSlope - this.gamma * this.alertFrequency - this.delta * this.falsePositiveRatio);
    const maxSChange = oldS * 0.05;
    newS = Math.max(oldS - maxSChange, Math.min(oldS + maxSChange, newS));
    newS = Math.max(this.S_min, Math.min(this.S_max, newS));

    this.latencyThreshold = newT;
    this.alertSensitivity = newS;

    // Update Firestore settings
    await setDoc(settingsRef, {
      latencyThreshold: newT,
      alertSensitivity: newS,
    }, { merge: true });

    // Emit heuristic_update event
    eventBus.emit('heuristic_update', {
      oldT, newT, oldS, newS,
      deltaT: newT - oldT,
      deltaS: newS - oldS,
      timestamp: Date.now(),
    });
    eventBus.emit('tunedWeights', { newT, newS });

    // Log heuristic update to Vault
    const vaultLogger = require('@/app/tesseract/VaultLogger').default;
    const metricsHash = await sha256(stableStringify(this.latencyHistory));
    vaultLogger.logHeuristicUpdate({
      oldT, newT, oldS, newS,
      deltaT: newT - oldT,
      deltaS: newS - oldS,
      timestamp: Date.now(),
      metricsHash,
    });
    eventBus.emit('traceRecorded', { metricsHash });
  }

  private listenToPerformanceMetrics() {
    if (this.isListening) {
      return;
    }

    const q = query(collection(getFirestoreInstance(), "performance_logs"), orderBy("timestamp", "desc"), limit(50));

    onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const data = change.doc.data();
          let timestamp = new Date();
          if (data.timestamp) {
            timestamp = data.timestamp.toDate();
          }
          const metric: PerformanceMetric = {
            id: change.doc.id,
            metricName: data.metricName,
            value: data.value,
            unit: data.unit,
            timestamp,
            context: data.context,
          };
          this.performanceMetrics.set(metric.metricName, metric);
          this.checkThresholds(metric);
          this.updateLatencyHistory(metric);
        }
      });
    });

    this.isListening = true;
  }

  private updateLatencyHistory(metric: PerformanceMetric) {
    if (metric.metricName === 'engine_latency') {
      this.latencyHistory.push([metric.timestamp.getTime(), metric.value]);
      // Keep history size limited to N_SAMPLES_FOR_TUNE for mean calculation, plus predictionWindow for slope
      if (this.latencyHistory.length > Math.max(this.predictionWindow, N_SAMPLES_FOR_TUNE)) {
        this.latencyHistory.shift();
      }

      if (this.latencyHistory.length >= this.predictionWindow) {
        this.runPredictiveHeuristic();

        const currentLatencies = this.latencyHistory.map(d => d[1]);
        if (currentLatencies.length >= N_SAMPLES_FOR_TUNE) { // Ensure enough samples for stdDev
          const meanLatency = currentLatencies.reduce((a, b) => a + b, 0) / currentLatencies.length;
          const stdDevLatency = standardDeviation(currentLatencies);
          const latestLatency = currentLatencies[currentLatencies.length - 1];

          if (Math.abs(latestLatency - meanLatency) > 3 * stdDevLatency) {
            eventBus.emit('anomalyDetected', { latestLatency, meanLatency, stdDevLatency });
            const vaultLogger = require('@/app/tesseract/VaultLogger').default;
            vaultLogger.logAnomaly({ latestLatency, meanLatency, stdDevLatency });
          }
        }
      }
    }
  }

  private runPredictiveHeuristic() {
    const line = linearRegression(this.latencyHistory.slice(-this.predictionWindow));
    const slope = line.m;

    if (slope > this.alertSensitivity) {
      eventBus.emit('predictive_alert', { slope });
    }
  }

  public getMetric(metricName: string): PerformanceMetric | undefined {
    return this.performanceMetrics.get(metricName);
  }

  public getLatencyThreshold(): number {
    return this.latencyThreshold;
  }

  public getAlertSensitivity(): number {
    return this.alertSensitivity;
  }

  public addThreshold(threshold: Threshold) {
    this.thresholds.push(threshold);
  }

  private checkThresholds(metric: PerformanceMetric) {
    for (const threshold of this.thresholds) {
      if (metric.metricName === threshold.metricName && metric.value > this.latencyThreshold) { // Use self-tuning T
        threshold.callback(metric);
      }
    }
  }
}

const performanceLookupTable = new PerformanceLookupTable();
export default performanceLookupTable;
