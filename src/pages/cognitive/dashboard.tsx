import { useEffect, useState } from 'react';
import { getAuthInstance } from '@/lib/firebase/client';
import { useCVRAResults } from '@/lib/cognitive/hooks';
import CVRAgent from '@/lib/cognitive/cvraCore';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function CognitiveDashboardContent() {
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const [running, setRunning] = useState(false);
  const [lastRun, setLastRun] = useState<string | null>(null);
  const { data: suggestions, loading } = useCVRAResults(userId);

  useEffect(() => {
    const auth = getAuthInstance();
    // If SSR or not initialized, auth may be null
    if (!auth) return;
    const unsub = auth.onAuthStateChanged((u) => setUserId(u?.uid || undefined));
    return () => unsub();
  }, []);

  const runAnalysis = async () => {
    if (!userId) return;
    setRunning(true);
    try {
      const agent = new CVRAgent(1.5);
      const result = await agent.analyzeUser(userId, { maxSessions: 300 });
      setLastRun(`Analyzed ${result.analyzedCount}; created ${result.suggestionsCreated} suggestions.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setLastRun(`Analysis failed: ${message}`);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-amber-400 mb-2">CVRA Dashboard</h1>
          <p className="text-gray-400">Canon-Vault Reconciliation Agent analyzes learning sessions for anomalous success patterns</p>
        </div>

        {/* Analysis Controls */}
        <div className="mb-8 bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <button
              onClick={runAnalysis}
              disabled={!userId || running}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                !userId || running
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-amber-600 hover:bg-amber-700 text-white shadow-lg hover:shadow-amber-600/50'
              }`}
            >
              {running ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Running Analysis...
                </span>
              ) : (
                'Run Analysis'
              )}
            </button>
            {lastRun && (
              <span className="text-sm text-gray-400 italic">{lastRun}</span>
            )}
            {!userId && (
              <span className="text-sm text-amber-400">Please log in to run analysis</span>
            )}
          </div>
        </div>

        {/* Suggestions */}
        <section>
          <h2 className="text-xl font-semibold text-amber-300 mb-4">CANON Deviation Suggestions</h2>
          {loading ? (
            <div className="flex items-center gap-2 text-gray-400">
              <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
              <span>Loading suggestions...</span>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 text-center">
              <p className="text-gray-400">No suggestions yet. Run analysis to detect anomalous patterns.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {suggestions.map((s) => (
                <div key={s.id} className="bg-gray-800/50 border border-amber-700/50 rounded-lg p-6 hover:border-amber-600/70 transition-colors">
                  {/* Header */}
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-4 border-b border-gray-700">
                    <div className="flex items-center gap-3">
                      <span className="inline-block px-3 py-1 bg-amber-900/30 text-amber-300 text-sm font-medium rounded border border-amber-700/50">
                        {String(s.labType).toUpperCase()}
                      </span>
                      <code className="text-xs text-gray-500">Session: {s.sessionId.slice(0, 8)}...</code>
                    </div>
                  </div>

                  {/* Reason */}
                  <div className="mb-4">
                    <p className="text-gray-300 text-sm">{s.reason}</p>
                  </div>

                  {/* Proposed Deviation */}
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-amber-300 mb-2">Proposed CANON Deviation:</h3>
                    <div className="bg-gray-950/60 border border-gray-700 rounded-lg p-4">
                      <div className="text-xs text-gray-400 mb-2">Target Lab: <span className="text-amber-400">{s.proposedCanonDeviation.targetLab}</span></div>
                      <div className="text-xs text-gray-400 mb-3">{s.proposedCanonDeviation.rationale}</div>
                      <div className="space-y-2">
                        {s.proposedCanonDeviation.suggestedChange.map((change, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs">
                            <span className="text-gray-500">{change.key}:</span>
                            <span className={change.op === 'increase' ? 'text-green-400' : 'text-red-400'}>
                              {change.op === 'increase' ? '↑' : '↓'} {change.magnitude}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Anomalies Details */}
                  <details className="group">
                    <summary className="cursor-pointer text-sm text-amber-400 hover:text-amber-300 transition-colors list-none flex items-center gap-2">
                      <span className="transform group-open:rotate-90 transition-transform">▶</span>
                      View Detected Anomalies ({s.anomalies.length})
                    </summary>
                    <div className="mt-3 space-y-2">
                      {s.anomalies.map((a, i) => (
                        <div key={i} className="bg-gray-950/40 border border-gray-700 rounded p-3 text-xs font-mono">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-amber-400">{a.metric}</span>
                            <span className="text-gray-500">|</span>
                            <span className="text-gray-300">value: {a.value.toFixed(2)}</span>
                            <span className="text-gray-300">mean: {a.mean.toFixed(2)}</span>
                            <span className="text-gray-300">σ: {a.stdDev.toFixed(2)}</span>
                            <span className={`font-bold ${Math.abs(a.z) > 2 ? 'text-red-400' : 'text-yellow-400'}`}>
                              z={a.z.toFixed(2)}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-xs ${a.direction === 'high' ? 'bg-red-900/30 text-red-300' : 'bg-blue-900/30 text-blue-300'}`}>
                              {a.direction}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </details>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default function CognitiveDashboard() {
  return (
    <ErrorBoundary>
      <CognitiveDashboardContent />
    </ErrorBoundary>
  );
}

