"use client";

import { useState, useEffect } from 'react';
import eventBus from '@/lib/EventBus';

interface LogEntry {
  id: string;
  timestamp: string;
  reason: string;
  type: 'Delegation' | 'Heuristic Update' | 'Rollback' | 'Trace' | 'Anomaly';
  from?: string;
  to?: string;
  cost?: number;
  metricsHash?: string;
}

export default function DelegationLog() {
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    const unsubscribe = eventBus.on('delegationRequested', (data: any) => {
      setLogEntries(prev => [{
        id: `delegation-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        reason: data.reason || 'Delegation requested',
        type: 'Delegation',
        from: data.from,
        to: data.to,
        cost: data.cost || 0,
      }, ...prev]);
    });

    const unsubscribeHeuristic = eventBus.on('heuristicUpdated', (data: any) => {
      setLogEntries(prev => [{
        id: `heuristic-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        reason: 'Heuristic table updated',
        type: 'Heuristic Update',
        metricsHash: data.metricsHash,
      }, ...prev]);
    });

    const unsubscribeRollback = eventBus.on('rollbackTriggered', (data: any) => {
      setLogEntries(prev => [{
        id: `rollback-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        reason: data.reason || 'Rollback triggered',
        type: 'Rollback',
      }, ...prev]);
    });

    const unsubscribeTrace = eventBus.on('traceRecorded', (data: any) => {
      setLogEntries(prev => [{
        id: `trace-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        reason: `Trace Recorded: Hash ${data.metricsHash.substring(0, 8)}...`,
        type: 'Trace',
      }, ...prev]);
    });

    const unsubscribeAnomaly = eventBus.on('anomalyDetected', (data: any) => {
      setLogEntries(prev => [{
        id: `anomaly-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        reason: `ANOMALY DETECTED: Latency ${data.latestLatency.toFixed(2)} (Mean: ${data.meanLatency.toFixed(2)}, StdDev: ${data.stdDevLatency.toFixed(2)})`,
        type: 'Anomaly',
      }, ...prev]);
    });

    return () => {
      unsubscribe();
      unsubscribeHeuristic();
      unsubscribeRollback();
      unsubscribeTrace();
      unsubscribeAnomaly();
    };
  }, [filter]);

  const filteredEntries = logEntries.filter(entry => {
    if (filter === 'All') return true;
    if (filter === 'Delegation' && entry.type === 'Delegation') return true;
    if (filter === 'Heuristic Update' && entry.type === 'Heuristic Update') return true;
    if (filter === 'Rollback' && entry.type === 'Rollback') return true;
    if (filter === 'Trace' && entry.type === 'Trace') return true;
    if (filter === 'Anomaly' && entry.type === 'Anomaly') return true;
    return false;
  });

  return (
    <div className="forge-panel p-4 rounded-lg mt-6">
      <div className="flex justify-between items-center mb-3">
        <h4 className="text-sm font-bold text-white">NMED Delegation Log</h4>
        <select
          className="bg-gray-700 text-white text-xs rounded p-1"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="All">All</option>
          <option value="Delegation">Delegations</option>
          <option value="Heuristic Update">Heuristic Updates</option>
          <option value="Rollback">Rollbacks</option>
          <option value="Trace">Traces</option>
          <option value="Anomaly">Anomalies</option>
        </select>
      </div>
      <div className="font-mono text-xs space-y-2">
        {filteredEntries.map((entry) => (
          <div key={entry.id} className="flex justify-between items-center bg-gray-900/50 p-2 rounded">
            <span className="text-gray-400">{entry.timestamp}</span>
            <span className="text-cyan-400 flex-1 px-4">{entry.reason}</span>
            <div className="text-right">
              {entry.type === 'Delegation' && (
                <>
                  <span className="text-gray-500">{entry.from} → {entry.to}</span>
                  <span className="text-yellow-500 ml-2">(${entry.cost?.toFixed(4)})</span>
                </>
              )}
              {entry.type === 'Heuristic Update' && (
                <span className="text-purple-400 ml-2">Hash: {entry.metricsHash?.substring(0, 8)}...</span>
              )}
              {entry.type === 'Rollback' && (
                <span className="text-red-400 ml-2">{entry.reason}</span>
              )}
              {entry.type === 'Trace' && (
                <span className="text-green-400 ml-2">{entry.reason}</span>
              )}
              {entry.type === 'Anomaly' && (
                <span className="text-red-500 ml-2">{entry.reason}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
