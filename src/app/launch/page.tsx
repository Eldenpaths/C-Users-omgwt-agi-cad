'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, Atom, Zap, Brain, Telescope, Beaker, TrendingUp, Play } from 'lucide-react';

export default function LaunchPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Main content */}
      <div className={`relative z-10 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        {/* Hero section */}
        <div className="container mx-auto px-6 pt-20 pb-12">
          <div className="text-center mb-16">
            {/* Logo/Icon */}
            <div className="inline-flex items-center justify-center mb-8">
              <div className="relative">
                <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-2xl animate-glow"></div>
                <div className="relative bg-gradient-to-br from-amber-400 to-amber-600 p-6 rounded-full shadow-2xl">
                  <Sparkles className="w-16 h-16 text-gray-900" />
                </div>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600 bg-clip-text text-transparent animate-glow">
              AGI-CAD
            </h1>
            <p className="text-2xl md:text-3xl text-gray-300 mb-4 font-light">
              Advanced General Intelligence
            </p>
            <p className="text-xl text-gray-400 mb-8 max-w-3xl mx-auto">
              A mystical workspace where AI agents collaborate across multi-domain labs,
              learning from every experiment and evolving toward collective intelligence.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link
                href="/dashboard"
                className="group relative px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 rounded-lg font-semibold text-gray-900 shadow-lg hover:shadow-amber-500/50 transition-all duration-300 hover:scale-105"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <Play className="w-5 h-5" />
                  Enter the FORGE
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-amber-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity blur-xl"></div>
              </Link>

              <Link
                href="/sos"
                className="px-8 py-4 bg-gray-800/50 border border-gray-700 rounded-lg font-semibold text-gray-300 hover:bg-gray-700/50 hover:border-amber-500/50 transition-all duration-300 hover:scale-105"
              >
                Explore SOS Terminal
              </Link>
            </div>

            {/* Status badges */}
            <div className="flex flex-wrap gap-3 justify-center">
              <span className="px-4 py-2 bg-green-900/30 border border-green-700/50 rounded-full text-green-400 text-sm font-medium flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                All Systems Operational
              </span>
              <span className="px-4 py-2 bg-amber-900/30 border border-amber-700/50 rounded-full text-amber-400 text-sm font-medium">
                Phase 20 Complete
              </span>
              <span className="px-4 py-2 bg-purple-900/30 border border-purple-700/50 rounded-full text-purple-400 text-sm font-medium">
                Learning Active
              </span>
            </div>
          </div>

          {/* Features grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            <FeatureCard
              icon={<Atom className="w-8 h-8" />}
              title="4 Domain Labs"
              description="Plasma, Spectral, Chemistry & Crypto labs running parallel experiments"
              color="from-amber-500 to-orange-600"
            />
            <FeatureCard
              icon={<Brain className="w-8 h-8" />}
              title="Intelligent Memory"
              description="VAULT stores all decisions with Pinecone embeddings for semantic recall"
              color="from-purple-500 to-pink-600"
            />
            <FeatureCard
              icon={<Zap className="w-8 h-8" />}
              title="CVRA Analysis"
              description="Canon-Vault Reconciliation detects anomalies and proposes optimizations"
              color="from-blue-500 to-cyan-600"
            />
            <FeatureCard
              icon={<Telescope className="w-8 h-8" />}
              title="Live Simulations"
              description="Real-time multi-lab simulations with unified scheduling engine"
              color="from-green-500 to-emerald-600"
            />
          </div>

          {/* Architecture highlights */}
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-amber-400 text-center mb-8">
              Built for Intelligence Evolution
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <ArchitectureCard
                icon={<Beaker className="w-6 h-6" />}
                title="Learning Pipeline"
                items={[
                  'Zod validation',
                  'Telemetry tracking',
                  'Session persistence',
                  'Vector embeddings'
                ]}
              />
              <ArchitectureCard
                icon={<Brain className="w-6 h-6" />}
                title="Agent Orchestration"
                items={[
                  'LangChain.js integration',
                  'Tool-calling workflows',
                  'Multi-agent coordination',
                  'Recursive reasoning'
                ]}
              />
              <ArchitectureCard
                icon={<TrendingUp className="w-6 h-6" />}
                title="Analytics Dashboards"
                items={[
                  'Learning metrics',
                  'CVRA suggestions',
                  'Simulation monitoring',
                  'Real-time telemetry'
                ]}
              />
            </div>
          </div>

          {/* Tech stack */}
          <div className="mt-16 text-center">
            <p className="text-gray-500 text-sm mb-4">Powered by</p>
            <div className="flex flex-wrap justify-center gap-6 text-gray-400 text-sm">
              <span>Next.js 14</span>
              <span>•</span>
              <span>React 18</span>
              <span>•</span>
              <span>TypeScript</span>
              <span>•</span>
              <span>Firebase</span>
              <span>•</span>
              <span>Pinecone</span>
              <span>•</span>
              <span>LangChain.js</span>
              <span>•</span>
              <span>Tailwind CSS</span>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-16 text-center text-gray-500 text-sm">
            <p>AGI-CAD v1.0.0-beta • Phases 1-20 Complete</p>
            <p className="mt-2">Built with Claude Code • Anthropic</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description, color }: {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}) {
  return (
    <div className="group relative bg-gray-800/30 border border-gray-700 rounded-xl p-6 hover:border-amber-500/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-amber-500/10">
      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-gray-900/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
      <div className="relative z-10">
        <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${color} mb-4 shadow-lg group-hover:shadow-xl transition-shadow`}>
          <div className="text-white">
            {icon}
          </div>
        </div>
        <h3 className="text-xl font-semibold text-amber-300 mb-2">{title}</h3>
        <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function ArchitectureCard({ icon, title, items }: {
  icon: React.ReactNode;
  title: string;
  items: string[];
}) {
  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 hover:border-amber-700/50 transition-colors">
      <div className="flex items-center gap-3 mb-4">
        <div className="text-amber-400">
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-amber-300">{title}</h3>
      </div>
      <ul className="space-y-2">
        {items.map((item, idx) => (
          <li key={idx} className="text-gray-400 text-sm flex items-start gap-2">
            <span className="text-amber-400 mt-1">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
