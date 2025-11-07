'use client';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import FusionPanel from '../../components/panels/FusionPanel';
import VaultPanel from '../../components/panels/VaultPanel';
import ForgePanel from '../../components/panels/ForgePanel';
import { initializeVault } from '@/lib/vault';
import DriftMapCanvas from '@/components/DriftMapCanvas';
import { initializeFusionBridge } from '@/lib/meta/fusion-bridge';
import RouterPanel from '@/components/RouterPanel';
import RouterControlPanel from '@/components/RouterControlPanel';

export default function DashboardPage() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    // Initialize Vault and Fusion Bridge on mount
    const init = async () => {
      try {
        await initializeVault();
        await initializeFusionBridge();
        console.log('✅ Dashboard initialized: Vault + Fusion Bridge active');
      } catch (error) {
        console.error('❌ Dashboard initialization error:', error);
      }
    };

    init();
  }, []);

  return (
    <Layout>
      <div className="forge-theme min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-serif mb-2 text-amber-200">
            AGI-CAD Dashboard
          </h1>
          <p className="text-amber-400/80 mb-8">
            Phase 10E: Vault Sync + Fusion Bridge + Real-time Telemetry
          </p>
          <div className="mb-6 relative">
            <div className="mb-2 flex items-center text-xs text-amber-300/80">
              <span className="opacity-80">Dashboard</span>
              <span className="mx-2">/</span>
              <span className="font-medium">Router HUD</span>
            </div>
            <h2 className="text-xl font-semibold text-amber-200 mb-2">Router HUD</h2>
            <RouterPanel />
            <button
              onClick={() => setOpen(true)}
              className="fixed bottom-6 right-6 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 shadow-lg"
            >
              ⚙ Control
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Fusion Telemetry */}
            <div className="lg:col-span-2 space-y-6">
              <FusionPanel />
              <div className="relative rounded-lg overflow-hidden border border-amber-500/20" style={{ height: 360 }}>
                <DriftMapCanvas />
              </div>
            </div>

            {/* Right Column: Vault & Forge */}
            <div className="space-y-6">
              <VaultPanel />
              <ForgePanel />
            </div>
          </div>
        </div>
      </div>
      <RouterControlPanel open={open} onClose={() => setOpen(false)} />
    </Layout>
  );
}
