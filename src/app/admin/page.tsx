'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Brain, Settings, Shield, Code } from 'lucide-react';
import AgentTraceViewer from '@/components/sos/AgentTraceViewer';
import CVRASuggestions from '@/components/sos/CVRASuggestions';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'traces' | 'cvra' | 'system'>('cvra');

  const tabs = [
    {
      id: 'cvra' as const,
      name: 'CVRA Learning',
      icon: Brain,
      description: 'Canon proposals & self-modification',
    },
    {
      id: 'traces' as const,
      name: 'Agent Traces',
      icon: Activity,
      description: 'Agent execution logs',
    },
    {
      id: 'system' as const,
      name: 'System Status',
      icon: Settings,
      description: 'Platform health & metrics',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Header */}
      <div className="border-b border-amber-500/30 bg-gray-900/80 backdrop-blur">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-amber-400 flex items-center gap-2">
                <Shield className="w-6 h-6" />
                AGI-CAD Admin
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                System monitoring, debugging, and learning insights
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <div className="px-3 py-1.5 bg-green-500/20 border border-green-500/40 rounded-full text-green-300">
                ● Operational
              </div>
              <div className="px-3 py-1.5 bg-gray-800/60 border border-gray-700 rounded-full text-gray-400">
                Phase 19B Active
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-800">
        <div className="container mx-auto px-6">
          <div className="flex gap-1 -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-6 py-4 flex items-center gap-3 transition-all ${
                  activeTab === tab.id
                    ? 'text-amber-400'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <div className="text-left">
                  <div className="text-sm font-semibold">{tab.name}</div>
                  <div className="text-xs opacity-60">{tab.description}</div>
                </div>

                {/* Active Indicator */}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-6">
        <div className="h-[calc(100vh-220px)]">
          {activeTab === 'cvra' && <CVRASuggestions />}
          {activeTab === 'traces' && <AgentTraceViewer />}
          {activeTab === 'system' && <SystemStatus />}
        </div>
      </div>
    </div>
  );
}

function SystemStatus() {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center space-y-4">
        <Code className="w-16 h-16 text-gray-600 mx-auto" />
        <h3 className="text-xl font-semibold text-gray-400">System Status</h3>
        <p className="text-gray-500 max-w-md">
          System monitoring dashboard coming in Phase 20.
          <br />
          Will include: Firestore metrics, Pinecone status, agent performance, VAULT statistics.
        </p>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6 max-w-2xl mx-auto">
          <div className="bg-gray-900/60 border border-gray-700 rounded-lg p-4">
            <div className="text-sm text-gray-500 mb-1">Platform</div>
            <div className="text-2xl font-bold text-green-400">Operational</div>
          </div>
          <div className="bg-gray-900/60 border border-gray-700 rounded-lg p-4">
            <div className="text-sm text-gray-500 mb-1">Firestore</div>
            <div className="text-2xl font-bold text-green-400">Connected</div>
          </div>
          <div className="bg-gray-900/60 border border-gray-700 rounded-lg p-4">
            <div className="text-sm text-gray-500 mb-1">Pinecone</div>
            <div className="text-2xl font-bold text-green-400">Ready</div>
          </div>
        </div>
      </div>
    </div>
  );
}
