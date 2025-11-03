'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Brain, Code, Search, ChevronDown, ChevronRight, X, Sparkles } from 'lucide-react';

interface AgentInfo {
  id: string;
  name: string;
  role: string;
  status: 'active' | 'idle' | 'error';
  currentTask?: string;
  tasksCompleted: number;
  lastActive?: Date;
  icon: React.ReactNode;
  color: string;
}

export default function AgentStatus() {
  const [isOpen, setIsOpen] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [agents, setAgents] = useState<AgentInfo[]>([
    {
      id: 'strategy',
      name: 'Strategy Agent',
      role: 'High-level planning',
      status: 'idle',
      tasksCompleted: 0,
      icon: <Brain className="w-4 h-4" />,
      color: 'from-purple-500 to-pink-500',
    },
    {
      id: 'coder',
      name: 'Coder Agent',
      role: 'Implementation',
      status: 'idle',
      tasksCompleted: 0,
      icon: <Code className="w-4 h-4" />,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      id: 'researcher',
      name: 'Researcher Agent',
      role: 'Analysis & patterns',
      status: 'idle',
      tasksCompleted: 0,
      icon: <Search className="w-4 h-4" />,
      color: 'from-green-500 to-emerald-500',
    },
  ]);

  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  // Simulate agent activity polling (in real app, this would query the agent coordination API)
  useEffect(() => {
    const pollInterval = setInterval(() => {
      // In production, this would fetch from /api/agents/status
      // For now, we'll simulate occasional activity
      if (Math.random() > 0.95) {
        setAgents((prev) =>
          prev.map((agent) => {
            if (agent.status === 'idle' && Math.random() > 0.5) {
              return {
                ...agent,
                status: 'active' as const,
                currentTask: getRandomTask(agent.role),
                lastActive: new Date(),
              };
            } else if (agent.status === 'active' && Math.random() > 0.7) {
              return {
                ...agent,
                status: 'idle' as const,
                tasksCompleted: agent.tasksCompleted + 1,
                currentTask: undefined,
              };
            }
            return agent;
          })
        );
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, []);

  const getStatusIndicator = (status: AgentInfo['status']) => {
    switch (status) {
      case 'active':
        return (
          <motion.div
            className="w-2 h-2 bg-green-400 rounded-full"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [1, 0.6, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        );
      case 'idle':
        return <div className="w-2 h-2 bg-gray-500 rounded-full" />;
      case 'error':
        return <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />;
    }
  };

  const getStatusText = (status: AgentInfo['status']) => {
    switch (status) {
      case 'active':
        return <span className="text-green-400">Active</span>;
      case 'idle':
        return <span className="text-gray-400">Idle</span>;
      case 'error':
        return <span className="text-red-400">Error</span>;
    }
  };

  const activeCount = agents.filter((a) => a.status === 'active').length;

  if (!isOpen) {
    return (
      <motion.button
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => setIsOpen(true)}
        className="fixed top-28 right-4 z-30 p-3 bg-gray-900/95 backdrop-blur-sm border border-blue-500/40 rounded-xl hover:bg-blue-500/10 transition-colors"
        aria-label="Open Agent Status"
      >
        <Activity className="w-5 h-5 text-blue-400" />
        {activeCount > 0 && (
          <motion.div
            className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-gray-900 flex items-center justify-center"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <span className="text-xs font-bold text-white">{activeCount}</span>
          </motion.div>
        )}
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="fixed top-28 right-4 z-30 w-80"
    >
      {/* Background glow */}
      <div className="absolute -inset-2 bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-pink-500/10 blur-xl" />

      {/* Main panel */}
      <div className="relative bg-gray-900/95 backdrop-blur-xl border-2 border-blue-500/40 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-blue-500/30 bg-gradient-to-r from-blue-500/10 to-purple-500/10">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-blue-400">AGENTS</h3>
            {activeCount > 0 && (
              <motion.div
                className="px-2 py-0.5 bg-green-500/20 border border-green-500/40 rounded-full text-xs text-green-400"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {activeCount} active
              </motion.div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded-lg hover:bg-blue-500/20 transition-colors"
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-blue-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-blue-400" />
              )}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg hover:bg-blue-500/20 transition-colors"
            >
              <X className="w-4 h-4 text-blue-400" />
            </motion.button>
          </div>
        </div>

        {/* Agents list */}
        <AnimatePresence mode="wait">
          {isExpanded ? (
            <motion.div
              key="expanded"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="px-4 py-3 space-y-3">
                {agents.map((agent) => (
                  <motion.div
                    key={agent.id}
                    layout
                    className="relative"
                  >
                    <button
                      onClick={() =>
                        setSelectedAgent(selectedAgent === agent.id ? null : agent.id)
                      }
                      className="w-full p-3 bg-gray-800/60 border border-gray-700/40 hover:border-blue-500/40 rounded-xl transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-2 bg-gradient-to-br ${agent.color} rounded-lg text-white`}
                        >
                          {agent.icon}
                        </div>

                        <div className="flex-1 text-left">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-semibold text-gray-200">
                              {agent.name}
                            </span>
                            {getStatusIndicator(agent.status)}
                          </div>

                          <div className="text-xs text-gray-400 mb-1">{agent.role}</div>

                          <div className="flex items-center justify-between text-xs">
                            {getStatusText(agent.status)}
                            <span className="text-gray-500">
                              {agent.tasksCompleted} tasks
                            </span>
                          </div>

                          {agent.currentTask && (
                            <div className="mt-2 px-2 py-1 bg-blue-500/10 border border-blue-500/30 rounded text-xs text-blue-300">
                              {agent.currentTask}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>

                    {/* Expanded details */}
                    <AnimatePresence>
                      {selectedAgent === agent.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="mt-2 p-3 bg-gray-800/40 border border-gray-700/40 rounded-xl overflow-hidden"
                        >
                          <div className="space-y-2 text-xs">
                            <div>
                              <span className="text-gray-500">Last Active:</span>{' '}
                              <span className="text-gray-300">
                                {agent.lastActive
                                  ? agent.lastActive.toLocaleTimeString()
                                  : 'Never'}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Tasks Completed:</span>{' '}
                              <span className="text-gray-300">{agent.tasksCompleted}</span>
                            </div>
                            <div className="pt-2 border-t border-gray-700/40">
                              <button className="w-full px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 rounded-lg text-blue-300 transition-colors">
                                View Activity Log
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>

              {/* Footer */}
              <div className="px-4 py-3 border-t border-blue-500/20 bg-gray-900/50">
                <div className="flex items-center gap-2 text-xs">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-gray-400">
                    Orchestrated by LangChain.js
                  </span>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="collapsed"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="px-4 py-3 space-y-2 overflow-hidden"
            >
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  className="flex items-center justify-between p-2 bg-gray-800/40 border border-gray-700/40 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 bg-gradient-to-br ${agent.color} rounded-md`}>
                      {React.cloneElement(agent.icon as React.ReactElement, {
                        className: 'w-3 h-3',
                      })}
                    </div>
                    <span className="text-xs text-gray-300">{agent.name.split(' ')[0]}</span>
                  </div>
                  {getStatusIndicator(agent.status)}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// Helper function to get random tasks for simulation
function getRandomTask(role: string): string {
  const tasks: Record<string, string[]> = {
    'High-level planning': [
      'Analyzing workflow patterns...',
      'Planning next experiment sequence...',
      'Synthesizing results...',
      'Coordinating agent tasks...',
    ],
    Implementation: [
      'Implementing pattern detection...',
      'Refactoring experiment handlers...',
      'Optimizing data structures...',
      'Writing unit tests...',
    ],
    'Analysis & patterns': [
      'Analyzing experiment data...',
      'Finding similar patterns...',
      'Researching best practices...',
      'Validating hypotheses...',
    ],
  };

  const roleTasks = tasks[role] || [];
  return roleTasks[Math.floor(Math.random() * roleTasks.length)] || 'Processing...';
}
