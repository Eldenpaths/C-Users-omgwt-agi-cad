'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Database,
  GitCompare,
  ThumbsUp,
  ThumbsDown,
  Eye,
} from 'lucide-react';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  where,
  updateDoc,
  doc,
} from 'firebase/firestore';
import { CanonDeviation, Anomaly } from '@/lib/learning/cvra';

export default function CVRASuggestions() {
  const [suggestions, setSuggestions] = useState<(CanonDeviation & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  // Real-time suggestions subscription
  useEffect(() => {
    let q =
      filter === 'all'
        ? query(
            collection(db, 'cvra-suggestions'),
            orderBy('confidence', 'desc'),
            limit(20)
          )
        : query(
            collection(db, 'cvra-suggestions'),
            where('status', '==', filter),
            orderBy('confidence', 'desc'),
            limit(20)
          );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const suggestionData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt:
            doc.data().createdAt instanceof Date
              ? doc.data().createdAt
              : new Date(doc.data().createdAt),
          reviewedAt: doc.data().reviewedAt
            ? doc.data().reviewedAt instanceof Date
              ? doc.data().reviewedAt
              : new Date(doc.data().reviewedAt)
            : undefined,
        })) as (CanonDeviation & { id: string })[];

        setSuggestions(suggestionData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching CVRA suggestions:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [filter]);

  // Approve suggestion
  const handleApprove = async (suggestionId: string) => {
    try {
      await updateDoc(doc(db, 'cvra-suggestions', suggestionId), {
        status: 'approved',
        reviewedAt: new Date().toISOString(),
        reviewedBy: 'user', // TODO: Get actual user ID
      });
    } catch (error) {
      console.error('Failed to approve suggestion:', error);
    }
  };

  // Reject suggestion
  const handleReject = async (suggestionId: string) => {
    try {
      await updateDoc(doc(db, 'cvra-suggestions', suggestionId), {
        status: 'rejected',
        reviewedAt: new Date().toISOString(),
        reviewedBy: 'user', // TODO: Get actual user ID
      });
    } catch (error) {
      console.error('Failed to reject suggestion:', error);
    }
  };

  // Calculate stats
  const stats = {
    pending: suggestions.filter((s) => s.status === 'pending').length,
    approved: suggestions.filter((s) => s.status === 'approved').length,
    rejected: suggestions.filter((s) => s.status === 'rejected').length,
    avgConfidence:
      suggestions.length > 0
        ? suggestions.reduce((sum, s) => sum + s.confidence, 0) / suggestions.length
        : 0,
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Header */}
      <div className="bg-gray-900/60 border border-amber-500/30 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-amber-400 flex items-center gap-2">
              <Brain className="w-5 h-5" />
              CVRA Suggestions
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Canon Validated Reasoning Adjustments - System Learning
            </p>
          </div>

          {/* Stats */}
          <div className="flex gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">{stats.pending}</div>
              <div className="text-gray-500">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{stats.approved}</div>
              <div className="text-gray-500">Approved</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">{stats.rejected}</div>
              <div className="text-gray-500">Rejected</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {(stats.avgConfidence * 100).toFixed(0)}%
              </div>
              <div className="text-gray-500">Avg Confidence</div>
            </div>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg border transition-all capitalize ${
                filter === status
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                  : 'bg-gray-800/60 border-gray-700 text-gray-400 hover:border-gray-600'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Suggestions List */}
      <div className="flex-1 bg-gray-900/60 border border-amber-500/30 rounded-xl overflow-hidden">
        <div className="h-full overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="flex flex-col items-center gap-3">
                <Brain className="w-8 h-8 animate-pulse" />
                <p>Loading suggestions...</p>
              </div>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="flex flex-col items-center gap-3">
                <Sparkles className="w-8 h-8 opacity-30" />
                <p>No suggestions found</p>
                <p className="text-xs">Run experiments to generate Canon proposals</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3 p-4">
              <AnimatePresence>
                {suggestions.map((suggestion) => (
                  <SuggestionCard
                    key={suggestion.id}
                    suggestion={suggestion}
                    isExpanded={selectedSuggestion === suggestion.id}
                    onToggle={() =>
                      setSelectedSuggestion(
                        selectedSuggestion === suggestion.id ? null : suggestion.id
                      )
                    }
                    onApprove={() => handleApprove(suggestion.id)}
                    onReject={() => handleReject(suggestion.id)}
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

interface SuggestionCardProps {
  suggestion: CanonDeviation & { id: string };
  isExpanded: boolean;
  onToggle: () => void;
  onApprove: () => void;
  onReject: () => void;
}

function SuggestionCard({
  suggestion,
  isExpanded,
  onToggle,
  onApprove,
  onReject,
}: SuggestionCardProps) {
  const confidenceColor =
    suggestion.confidence >= 0.8
      ? 'text-green-400'
      : suggestion.confidence >= 0.5
      ? 'text-yellow-400'
      : 'text-red-400';

  const statusColor =
    suggestion.status === 'approved'
      ? 'bg-green-500/20 border-green-500/40 text-green-300'
      : suggestion.status === 'rejected'
      ? 'bg-red-500/20 border-red-500/40 text-red-300'
      : 'bg-yellow-500/20 border-yellow-500/40 text-yellow-300';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="border border-gray-700 bg-gray-800/40 rounded-lg overflow-hidden"
    >
      {/* Header */}
      <div className="px-4 py-3">
        <div className="flex items-start gap-3">
          {/* Confidence Badge */}
          <div className="flex-shrink-0">
            <div
              className={`text-2xl font-bold ${confidenceColor} flex items-center justify-center w-16 h-16 rounded-lg bg-gray-900/60 border border-gray-700`}
            >
              {(suggestion.confidence * 100).toFixed(0)}%
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-semibold text-gray-200">{suggestion.title}</h3>
              <span className={`text-xs px-2 py-0.5 rounded border ${statusColor}`}>
                {suggestion.status}
              </span>
            </div>

            <p className="text-xs text-gray-400 mb-2">{suggestion.description}</p>

            {/* Metrics */}
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {suggestion.anomalies.length} anomalies
              </div>
              <div className="flex items-center gap-1">
                <Database className="w-3 h-3" />
                {suggestion.supportingExperiments.length} experiments
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {suggestion.pineconeMatches.length} patterns
              </div>
            </div>
          </div>

          {/* Actions */}
          {suggestion.status === 'pending' && (
            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onApprove();
                }}
                className="p-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/40 rounded-lg text-green-300 transition-all"
                title="Approve"
              >
                <ThumbsUp className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onReject();
                }}
                className="p-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 rounded-lg text-red-300 transition-all"
                title="Reject"
              >
                <ThumbsDown className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Expand Toggle */}
          <button
            onClick={onToggle}
            className="p-2 hover:bg-gray-700/60 rounded transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-gray-700"
          >
            <div className="p-4 space-y-4">
              {/* Canon Diff */}
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-300 mb-2">
                  <GitCompare className="w-4 h-4" />
                  Canon Change
                </div>
                <div className="space-y-2">
                  <div className="bg-gray-900/60 border border-gray-700 rounded p-3">
                    <div className="text-xs text-gray-500 mb-1">Area:</div>
                    <div className="text-sm text-gray-300 font-mono">
                      {suggestion.canonArea}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Current Rule */}
                    <div className="bg-red-900/10 border border-red-500/40 rounded p-3">
                      <div className="text-xs text-red-400 mb-1 font-semibold">
                        Current Rule:
                      </div>
                      <div className="text-sm text-gray-300">{suggestion.currentRule}</div>
                    </div>

                    {/* Proposed Rule */}
                    <div className="bg-green-900/10 border border-green-500/40 rounded p-3">
                      <div className="text-xs text-green-400 mb-1 font-semibold">
                        Proposed Rule:
                      </div>
                      <div className="text-sm text-gray-300">{suggestion.proposedRule}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rationale */}
              <div>
                <div className="text-sm font-semibold text-gray-300 mb-2">Rationale:</div>
                <div className="bg-gray-900/60 border border-gray-700 rounded p-3 text-sm text-gray-400">
                  {suggestion.rationale}
                </div>
              </div>

              {/* Anomalies */}
              {suggestion.anomalies.length > 0 && (
                <div>
                  <div className="text-sm font-semibold text-gray-300 mb-2">
                    Detected Anomalies:
                  </div>
                  <div className="space-y-2">
                    {suggestion.anomalies.map((anomaly, i) => (
                      <div
                        key={i}
                        className="bg-yellow-900/10 border border-yellow-500/40 rounded p-3"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-yellow-300">
                            {anomaly.metricName}
                          </span>
                          <span className="text-xs text-yellow-400">
                            {anomaly.sigmaDistance.toFixed(2)}σ deviation
                          </span>
                        </div>
                        <div className="text-xs text-gray-400">
                          Value: {anomaly.value.toFixed(2)} (expected:{' '}
                          {anomaly.expectedValue.toFixed(2)} ± {anomaly.standardDeviation.toFixed(2)}
                          )
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Evidence */}
              <div>
                <div className="text-sm font-semibold text-gray-300 mb-2">
                  Supporting Evidence:
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-900/60 border border-gray-700 rounded p-3">
                    <div className="text-xs text-gray-500 mb-1">Experiments</div>
                    <div className="text-2xl font-bold text-blue-400">
                      {suggestion.supportingExperiments.length}
                    </div>
                  </div>
                  <div className="bg-gray-900/60 border border-gray-700 rounded p-3">
                    <div className="text-xs text-gray-500 mb-1">Pattern Matches</div>
                    <div className="text-2xl font-bold text-purple-400">
                      {suggestion.pineconeMatches.length}
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Pinecone Matches */}
              {suggestion.pineconeMatches.length > 0 && (
                <div>
                  <div className="text-sm font-semibold text-gray-300 mb-2">
                    Top Similar Patterns:
                  </div>
                  <div className="space-y-1">
                    {suggestion.pineconeMatches.slice(0, 3).map((match, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between bg-gray-900/60 border border-gray-700 rounded p-2 text-xs"
                      >
                        <span className="text-gray-400 font-mono">{match.id.substring(0, 20)}...</span>
                        <span className="text-green-400 font-semibold">
                          {(match.score * 100).toFixed(1)}% match
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Metadata */}
              {suggestion.status !== 'pending' && suggestion.reviewedAt && (
                <div className="pt-3 border-t border-gray-700 text-xs text-gray-500">
                  {suggestion.status === 'approved' ? 'Approved' : 'Rejected'} on{' '}
                  {suggestion.reviewedAt.toLocaleDateString()} by {suggestion.reviewedBy || 'Unknown'}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
