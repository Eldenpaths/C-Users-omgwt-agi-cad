'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lightbulb,
  TrendingUp,
  Target,
  Zap,
  ChevronRight,
  X,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
} from 'lucide-react';

interface SimilarExperiment {
  id: string;
  title: string;
  similarity: number;
  daysAgo: number;
  labId: string;
}

interface Suggestion {
  id: string;
  type: 'similar' | 'try-this' | 'pattern' | 'workflow';
  title: string;
  description: string;
  confidence: number;
  action?: string;
  actionLabel?: string;
  relatedExperiments?: SimilarExperiment[];
  metadata?: Record<string, any>;
}

interface SmartSuggestionsProps {
  experimentId?: string;
  labId?: string;
}

export default function SmartSuggestions({ experimentId, labId }: SmartSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSuggestion, setExpandedSuggestion] = useState<string | null>(null);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());

  // Load suggestions
  useEffect(() => {
    loadSuggestions();
  }, [experimentId, labId]);

  const loadSuggestions = async () => {
    setIsLoading(true);

    try {
      // In production, this would fetch from /api/vault/suggestions or use Pinecone directly
      // For now, simulate with mock data
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const mockSuggestions: Suggestion[] = [
        {
          id: 'sim1',
          type: 'similar',
          title: 'Similar: "Plasma Temperature Test 3"',
          description:
            'This experiment from 2 days ago achieved similar results with different parameters.',
          confidence: 92,
          actionLabel: 'View Details',
          relatedExperiments: [
            {
              id: 'exp123',
              title: 'Plasma Temperature Test 3',
              similarity: 0.92,
              daysAgo: 2,
              labId: 'plasma',
            },
          ],
        },
        {
          id: 'try1',
          type: 'try-this',
          title: 'Try This: Increase temperature to 8000K',
          description:
            '23% of users found better results by raising the temperature threshold to 8000K.',
          confidence: 78,
          actionLabel: 'Apply Suggestion',
          metadata: {
            successRate: 0.78,
            sampleSize: 156,
          },
        },
        {
          id: 'pat1',
          type: 'pattern',
          title: 'Pattern Detected: Plasma → Spectral Flow',
          description:
            'You often run spectral analysis after plasma experiments. Create an automated workflow?',
          confidence: 85,
          actionLabel: 'Create Workflow',
          metadata: {
            occurrences: 7,
            avgTimeSaved: '5 minutes',
          },
        },
        {
          id: 'wf1',
          type: 'workflow',
          title: 'Recommended: Multi-stage validation',
          description:
            'Based on your success patterns, consider adding a verification step before locking results.',
          confidence: 71,
          actionLabel: 'Learn More',
        },
      ];

      setSuggestions(mockSuggestions.filter((s) => !dismissedSuggestions.has(s.id)));
    } catch (error) {
      console.error('Failed to load suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = (id: string) => {
    setDismissedSuggestions((prev) => new Set([...prev, id]));
    setSuggestions((prev) => prev.filter((s) => s.id !== id));
  };

  const handleFeedback = async (id: string, helpful: boolean) => {
    console.log(`Feedback for ${id}: ${helpful ? 'helpful' : 'not helpful'}`);
    // In production, this would send feedback to the backend to improve suggestions
    // await fetch('/api/suggestions/feedback', { method: 'POST', body: JSON.stringify({ id, helpful }) });
  };

  const handleAction = (suggestion: Suggestion) => {
    console.log(`Action triggered for suggestion: ${suggestion.id}`);
    // In production, this would trigger the appropriate action (apply pattern, create workflow, etc.)
  };

  const getSuggestionIcon = (type: Suggestion['type']) => {
    switch (type) {
      case 'similar':
        return <Target className="w-4 h-4" />;
      case 'try-this':
        return <Zap className="w-4 h-4" />;
      case 'pattern':
        return <TrendingUp className="w-4 h-4" />;
      case 'workflow':
        return <Sparkles className="w-4 h-4" />;
    }
  };

  const getSuggestionColor = (type: Suggestion['type']) => {
    switch (type) {
      case 'similar':
        return 'from-blue-500 to-cyan-500';
      case 'try-this':
        return 'from-amber-500 to-orange-500';
      case 'pattern':
        return 'from-green-500 to-emerald-500';
      case 'workflow':
        return 'from-purple-500 to-pink-500';
    }
  };

  if (isLoading) {
    return (
      <div className="px-4 py-6">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-5 h-5 text-amber-400" />
          <h3 className="text-sm font-semibold text-amber-400">SMART SUGGESTIONS</h3>
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-20 bg-gray-800/40 border border-gray-700/40 rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="px-4 py-6">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-5 h-5 text-amber-400" />
          <h3 className="text-sm font-semibold text-amber-400">SMART SUGGESTIONS</h3>
        </div>
        <div className="text-center py-8 text-gray-500 text-sm">
          <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>Run more experiments to get</p>
          <p>AI-powered suggestions</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 border-t border-amber-500/20">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-amber-400" />
          <h3 className="text-sm font-semibold text-amber-400">SMART SUGGESTIONS</h3>
        </div>
        <span className="text-xs text-gray-500">{suggestions.length} new</span>
      </div>

      {/* Suggestions list */}
      <div className="space-y-3">
        {suggestions.map((suggestion, index) => (
          <motion.div
            key={suggestion.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="relative"
          >
            {/* Main card */}
            <div
              className={`relative overflow-hidden rounded-xl border border-gray-700/40 bg-gray-800/40 hover:border-amber-500/40 transition-all ${
                expandedSuggestion === suggestion.id ? 'ring-2 ring-amber-500/30' : ''
              }`}
            >
              {/* Gradient background */}
              <div
                className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${getSuggestionColor(
                  suggestion.type
                )}`}
              />

              {/* Content */}
              <button
                onClick={() =>
                  setExpandedSuggestion(
                    expandedSuggestion === suggestion.id ? null : suggestion.id
                  )
                }
                className="w-full p-3 pl-4 text-left"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 p-2 bg-gradient-to-br ${getSuggestionColor(
                      suggestion.type
                    )} rounded-lg text-white`}
                  >
                    {getSuggestionIcon(suggestion.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="text-sm font-medium text-gray-200 line-clamp-1">
                        {suggestion.title}
                      </h4>
                      <ChevronRight
                        className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${
                          expandedSuggestion === suggestion.id ? 'rotate-90' : ''
                        }`}
                      />
                    </div>

                    <p className="text-xs text-gray-400 line-clamp-2 mb-2">
                      {suggestion.description}
                    </p>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <div className="w-20 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-amber-500 to-amber-400"
                            initial={{ width: 0 }}
                            animate={{ width: `${suggestion.confidence}%` }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                          />
                        </div>
                        <span className="text-xs text-amber-400 font-medium">
                          {suggestion.confidence}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </button>

              {/* Expanded details */}
              <AnimatePresence>
                {expandedSuggestion === suggestion.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-gray-700/40 overflow-hidden"
                  >
                    <div className="p-3 pl-4 space-y-3">
                      {/* Related experiments (for similar type) */}
                      {suggestion.relatedExperiments &&
                        suggestion.relatedExperiments.length > 0 && (
                          <div>
                            <h5 className="text-xs font-semibold text-gray-400 mb-2">
                              Related Experiments:
                            </h5>
                            {suggestion.relatedExperiments.map((exp) => (
                              <div
                                key={exp.id}
                                className="p-2 bg-gray-800/60 border border-gray-700/40 rounded-lg mb-1.5"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-gray-300">{exp.title}</span>
                                  <span className="text-xs text-blue-400">
                                    {Math.round(exp.similarity * 100)}% match
                                  </span>
                                </div>
                                <div className="text-xs text-gray-500 mt-0.5">
                                  {exp.daysAgo} days ago • {exp.labId}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                      {/* Metadata */}
                      {suggestion.metadata && (
                        <div className="p-2 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                          <div className="text-xs text-blue-300 space-y-0.5">
                            {Object.entries(suggestion.metadata).map(([key, value]) => (
                              <div key={key}>
                                <span className="text-blue-400">
                                  {key.replace(/([A-Z])/g, ' $1').trim()}:
                                </span>{' '}
                                {value}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2">
                        {suggestion.actionLabel && (
                          <button
                            onClick={() => handleAction(suggestion)}
                            className="flex-1 px-3 py-2 bg-gradient-to-r from-amber-500/80 to-orange-500/80 hover:from-amber-500 hover:to-orange-500 rounded-lg text-xs font-medium text-white transition-all"
                          >
                            {suggestion.actionLabel}
                          </button>
                        )}
                      </div>

                      {/* Feedback */}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-700/40">
                        <span className="text-xs text-gray-500">Was this helpful?</span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleFeedback(suggestion.id, true)}
                            className="p-1.5 hover:bg-green-500/20 rounded-lg transition-colors group"
                            title="Helpful"
                          >
                            <ThumbsUp className="w-3.5 h-3.5 text-gray-500 group-hover:text-green-400 transition-colors" />
                          </button>
                          <button
                            onClick={() => handleFeedback(suggestion.id, false)}
                            className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors group"
                            title="Not helpful"
                          >
                            <ThumbsDown className="w-3.5 h-3.5 text-gray-500 group-hover:text-red-400 transition-colors" />
                          </button>
                          <button
                            onClick={() => handleDismiss(suggestion.id)}
                            className="p-1.5 hover:bg-gray-700/40 rounded-lg transition-colors group"
                            title="Dismiss"
                          >
                            <X className="w-3.5 h-3.5 text-gray-500 group-hover:text-gray-300 transition-colors" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Footer note */}
      <div className="mt-4 p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg">
        <p className="text-xs text-amber-300/80">
          💡 Powered by Pinecone vector similarity and pattern recognition
        </p>
      </div>
    </div>
  );
}
