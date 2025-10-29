// CLAUDE-META: Phase 10F Telemetry Testing - Test UI Page
// Architect: Claude Code (Sonnet 4.5)
// Purpose: Browser-based telemetry testing interface
// Status: Production - Phase 10F Active

'use client';

import { useState } from 'react';
import Layout from '../../components/Layout';
import {
  generateDriftEvent,
  generateTrustEvent,
  generateRollbackEvent,
  generateModificationEvent,
  runTelemetryTest,
  startTelemetryStream,
  populateVaultSampleData,
} from '../../lib/test/telemetryTestUtils';

export default function TelemetryTestPage() {
  const [logs, setLogs] = useState([]);
  const [streaming, setStreaming] = useState(false);
  const [streamStop, setStreamStop] = useState(null);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { timestamp, message, type }]);
  };

  const handleRunFullTest = async () => {
    addLog('Starting full telemetry test suite...', 'info');
    try {
      await runTelemetryTest();
      addLog('Full test suite completed successfully!', 'success');
    } catch (error) {
      addLog(`Test suite failed: ${error.message}`, 'error');
    }
  };

  const handleGenerateDrift = async (severity) => {
    addLog(`Generating ${severity} drift event...`, 'info');
    try {
      await generateDriftEvent('agent-test', severity);
      addLog(`${severity} drift event generated`, 'success');
    } catch (error) {
      addLog(`Failed to generate drift event: ${error.message}`, 'error');
    }
  };

  const handleGenerateTrust = async (performance) => {
    addLog(`Generating ${performance} trust event...`, 'info');
    try {
      await generateTrustEvent('agent-test', performance);
      addLog(`${performance} trust event generated`, 'success');
    } catch (error) {
      addLog(`Failed to generate trust event: ${error.message}`, 'error');
    }
  };

  const handleGenerateRollback = async () => {
    addLog('Generating rollback event...', 'info');
    try {
      await generateRollbackEvent('Manual test rollback');
      addLog('Rollback event generated', 'success');
    } catch (error) {
      addLog(`Failed to generate rollback event: ${error.message}`, 'error');
    }
  };

  const handleGenerateModification = async (approved) => {
    addLog(`Generating ${approved ? 'approved' : 'rejected'} modification...`, 'info');
    try {
      await generateModificationEvent('agent-test', approved);
      addLog(`Modification ${approved ? 'approved' : 'rejected'} event generated`, 'success');
    } catch (error) {
      addLog(`Failed to generate modification event: ${error.message}`, 'error');
    }
  };

  const handleStartStream = async () => {
    addLog('Starting continuous telemetry stream...', 'info');
    try {
      const stopFn = await startTelemetryStream(3000);
      setStreamStop(() => stopFn);
      setStreaming(true);
      addLog('Telemetry stream started (3s interval)', 'success');
    } catch (error) {
      addLog(`Failed to start stream: ${error.message}`, 'error');
    }
  };

  const handleStopStream = () => {
    if (streamStop) {
      streamStop();
      setStreamStop(null);
      setStreaming(false);
      addLog('Telemetry stream stopped', 'info');
    }
  };

  const handlePopulateVault = async () => {
    addLog('Populating Vault with sample data...', 'info');
    try {
      await populateVaultSampleData();
      addLog('Vault sample data populated', 'success');
    } catch (error) {
      addLog(`Failed to populate Vault: ${error.message}`, 'error');
    }
  };

  const handleClearLogs = () => {
    setLogs([]);
  };

  return (
    <Layout>
      <div className="forge-theme min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-serif mb-2 text-amber-200">
            Telemetry Test Console
          </h1>
          <p className="text-amber-400/80 mb-8">
            Phase 10F: Live Telemetry Testing + Validation
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Controls */}
            <div className="space-y-6">
              {/* Full Test Suite */}
              <div className="forge-panel p-6">
                <h2 className="text-xl font-serif mb-4 text-amber-200">
                  Full Test Suite
                </h2>
                <button
                  onClick={handleRunFullTest}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-6 rounded transition-colors"
                >
                  Run Complete Test
                </button>
                <p className="text-amber-400/60 text-sm mt-2">
                  Generates all event types with delays
                </p>
              </div>

              {/* Drift Events */}
              <div className="forge-panel p-6">
                <h2 className="text-xl font-serif mb-4 text-amber-200">
                  Drift Events
                </h2>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => handleGenerateDrift('low')}
                    className="bg-green-700 hover:bg-green-800 text-white py-2 px-4 rounded text-sm"
                  >
                    Low
                  </button>
                  <button
                    onClick={() => handleGenerateDrift('medium')}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded text-sm"
                  >
                    Medium
                  </button>
                  <button
                    onClick={() => handleGenerateDrift('high')}
                    className="bg-red-700 hover:bg-red-800 text-white py-2 px-4 rounded text-sm"
                  >
                    High
                  </button>
                </div>
              </div>

              {/* Trust Events */}
              <div className="forge-panel p-6">
                <h2 className="text-xl font-serif mb-4 text-amber-200">
                  Trust Events
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleGenerateTrust('excellent')}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white py-2 px-4 rounded text-sm"
                  >
                    Excellent
                  </button>
                  <button
                    onClick={() => handleGenerateTrust('good')}
                    className="bg-green-700 hover:bg-green-800 text-white py-2 px-4 rounded text-sm"
                  >
                    Good
                  </button>
                  <button
                    onClick={() => handleGenerateTrust('fair')}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded text-sm"
                  >
                    Fair
                  </button>
                  <button
                    onClick={() => handleGenerateTrust('poor')}
                    className="bg-red-700 hover:bg-red-800 text-white py-2 px-4 rounded text-sm"
                  >
                    Poor
                  </button>
                </div>
              </div>

              {/* Other Events */}
              <div className="forge-panel p-6">
                <h2 className="text-xl font-serif mb-4 text-amber-200">
                  Other Events
                </h2>
                <div className="space-y-3">
                  <button
                    onClick={handleGenerateRollback}
                    className="w-full bg-red-700 hover:bg-red-800 text-white py-2 px-4 rounded text-sm"
                  >
                    Generate Rollback
                  </button>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleGenerateModification(true)}
                      className="bg-green-700 hover:bg-green-800 text-white py-2 px-4 rounded text-sm"
                    >
                      Approve Mod
                    </button>
                    <button
                      onClick={() => handleGenerateModification(false)}
                      className="bg-red-700 hover:bg-red-800 text-white py-2 px-4 rounded text-sm"
                    >
                      Reject Mod
                    </button>
                  </div>
                </div>
              </div>

              {/* Streaming & Data */}
              <div className="forge-panel p-6">
                <h2 className="text-xl font-serif mb-4 text-amber-200">
                  Continuous Stream & Data
                </h2>
                <div className="space-y-3">
                  {!streaming ? (
                    <button
                      onClick={handleStartStream}
                      className="w-full bg-purple-700 hover:bg-purple-800 text-white py-2 px-4 rounded text-sm"
                    >
                      Start Stream (3s interval)
                    </button>
                  ) : (
                    <button
                      onClick={handleStopStream}
                      className="w-full bg-gray-700 hover:bg-gray-800 text-white py-2 px-4 rounded text-sm"
                    >
                      Stop Stream
                    </button>
                  )}
                  <button
                    onClick={handlePopulateVault}
                    className="w-full bg-blue-700 hover:bg-blue-800 text-white py-2 px-4 rounded text-sm"
                  >
                    Populate Vault Data
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Log Display */}
            <div className="forge-panel p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-serif text-amber-200">
                  Event Log
                </h2>
                <button
                  onClick={handleClearLogs}
                  className="text-amber-400/60 hover:text-amber-400 text-sm"
                >
                  Clear
                </button>
              </div>

              <div className="bg-gray-900/50 rounded p-4 h-[600px] overflow-y-auto font-mono text-sm">
                {logs.length === 0 ? (
                  <div className="text-amber-400/40 italic">
                    No events yet. Click a button to generate telemetry events.
                  </div>
                ) : (
                  logs.map((log, idx) => (
                    <div
                      key={idx}
                      className={`mb-2 ${
                        log.type === 'success'
                          ? 'text-green-400'
                          : log.type === 'error'
                          ? 'text-red-400'
                          : 'text-amber-300'
                      }`}
                    >
                      <span className="text-amber-400/40">[{log.timestamp}]</span>{' '}
                      {log.message}
                    </div>
                  ))
                )}
              </div>

              <div className="mt-4 text-amber-400/60 text-xs">
                <div className="mb-2">
                  <strong>Tip:</strong> Open the dashboard in another tab to see live updates
                </div>
                <a
                  href="/dashboard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-400 hover:text-amber-300 underline"
                >
                  Open Dashboard →
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
