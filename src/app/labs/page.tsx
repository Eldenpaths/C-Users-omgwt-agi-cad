/**
 * Science Labs Hub
 * Central dashboard for accessing all AGI-CAD Science Labs
 */

'use client';

// Disable static generation to prevent Firebase client code from running during build
export const dynamic = 'force-dynamic';

import React from 'react';
import Link from 'next/link';
import AuthGuard from '@/components/auth/AuthGuard';
import { useAuth } from '@/lib/auth/AuthContext';
import {
  Zap,
  Wind,
  Sparkles,
  Atom,
  Box,
  Beaker,
  ArrowRight,
  Activity,
  CheckCircle,
  Clock,
  LogOut,
  User
} from 'lucide-react';
import { LAB_REGISTRY, getLabStats, type LabDefinition } from '@/lib/science-labs/LabRegistry';

// Icon mapping for lucide-react
const iconMap: Record<string, any> = {
  Zap,
  Wind,
  Sparkles,
  Atom,
  Box,
  Beaker,
  Flask: Beaker, // Flask not available, use Beaker instead
};

export default function ScienceLabsHub() {
  const stats = getLabStats();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950 to-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-indigo-800/30 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-indigo-300 mb-2">
                AGI-CAD Science Labs
              </h1>
              <p className="text-gray-400 text-sm">
                Distributed simulation infrastructure for physics and chemistry experiments
              </p>
            </div>

            {/* Quick Stats & User Menu */}
            <div className="flex items-center space-x-6">
            <div className="hidden md:flex items-center space-x-6">
              <div className="text-right">
                <p className="text-2xl font-bold text-green-400">{stats.activeLabs}</p>
                <p className="text-xs text-gray-400">Active Labs</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-400">{stats.activeExperiments}</p>
                <p className="text-xs text-gray-400">Running Experiments</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-purple-400">{stats.totalLabs}</p>
                <p className="text-xs text-gray-400">Total Labs</p>
              </div>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-3">
              {user && (
                <>
                  <div className="hidden sm:flex items-center space-x-2 px-3 py-2 bg-indigo-900/30 rounded-lg border border-indigo-700/30">
                    <User className="w-4 h-4 text-indigo-400" />
                    <span className="text-sm text-gray-300">
                      {user.displayName || user.email}
                    </span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-700/30 rounded-lg text-sm font-medium transition duration-150"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Sign Out</span>
                  </button>
                </>
              )}
            </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-8 py-12">
        {/* Status Banner */}
        <div className="mb-8 p-4 bg-indigo-900/20 border border-indigo-700/30 rounded-lg flex items-center space-x-3">
          <Activity className="w-5 h-5 text-green-400" />
          <div>
            <p className="text-sm font-medium">System Status: Operational</p>
            <p className="text-xs text-gray-400">
              {stats.activeLabs} lab{stats.activeLabs !== 1 ? 's' : ''} online •
              {stats.activeExperiments} experiment{stats.activeExperiments !== 1 ? 's' : ''} running •
              {stats.comingSoon} coming soon
            </p>
          </div>
        </div>

        {/* Labs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {LAB_REGISTRY.map((lab) => (
            <LabCard key={lab.id} lab={lab} />
          ))}
        </div>

        {/* Footer Info */}
        <div className="mt-16 text-center text-gray-500 text-sm">
          <p>AGI-CAD Science Labs v1.0 • Real-time Physics Simulation Infrastructure</p>
          <p className="mt-2">Powered by Lab Router • 30 FPS Telemetry • Agent Command Interface</p>
        </div>
      </main>
      </div>
    </AuthGuard>
  );
}

/**
 * Individual Lab Card Component
 */
function LabCard({ lab }: { lab: LabDefinition }) {
  const Icon = iconMap[lab.icon] || Activity;
  const isActive = lab.status === 'active';
  const isBeta = lab.status === 'beta';
  const isComingSoon = lab.status === 'coming-soon';

  return (
    <div
      className={`
        relative p-6 rounded-xl border transition-all duration-300
        ${isActive
          ? 'bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border-indigo-600/50 hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-500/20'
          : 'bg-gray-900/40 border-gray-700/50 hover:border-gray-600'
        }
        ${isComingSoon ? 'opacity-60' : ''}
      `}
    >
      {/* Status Badge */}
      <div className="absolute top-4 right-4">
        {isActive && (
          <span className="flex items-center space-x-1 px-2 py-1 bg-green-500/20 border border-green-500/30 rounded-full text-xs text-green-400">
            <CheckCircle className="w-3 h-3" />
            <span>Active</span>
          </span>
        )}
        {isBeta && (
          <span className="px-2 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded-full text-xs text-yellow-400">
            Beta
          </span>
        )}
        {isComingSoon && (
          <span className="flex items-center space-x-1 px-2 py-1 bg-gray-500/20 border border-gray-500/30 rounded-full text-xs text-gray-400">
            <Clock className="w-3 h-3" />
            <span>Coming Soon</span>
          </span>
        )}
      </div>

      {/* Icon */}
      <div className={`
        w-16 h-16 rounded-lg flex items-center justify-center mb-4
        ${isActive
          ? 'bg-indigo-600/30 border-2 border-indigo-500/50'
          : 'bg-gray-800/50 border-2 border-gray-700/50'
        }
      `}>
        <Icon className={`w-8 h-8 ${isActive ? 'text-indigo-400' : 'text-gray-400'}`} />
      </div>

      {/* Content */}
      <h3 className="text-xl font-bold mb-2">{lab.name}</h3>
      <p className="text-sm text-gray-400 mb-4 leading-relaxed">
        {lab.description}
      </p>

      {/* Capabilities */}
      <div className="mb-4">
        <p className="text-xs text-gray-500 mb-2">Capabilities:</p>
        <div className="flex flex-wrap gap-1">
          {lab.capabilities.slice(0, 4).map((capability) => (
            <span
              key={capability}
              className="px-2 py-1 bg-gray-800/50 rounded text-xs text-gray-300 border border-gray-700/50"
            >
              {capability}
            </span>
          ))}
          {lab.capabilities.length > 4 && (
            <span className="px-2 py-1 text-xs text-gray-500">
              +{lab.capabilities.length - 4} more
            </span>
          )}
        </div>
      </div>

      {/* Experiments Count (for active labs) */}
      {isActive && lab.experiments !== undefined && (
        <div className="mb-4 text-sm text-gray-400">
          <span className="text-blue-400 font-semibold">{lab.experiments}</span> active experiment{lab.experiments !== 1 ? 's' : ''}
        </div>
      )}

      {/* Action Button */}
      {isActive ? (
        <Link href={lab.route}>
          <button className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium transition-all duration-150 flex items-center justify-center space-x-2 shadow-lg shadow-indigo-900/50">
            <span>Launch Lab</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </Link>
      ) : (
        <button
          disabled
          className="w-full px-4 py-2 bg-gray-800 text-gray-500 rounded-lg font-medium cursor-not-allowed flex items-center justify-center"
        >
          {isComingSoon ? 'Coming Soon' : 'Unavailable'}
        </button>
      )}
    </div>
  );
}
