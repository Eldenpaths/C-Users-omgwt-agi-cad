import { useEffect, useState } from 'react';
import { Analyzer, type AnalyticsSummary } from '@/lib/learning/analyzer';
import { useLearningSessions, useTelemetryFeed } from '@/lib/learning/hooks';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { getAuthInstance } from '@/lib/firebase/client';

function LearningDashboardContent() {
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const [agentId] = useState<string | undefined>(undefined);

  useEffect(() => {
    const auth = getAuthInstance();
    if (!auth) return;
    const unsub = auth.onAuthStateChanged((u) => setUserId(u?.uid || undefined));
    return () => unsub();
  }, []);

  const { data: sessions, loading: sessionsLoading } = useLearningSessions(userId);
  const { data: telemetry, loading: telemetryLoading } = useTelemetryFeed(agentId);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoadingSummary(true);
      const s = await Analyzer.summarize({ userId, agentId, days: 7, maxSessions: 200 });
      if (active) {
        setSummary(s);
        setLoadingSummary(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [userId, agentId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-amber-400 mb-2">Learning Dashboard</h1>
          <p className="text-gray-400">Monitor experiment sessions and learning analytics</p>
        </div>

        {/* Overview Cards */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-amber-300 mb-4">Overview</h2>
          {loadingSummary ? (
            <div className="flex items-center gap-2 text-gray-400">
              <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
              <span>Loading analytics...</span>
            </div>
          ) : summary && summary.totalSessions > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card title="Total Sessions" value={summary.totalSessions} />
              <Card title="Success Rate" value={`${Math.round(summary.successRate * 100)}%`} />
              <Card title="Avg Runtime" value={summary.averageRuntimeMs ? `${summary.averageRuntimeMs}ms` : '—'} />
              <Card title="Errors/Session" value={summary.errorFrequency.toFixed(2)} />
            </div>
          ) : (
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 text-center">
              <p className="text-gray-400">No learning sessions yet. Run experiments to see analytics.</p>
            </div>
          )}
        </section>

        {/* Suggestions */}
        {summary?.suggestions && summary.suggestions.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-amber-300 mb-4">Suggestions</h2>
            <div className="bg-amber-900/20 border border-amber-700/50 rounded-lg p-4">
              <ul className="space-y-2">
                {summary.suggestions.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-amber-200">
                    <span className="text-amber-400 mt-1">•</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* Recent Sessions */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-amber-300 mb-4">Recent Sessions</h2>
          {sessionsLoading ? (
            <div className="flex items-center gap-2 text-gray-400">
              <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
              <span>Loading sessions...</span>
            </div>
          ) : sessions.length > 0 ? (
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg divide-y divide-gray-700">
              {sessions.slice(0, 10).map((s) => (
                <div key={s.id} className="p-4 hover:bg-gray-800/80 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="inline-block px-2 py-0.5 bg-amber-900/30 text-amber-300 text-xs font-medium rounded border border-amber-700/50">
                          {String(s.labType).toUpperCase()}
                        </span>
                        {s.metrics?.success && (
                          <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                        )}
                      </div>
                      <p className="text-gray-300 text-sm">{s.summary}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 text-center">
              <p className="text-gray-400">No sessions found. Run experiments to populate this list.</p>
            </div>
          )}
        </section>

        {/* Telemetry Feed */}
        <section>
          <h2 className="text-xl font-semibold text-amber-300 mb-4">Telemetry Feed</h2>
          {telemetryLoading ? (
            <div className="flex items-center gap-2 text-gray-400">
              <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
              <span>Loading telemetry...</span>
            </div>
          ) : telemetry.length > 0 ? (
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 max-h-64 overflow-y-auto">
              <div className="space-y-1 font-mono text-xs">
                {telemetry.slice(0, 20).map((t) => (
                  <div key={t.id} className="text-gray-400">
                    <span className="text-amber-400">{t.event}</span>
                    {t.labType && <span className="text-gray-500"> ({t.labType})</span>}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 text-center">
              <p className="text-gray-400">No telemetry events yet.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default function LearningDashboard() {
  return (
    <ErrorBoundary>
      <LearningDashboardContent />
    </ErrorBoundary>
  );
}

function Card({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-amber-700/50 transition-colors">
      <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">{title}</div>
      <div className="text-2xl font-bold text-amber-400">{value}</div>
    </div>
  );
}

