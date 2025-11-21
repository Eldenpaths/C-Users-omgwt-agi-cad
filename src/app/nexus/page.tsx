'use client';

import { useState } from 'react';

export default function NexusPage() {
  const [status, setStatus] = useState('initializing');

  return (
    <div className="min-h-screen bg-black text-white p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">AGI-CAD Nexus</h1>
        <p className="text-gray-400">Multi-AI Intelligence Router & Orchestration Hub</p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
        {/* System Status */}
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-3 animate-pulse"></span>
            System Status
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Core Router</span>
              <span className="text-green-400">✓ Online</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">API Endpoint</span>
              <span className="text-green-400">✓ Active</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Task Queue</span>
              <span className="text-green-400">✓ Ready</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">TypeScript Compilation</span>
              <span className="text-yellow-400">⚠ Needs Fix</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button
              onClick={() => window.open('/api/router?action=metrics', '_blank')}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition"
            >
              View Router Metrics →
            </button>
            <button
              onClick={() => window.open('/api/router?action=agents', '_blank')}
              className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition"
            >
              View Active Agents →
            </button>
            <button
              onClick={() => window.open('/api/router?action=stats', '_blank')}
              className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium transition"
            >
              View Queue Stats →
            </button>
          </div>
        </div>

        {/* Phase Info */}
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
          <h2 className="text-xl font-semibold mb-4">Current Phase</h2>
          <div className="space-y-2 text-sm">
            <p className="text-gray-400">Phase 29: GlyphCore + Fusion Bridge</p>
            <p className="text-gray-400">Completion: 95%</p>
            <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500 rounded">
              <p className="text-xs text-blue-300">
                Minimal UI active. Full visualization will be restored after TypeScript fixes.
              </p>
            </div>
          </div>
        </div>

        {/* Test API */}
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
          <h2 className="text-xl font-semibold mb-4">Test Router API</h2>
          <button
            onClick={async () => {
              try {
                setStatus('testing');
                const res = await fetch('/api/router?action=metrics');
                const data = await res.json();
                setStatus(data.success ? 'success' : 'error');
                alert(JSON.stringify(data, null, 2));
              } catch (err) {
                setStatus('error');
                alert('Error: ' + err);
              }
            }}
            className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition"
          >
            Run API Test
          </button>
          <p className="text-xs text-gray-500 mt-2">
            Status: <span className="text-blue-400">{status}</span>
          </p>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-8 max-w-4xl">
        <div className="bg-amber-900/20 border border-amber-500 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2 text-amber-400">Next Steps</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-300">
            <li>Test API endpoints using the buttons above</li>
            <li>Review TypeScript errors in console</li>
            <li>Fix compilation errors in dependency chain</li>
            <li>Restore full 3D visualization components</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
