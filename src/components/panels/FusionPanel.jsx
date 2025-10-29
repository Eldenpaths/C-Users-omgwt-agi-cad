// CLAUDE-META: Phase 10E Vault & Fusion Bridge - Telemetry Dashboard
// Architect: ChatGPT (GPT-5) Canonical Authority
// Purpose: Real-time drift/trust telemetry visualization
// Status: Production - Phase 10E Active

'use client';

import { useEffect, useState } from 'react';
import { getFusionBridge } from '@/lib/meta/fusion-bridge';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function FusionPanel() {
  const [stats, setStats] = useState({
    totalEvents: 0,
    driftEvents: 0,
    trustEvents: 0,
    rollbackEvents: 0,
    avgDrift: 0,
    avgTrust: 0,
  });
  const [recentEvents, setRecentEvents] = useState([]);
  const [telemetryData, setTelemetryData] = useState([]);

  useEffect(() => {
    // Initialize Fusion Bridge
    const bridge = getFusionBridge();
    bridge.initialize().catch(console.error);

    // Update stats every 2 seconds
    const statsInterval = setInterval(() => {
      const currentStats = bridge.getTelemetryStats();
      setStats(currentStats);

      const events = bridge.getRecentEvents(10);
      setRecentEvents(events);
    }, 2000);

    // Listen to Firestore telemetry collection
    const telemetryQuery = query(
      collection(db, 'telemetry'),
      orderBy('timestamp', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(telemetryQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTelemetryData(data);
    });

    return () => {
      clearInterval(statsInterval);
      unsubscribe();
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="forge-panel p-6">
        <h2 className="text-2xl font-serif mb-4 text-amber-200">
          Fusion Dashboard
        </h2>
        <p className="text-amber-400 text-sm mb-6">
          Real-time telemetry: Drift Detection + Trust Scoring + Rollback Monitoring
        </p>

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <StatCard
            label="Total Events"
            value={stats.totalEvents}
            icon="📊"
          />
          <StatCard
            label="Drift Events"
            value={stats.driftEvents}
            icon="🌀"
            color="amber"
          />
          <StatCard
            label="Trust Updates"
            value={stats.trustEvents}
            icon="🛡️"
            color="green"
          />
          <StatCard
            label="Rollbacks"
            value={stats.rollbackEvents}
            icon="↩️"
            color="red"
          />
          <StatCard
            label="Avg Drift"
            value={stats.avgDrift.toFixed(3)}
            icon="📈"
            color="yellow"
          />
          <StatCard
            label="Avg Trust"
            value={stats.avgTrust.toFixed(3)}
            icon="⭐"
            color="blue"
          />
        </div>

        {/* Recent Events Buffer */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-amber-300">
            Recent Events (Buffer)
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {recentEvents.length === 0 ? (
              <div className="text-amber-400/60 text-sm italic">
                No events in buffer. Waiting for telemetry...
              </div>
            ) : (
              recentEvents.map((event, idx) => (
                <EventRow key={idx} event={event} />
              ))
            )}
          </div>
        </div>

        {/* Firestore Telemetry Log */}
        <div>
          <h3 className="text-lg font-semibold mb-3 text-amber-300">
            Firestore Telemetry Log
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {telemetryData.length === 0 ? (
              <div className="text-amber-400/60 text-sm italic">
                No telemetry data in Firestore. Start logging events...
              </div>
            ) : (
              telemetryData.map((entry) => (
                <TelemetryRow key={entry.id} entry={entry} />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Drift Monitor Panel */}
      <div className="forge-panel p-6">
        <h3 className="text-xl font-serif mb-4 text-amber-200">
          Drift Monitor
        </h3>
        <div className="space-y-3">
          <MetricBar
            label="Drift Threshold"
            value={0.1}
            max={1.0}
            color="amber"
          />
          <MetricBar
            label="Entropy Threshold"
            value={0.5}
            max={1.0}
            color="purple"
          />
          <MetricBar
            label="Current Avg Drift"
            value={stats.avgDrift}
            max={1.0}
            color={stats.avgDrift > 0.1 ? 'red' : 'green'}
          />
        </div>
      </div>

      {/* Trust Scoring Panel */}
      <div className="forge-panel p-6">
        <h3 className="text-xl font-serif mb-4 text-amber-200">
          Bayesian Trust Scoring
        </h3>
        <div className="space-y-3">
          <div className="text-amber-400 text-sm">
            Formula: trust = α / (α + β)
          </div>
          <MetricBar
            label="Average Trust Score"
            value={stats.avgTrust}
            max={1.0}
            color={stats.avgTrust > 0.6 ? 'green' : 'yellow'}
          />
          <div className="text-amber-400/80 text-xs">
            Trust updates automatically on task completion and drift detection
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color = 'amber' }) {
  const colorClass = {
    amber: 'bg-amber-900/30 border-amber-700',
    green: 'bg-green-900/30 border-green-700',
    red: 'bg-red-900/30 border-red-700',
    blue: 'bg-blue-900/30 border-blue-700',
    yellow: 'bg-yellow-900/30 border-yellow-700',
  }[color] || 'bg-amber-900/30 border-amber-700';

  return (
    <div className={`${colorClass} border rounded-lg p-4`}>
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-sm text-amber-400/80">{label}</div>
      <div className="text-2xl font-bold text-amber-200">{value}</div>
    </div>
  );
}

function EventRow({ event }) {
  const typeColors = {
    drift: 'text-amber-400',
    trust: 'text-green-400',
    rollback: 'text-red-400',
    modification: 'text-blue-400',
    heartbeat: 'text-purple-400',
  };

  const typeIcons = {
    drift: '🌀',
    trust: '🛡️',
    rollback: '↩️',
    modification: '📝',
    heartbeat: '💓',
  };

  return (
    <div className="bg-gray-800/50 rounded px-3 py-2 text-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span>{typeIcons[event.type]}</span>
          <span className={typeColors[event.type]}>{event.type}</span>
          {event.agentId && (
            <span className="text-amber-400/60 text-xs">
              {event.agentId}
            </span>
          )}
        </div>
        <span className="text-amber-400/40 text-xs">
          {new Date(event.timestamp).toLocaleTimeString()}
        </span>
      </div>
      {event.data && (
        <div className="text-amber-400/60 text-xs mt-1">
          {JSON.stringify(event.data, null, 0)}
        </div>
      )}
    </div>
  );
}

function TelemetryRow({ entry }) {
  const typeColors = {
    drift: 'bg-amber-900/20 border-amber-700',
    trust: 'bg-green-900/20 border-green-700',
    rollback: 'bg-red-900/20 border-red-700',
    modification: 'bg-blue-900/20 border-blue-700',
  };

  return (
    <div className={`${typeColors[entry.type] || 'bg-gray-800/50'} border rounded px-3 py-2 text-sm`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-amber-300 font-semibold">{entry.type}</span>
        <span className="text-amber-400/40 text-xs">
          {entry.timestamp?.toDate?.().toLocaleTimeString() || 'N/A'}
        </span>
      </div>
      {entry.agentId && (
        <div className="text-amber-400/80 text-xs">
          Agent: {entry.agentId}
        </div>
      )}
      {entry.driftScore !== undefined && (
        <div className="text-amber-400/80 text-xs">
          Drift: {entry.driftScore.toFixed(4)} | Entropy: {entry.entropyScore?.toFixed(4)}
        </div>
      )}
      {entry.trustScore !== undefined && (
        <div className="text-amber-400/80 text-xs">
          Trust: {entry.trustScore.toFixed(3)} | α={entry.alpha}, β={entry.beta}
        </div>
      )}
      {entry.modificationId && (
        <div className="text-amber-400/80 text-xs">
          Rollback: {entry.modificationId} ({entry.rolledBackCount} mods)
        </div>
      )}
    </div>
  );
}

function MetricBar({ label, value, max, color }) {
  const percentage = (value / max) * 100;

  const colorClass = {
    amber: 'bg-amber-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500',
    yellow: 'bg-yellow-500',
  }[color] || 'bg-amber-500';

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-amber-400">{label}</span>
        <span className="text-amber-300 font-semibold">
          {value.toFixed(3)} / {max.toFixed(1)}
        </span>
      </div>
      <div className="w-full bg-gray-800 rounded-full h-2">
        <div
          className={`${colorClass} h-2 rounded-full transition-all duration-500`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}
