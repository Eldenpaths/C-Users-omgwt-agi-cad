
"use client";

import React from 'react';

interface PerformanceChartProps {
  metricName: string;
  data: { value: number; timestamp: Date }[];
  color: string;
  threshold?: number;
  prediction?: { slope: number };
  thresholdHistory?: { value: number; timestamp: Date }[];
  alertSensitivity?: number;
  latencyStdDev?: number;
  alertSensitivityHistory?: { value: number; timestamp: Date }[];
}

export default function PerformanceChart({ metricName, data, color, threshold, prediction, thresholdHistory, alertSensitivity, latencyStdDev, alertSensitivityHistory }: PerformanceChartProps) {
  if (!data || data.length < 2) {
    return (
      <div className="forge-panel p-4 rounded-lg mt-6">
        <h4 className="text-sm font-bold text-white mb-2">{metricName}</h4>
        <div className="w-full h-40 flex items-center justify-center text-gray-500">Not enough data to display chart</div>
      </div>
    );
  }

  const allValues = [...data.map(d => d.value), threshold || 0];
  if (thresholdHistory) {
    allValues.push(...thresholdHistory.map(d => d.value));
  }
  const maxValue = Math.max(...allValues);
  const minValue = Math.min(...allValues);

  const dataPath = data.map((p, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((p.value - minValue) / (maxValue - minValue)) * 100;
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  const thresholdPath = thresholdHistory?.map((p, i) => {
    const x = (i / (thresholdHistory.length - 1)) * 100;
    const y = 100 - ((p.value - minValue) / (maxValue - minValue)) * 100;
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  const thresholdY = threshold !== undefined ? 100 - ((threshold - minValue) / (maxValue - minValue)) * 100 : 0;

  const alertSensitivityPath = alertSensitivityHistory?.map((p, i) => {
    const x = (i / (alertSensitivityHistory.length - 1)) * 100;
    const y = 100 - ((p.value - minValue) / (maxValue - minValue)) * 100;
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  const lowerBound = data.map((p, i) => p.value - 2 * (latencyStdDev || 0));
  const upperBound = data.map((p, i) => p.value + 2 * (latencyStdDev || 0));

  const upperBandPath = upperBound.map((value, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((value - minValue) / (maxValue - minValue)) * 100;
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  const lowerBandPath = lowerBound.map((value, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((value - minValue) / (maxValue - minValue)) * 100;
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  const anomalyDetected = prediction && prediction.slope > ((alertSensitivity || 0.5) * 3); // Simplified anomaly condition for visualization
  const driftDetected = prediction && prediction.slope > (alertSensitivity || 0.5);

  let zoneColor = '#00FF00'; // Green for Stable
  if (driftDetected) {
    zoneColor = '#FFA500'; // Amber for Drift
  }
  if (anomalyDetected) {
    zoneColor = '#FF0000'; // Red for Anomaly
  }

  return (
    <div className="forge-panel p-4 rounded-lg mt-6">
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-sm font-bold text-white">{metricName}</h4>
        {prediction && (
          <div className="text-xs text-yellow-300">Slope: {prediction.slope.toFixed(4)}</div>
        )}
      </div>
      <svg viewBox="0 0 100 100" className="w-full h-40">
        <rect x="0" y="0" width="100" height="100" fill={zoneColor} opacity="0.1" />
        {threshold && (
          <line x1="0" y1={thresholdY} x2="100" y2={thresholdY} stroke="#EF4444" strokeWidth="1" strokeDasharray="2" />
        )}
        {thresholdPath && (
          <path d={thresholdPath} stroke="#8B5CF6" strokeWidth="1" fill="none" />
        )}
        {alertSensitivityPath && (
          <path d={alertSensitivityPath} stroke="#00BFFF" strokeWidth="1" fill="none" />
        )}
        {latencyStdDev !== undefined && (
          <path d={upperBandPath} stroke="#FBBF24" strokeWidth="0.5" fill="none" strokeDasharray="1" />
        )}
        {latencyStdDev !== undefined && (
          <path d={lowerBandPath} stroke="#FBBF24" strokeWidth="0.5" fill="none" strokeDasharray="1" />
        )}
        <path d={dataPath} stroke={color} strokeWidth="2" fill="none" />
        <text x="50" y="98" fill="white" fontSize="5" textAnchor="middle">Time</text>
        <text x="2" y="50" fill="white" fontSize="5" transform="rotate(-90, 2, 50)">Value</text>
      </svg>
    </div>
  );
}
