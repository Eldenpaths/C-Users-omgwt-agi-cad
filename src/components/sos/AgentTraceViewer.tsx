'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  Filter,
  Search,
  TrendingUp,
  Zap,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { getDbInstance } from '@/lib/firebase';
import { collection, query, orderBy, limit, onSnapshot, where } from 'firebase/firestore';
import { AgentTrace } from '@/lib/logging/agent-tracer';

export default function AgentTraceViewer() {
  const [traces, setTraces] = useState<(AgentTrace & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrace, setSelectedTrace] = useState<string | null>(null);
  const [filter, setFilter] = useState<{
    agentType: string;
    hasErrors: boolean;
  }>({
    agentType: 'all',
    hasErrors: false,
  });
  const [searchTerm, setSearchTerm] = useState('');

  // Real-time trace subscription
  useEffect(() => {
    const db = getDbInstance();

    let q = query(
      collection(db, 'agent-traces'),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    // Apply filters
    if (filter.agentType !== 'all') {
      q = query(
        collection(db, 'agent-traces'),
        where('agentType', '==', filter.agentType),
        orderBy('timestamp', 'desc'),
        limit(50)
      );
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const traceData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() || new Date(),
        })) as (AgentTrace & { id: string })[];

        setTraces(traceData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching traces:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [filter]);

  // Filter traces by search term
  const filteredTraces = traces.filter((trace) => {
    const matchesSearch =
      searchTerm === '' ||
      trace.agentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trace.action.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesErrorFilter =
      !filter.hasErrors || (trace.errors && trace.errors.length > 0);

    return matchesSearch && matchesErrorFilter;
  });

  // Calculate stats
  const stats = {
    total: filteredTraces.length,
    errors: filteredTraces.filter((t) => t.errors && t.errors.length > 0).length,
    avgDuration:
      filteredTraces.length > 0
        ? filteredTraces.reduce((sum, t) => sum + (t.duration || 0), 0) / filteredTraces.length
        : 0,
    avgConfidence:
      filteredTraces.length > 0
        ? filteredTraces.reduce((sum, t) => sum + (t.confidence || 0), 0) / filteredTraces.length
        : 0,
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Header */}
      <div className="bg-gray-900/60 border border-amber-500/30 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-amber-400 flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Agent Trace Viewer
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Real-time visibility into agent execution
            </p>
          </div>

          {/* Stats */}
          <div className="flex gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-200">{stats.total}</div>
              <div className="text-gray-500">Traces</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">{stats.errors}</div>
              <div className="text-gray-500">Errors</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {stats.avgDuration.toFixed(0)}ms
              </div>
              <div className="text-gray-500">Avg Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {(stats.avgConfidence * 100).toFixed(0)}%
              </div>
              <div className="text-gray-500">Confidence</div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search by agent ID or action..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800/60 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
            />
          </div>

          {/* Agent Type Filter */}
          <select
            value={filter.agentType}
            onChange={(e) => setFilter({ ...filter, agentType: e.target.value })}
            className="px-4 py-2 bg-gray-800/60 border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:border-amber-500/50"
          >
            <option value="all">All Agents</option>
            <option value="orchestration">Orchestration</option>
            <option value="execution">Execution</option>
            <option value="research">Research</option>
            <option value="learning">Learning</option>
            <option value="system">System</option>
          </select>

          {/* Error Filter */}
          <button
            onClick={() => setFilter({ ...filter, hasErrors: !filter.hasErrors })}
            className={`px-4 py-2 rounded-lg border transition-all flex items-center gap-2 ${
              filter.hasErrors
                ? 'bg-red-500/20 border-red-500/40 text-red-300'
                : 'bg-gray-800/60 border-gray-700 text-gray-400'
            }`}
          >
            <AlertCircle className="w-4 h-4" />
            Errors Only
          </button>
        </div>
      </div>

      {/* Trace List */}
      <div className="flex-1 bg-gray-900/60 border border-amber-500/30 rounded-xl overflow-hidden">
        <div className="h-full overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="flex flex-col items-center gap-3">
                <Activity className="w-8 h-8 animate-pulse" />
                <p>Loading traces...</p>
              </div>
            </div>
          ) : filteredTraces.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="flex flex-col items-center gap-3">
                <Search className="w-8 h-8 opacity-30" />
                <p>No traces found</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2 p-4">
              <AnimatePresence>
                {filteredTraces.map((trace) => (
                  <TraceCard
                    key={trace.id}
                    trace={trace}
                    isExpanded={selectedTrace === trace.id}
                    onToggle={() =>
                      setSelectedTrace(selectedTrace === trace.id ? null : trace.id)
                    }
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface TraceCardProps {
  trace: AgentTrace & { id: string };
  isExpanded: boolean;
  onToggle: () => void;
}

function TraceCard({ trace, isExpanded, onToggle }: TraceCardProps) {
  const hasErrors = trace.errors && trace.errors.length > 0;
  const hasWarnings = trace.warnings && trace.warnings.length > 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`border rounded-lg overflow-hidden transition-all ${
        hasErrors
          ? 'border-red-500/40 bg-red-900/10'
          : hasWarnings
          ? 'border-yellow-500/40 bg-yellow-900/10'
          : 'border-gray-700 bg-gray-800/40'
      }`}
    >
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-800/60 transition-colors text-left"
      >
        {/* Expand Icon */}
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
        )}

        {/* Status Icon */}
        {hasErrors ? (
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
        ) : (
          <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
        )}

        {/* Agent Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-gray-200">{trace.agentId}</span>
            <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded">
              {trace.agentType}
            </span>
          </div>
          <div className="text-xs text-gray-400">{trace.action}</div>
        </div>

        {/* Metrics */}
        <div className="flex items-center gap-4 text-xs">
          {/* Duration */}
          {trace.duration && (
            <div className="flex items-center gap-1 text-gray-400">
              <Clock className="w-3 h-3" />
              {trace.duration}ms
            </div>
          )}

          {/* Confidence */}
          {trace.confidence !== undefined && (
            <div className="flex items-center gap-1 text-gray-400">
              <TrendingUp className="w-3 h-3" />
              {(trace.confidence * 100).toFixed(0)}%
            </div>
          )}

          {/* Timestamp */}
          <div className="text-gray-500">
            {trace.timestamp instanceof Date
              ? trace.timestamp.toLocaleTimeString()
              : 'Unknown'}
          </div>
        </div>
      </button>

      {/* Expanded Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-gray-700"
          >
            <div className="p-4 space-y-3">
              {/* Input */}
              <div>
                <div className="text-xs font-semibold text-gray-400 mb-1">Input:</div>
                <pre className="text-xs bg-gray-900/60 border border-gray-700 rounded p-2 overflow-x-auto text-gray-300">
                  {JSON.stringify(trace.input, null, 2)}
                </pre>
              </div>

              {/* Output */}
              {trace.output && (
                <div>
                  <div className="text-xs font-semibold text-gray-400 mb-1">Output:</div>
                  <pre className="text-xs bg-gray-900/60 border border-gray-700 rounded p-2 overflow-x-auto text-gray-300">
                    {JSON.stringify(trace.output, null, 2)}
                  </pre>
                </div>
              )}

              {/* Errors */}
              {hasErrors && (
                <div>
                  <div className="text-xs font-semibold text-red-400 mb-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Errors:
                  </div>
                  <div className="space-y-1">
                    {trace.errors!.map((error, i) => (
                      <div
                        key={i}
                        className="text-xs bg-red-900/20 border border-red-500/40 rounded p-2 text-red-300"
                      >
                        {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warnings */}
              {hasWarnings && (
                <div>
                  <div className="text-xs font-semibold text-yellow-400 mb-1">Warnings:</div>
                  <div className="space-y-1">
                    {trace.warnings!.map((warning, i) => (
                      <div
                        key={i}
                        className="text-xs bg-yellow-900/20 border border-yellow-500/40 rounded p-2 text-yellow-300"
                      >
                        {warning}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Metadata */}
              {trace.metadata && Object.keys(trace.metadata).length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-gray-400 mb-1">Metadata:</div>
                  <pre className="text-xs bg-gray-900/60 border border-gray-700 rounded p-2 overflow-x-auto text-gray-300">
                    {JSON.stringify(trace.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
