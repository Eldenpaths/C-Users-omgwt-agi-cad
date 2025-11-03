/**
 * AI Agent Demo - Enhanced Version
 * Beautiful interface for AI agents to control Science Labs
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AuthGuard from '@/components/auth/AuthGuard';
import {
  Bot,
  Send,
  Zap,
  Sparkles,
  AlertCircle,
  CheckCircle,
  Loader,
  RefreshCw,
  ExternalLink,
  Activity,
  Flame,
  Wind
} from 'lucide-react';

interface SampleCommand {
  label: string;
  api: any;
  description?: string;
}

interface CommandLog {
  id: string;
  input: string;
  success: boolean;
  result?: any;
  error?: string;
  timestamp: number;
}

interface LabState {
  [key: string]: any;
}

const SAMPLE_COMMANDS: SampleCommand[] = [
  {
    label: 'Heat Plasma to 5000K',
    api: { lab: 'plasma', command: 'heat', params: { flux: 500 } },
    description: 'Activate plasma heater with moderate flux'
  },
  {
    label: 'Cool Plasma',
    api: { lab: 'plasma', command: 'stop' },
    description: 'Stop heating and let plasma cool naturally'
  },
  {
    label: 'Vent Plasma Chamber',
    api: { lab: 'plasma', command: 'vent' },
    description: 'Rapidly decrease chamber pressure'
  },
  {
    label: 'Heat Spectral to 8000K',
    api: { lab: 'spectral', command: 'heat', params: { temperature: 8000 } },
    description: 'Heat spectral source to high temperature'
  },
  {
    label: 'Doppler Redshift (+500)',
    api: { lab: 'spectral', command: 'setVelocity', params: { velocity: 500 } },
    description: 'Set positive velocity for redshift'
  },
  {
    label: 'Get All Lab States',
    api: 'GET',
    description: 'Query current state of all labs'
  },
];

export default function AgentDemoPage() {
  const [input, setInput] = useState('');
  const [logs, setLogs] = useState<CommandLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [labStates, setLabStates] = useState<Record<string, LabState>>({});
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Auto-refresh lab states every 2 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const fetchStates = async () => {
      try {
        const response = await fetch('/api/labs/command');
        const data = await response.json();
        if (data.success && data.labs) {
          setLabStates(data.labs);
        }
      } catch (error) {
        console.error('Failed to fetch lab states:', error);
      }
    };

    fetchStates(); // Initial fetch
    const interval = setInterval(fetchStates, 2000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  /**
   * Execute API command
   */
  const executeApiCommand = async (apiCall: any, userInput?: string) => {
    setLoading(true);

    const logEntry: CommandLog = {
      id: Date.now().toString(),
      input: userInput || JSON.stringify(apiCall),
      success: false,
      timestamp: Date.now()
    };

    try {
      if (apiCall === 'GET') {
        // GET request
        const response = await fetch('/api/labs/command');
        const data = await response.json();
        logEntry.success = response.ok;
        logEntry.result = data;
      } else {
        // POST request
        const response = await fetch('/api/labs/command', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(apiCall),
        });
        const data = await response.json();
        logEntry.success = response.ok && data.success;
        logEntry.result = data;
        logEntry.error = data.error;
      }
    } catch (error) {
      logEntry.error = error instanceof Error ? error.message : 'Unknown error';
    }

    setLogs([logEntry, ...logs.slice(0, 4)]); // Keep last 5
    setLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim()) {
        // Simple NLP parsing (same as before)
        const parsed = parseCommand(input);
        if (parsed) {
          executeApiCommand(parsed, input);
          setInput('');
        }
      }
    }
  };

  const parseCommand = (text: string): any | null => {
    const lower = text.toLowerCase().trim();

    if (lower.includes('heat') && lower.includes('plasma')) {
      const fluxMatch = lower.match(/(\d+)/);
      const flux = fluxMatch ? parseInt(fluxMatch[1]) : 1500;
      return { lab: 'plasma', command: 'heat', params: { flux } };
    }

    if (lower.includes('cool') && lower.includes('plasma')) {
      return { lab: 'plasma', command: 'stop' };
    }

    if (lower.includes('vent')) {
      return { lab: 'plasma', command: 'vent' };
    }

    if (lower.includes('heat') && lower.includes('spectral')) {
      const tempMatch = lower.match(/(\d+)/);
      const temperature = tempMatch ? parseInt(tempMatch[1]) : 5000;
      return { lab: 'spectral', command: 'heat', params: { temperature } };
    }

    if (lower.includes('velocity') || lower.includes('doppler')) {
      const velocityMatch = lower.match(/(-?\d+)/);
      const velocity = velocityMatch ? parseInt(velocityMatch[1]) : 500;
      return { lab: 'spectral', command: 'setVelocity', params: { velocity } };
    }

    return null;
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-gray-950 text-white p-4 sm:p-8">
      {/* Header */}
      <header className="mb-8 border-b border-purple-700/30 pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-purple-600/20 rounded-lg border border-purple-500/30">
              <Bot className="w-8 h-8 text-purple-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-purple-300">AI Agent Control Center</h1>
              <p className="text-sm text-gray-400 mt-1">
                Command Science Labs with natural language or quick actions
              </p>
            </div>
          </div>

          <Link href="/labs">
            <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium transition duration-150 flex items-center space-x-2">
              <ExternalLink className="w-4 h-4" />
              <span>Labs Hub</span>
            </button>
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Command Interface */}
        <div className="lg:col-span-2 space-y-6">
          {/* Command Input */}
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-purple-700/30 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Send className="w-5 h-5 text-purple-400" />
              <h2 className="text-lg font-semibold text-purple-300">Command Input</h2>
            </div>

            <div className="space-y-4">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder='Try: "heat plasma to 5000" or "set velocity 1000"'
                rows={3}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                disabled={loading}
              />

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    const parsed = parseCommand(input);
                    if (parsed) {
                      executeApiCommand(parsed, input);
                      setInput('');
                    }
                  }}
                  disabled={loading || !input.trim()}
                  className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-medium transition-all duration-150 flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      <span>Executing...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>Execute Command</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => setInput('')}
                  disabled={loading}
                  className="px-6 py-3 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-medium transition duration-150"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>

          {/* Quick Commands */}
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-purple-700/30 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Zap className="w-5 h-5 text-yellow-400" />
              <h2 className="text-lg font-semibold text-purple-300">Quick Commands</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SAMPLE_COMMANDS.map((cmd, idx) => (
                <button
                  key={idx}
                  onClick={() => executeApiCommand(cmd.api, cmd.label)}
                  disabled={loading}
                  className="px-4 py-3 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg text-left transition duration-150 border border-gray-700/50 hover:border-purple-500/50"
                  title={cmd.description}
                >
                  <p className="text-sm font-medium text-white">{cmd.label}</p>
                  {cmd.description && (
                    <p className="text-xs text-gray-500 mt-1">{cmd.description}</p>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Command History */}
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-purple-700/30 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-blue-400" />
                <h2 className="text-lg font-semibold text-purple-300">Command History</h2>
              </div>
              <span className="text-xs text-gray-500">Last 5 commands</span>
            </div>

            {logs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No commands executed yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className={`p-4 rounded-lg border ${
                      log.success
                        ? 'bg-green-900/10 border-green-700/30'
                        : 'bg-red-900/10 border-red-700/30'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      {log.success ? (
                        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      )}

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-mono text-white truncate">{log.input}</p>
                        {log.error && (
                          <p className="text-xs text-red-400 mt-1">{log.error}</p>
                        )}
                        {log.success && log.result?.state && (
                          <div className="text-xs text-gray-400 mt-2">
                            {log.result.lab && (
                              <span className="text-purple-400">
                                {log.result.lab}:
                              </span>
                            )}{' '}
                            {JSON.stringify(log.result.state).slice(0, 100)}...
                          </div>
                        )}
                        <p className="text-xs text-gray-600 mt-1">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Lab States */}
        <div className="space-y-6">
          {/* Auto-refresh toggle */}
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-purple-700/30 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <RefreshCw className={`w-4 h-4 text-purple-400 ${autoRefresh ? 'animate-spin' : ''}`} />
                <span className="text-sm font-medium text-purple-300">Auto-refresh</span>
              </div>
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                  autoRefresh
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-700 text-gray-400'
                }`}
              >
                {autoRefresh ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>

          {/* Live Lab States */}
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-purple-700/30 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Activity className="w-5 h-5 text-green-400" />
              <h2 className="text-lg font-semibold text-purple-300">Live Lab States</h2>
            </div>

            <div className="space-y-4">
              {/* Plasma Lab */}
              <Link href="/plasma-lab">
                <div className="p-4 bg-gray-800/50 hover:bg-gray-800 rounded-lg border border-gray-700/50 hover:border-purple-500/50 transition cursor-pointer">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Flame className="w-5 h-5 text-red-400" />
                      <h3 className="font-semibold text-white">Plasma Lab</h3>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${
                      labStates.plasma ? 'bg-green-400 animate-pulse' : 'bg-gray-600'
                    }`} />
                  </div>

                  {labStates.plasma ? (
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Temperature:</span>
                        <span className="text-red-400 font-mono">
                          {labStates.plasma.T?.toFixed(1) || 'N/A'} K
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Pressure:</span>
                        <span className="text-yellow-400 font-mono">
                          {labStates.plasma.P?.toFixed(0) || 'N/A'} Pa
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Ionization:</span>
                        <span className="text-pink-400 font-mono">
                          {labStates.plasma.I?.toFixed(1) || 'N/A'} %
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500">Lab offline or not registered</p>
                  )}
                </div>
              </Link>

              {/* Spectral Lab */}
              <Link href="/spectral-lab">
                <div className="p-4 bg-gray-800/50 hover:bg-gray-800 rounded-lg border border-gray-700/50 hover:border-purple-500/50 transition cursor-pointer">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-5 h-5 text-purple-400" />
                      <h3 className="font-semibold text-white">Spectral Lab</h3>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${
                      labStates.spectral ? 'bg-green-400 animate-pulse' : 'bg-gray-600'
                    }`} />
                  </div>

                  {labStates.spectral ? (
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Temperature:</span>
                        <span className="text-orange-400 font-mono">
                          {labStates.spectral.temperature?.toFixed(1) || 'N/A'} K
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Velocity:</span>
                        <span className="text-blue-400 font-mono">
                          {labStates.spectral.velocity?.toFixed(0) || 'N/A'} m/s
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Lines:</span>
                        <span className="text-green-400 font-mono">
                          {labStates.spectral.lines?.length || 0} visible
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500">Lab offline or not registered</p>
                  )}
                </div>
              </Link>

              {/* Status Summary */}
              <div className="pt-4 border-t border-gray-700/50">
                <div className="text-xs text-gray-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Registered Labs:</span>
                    <span className="text-white font-mono">
                      {Object.keys(labStates).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Update:</span>
                    <span className="text-white font-mono">
                      {new Date().toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* API Documentation Link */}
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-purple-700/30 p-6">
            <h3 className="text-sm font-semibold text-purple-300 mb-3">API Documentation</h3>
            <p className="text-xs text-gray-400 mb-4">
              View complete API reference for programmatic control
            </p>
            <a
              href="/docs/AGENT_API.md"
              target="_blank"
              className="inline-flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition"
            >
              <ExternalLink className="w-4 h-4" />
              <span>View Docs</span>
            </a>
          </div>
        </div>
      </div>
      </div>
    </AuthGuard>
  );
}
