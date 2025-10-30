'use client';

export const dynamic = 'force-dynamic';

import { useEffect } from 'react';
import Layout from '../../components/Layout';
import FusionPanel from '../../components/panels/FusionPanel';
import VaultPanel from '../../components/panels/VaultPanel';
import ForgePanel from '../../components/panels/ForgePanel';
import { initializeVault } from '@/lib/vault';
import { initializeFusionBridge } from '@/lib/meta/fusion-bridge';

export default function DashboardPage() {
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Fusion Telemetry */}
            <div className="lg:col-span-2">
              <FusionPanel />
            </div>

            {/* Right Column: Vault & Forge */}
            <div className="space-y-6">
              <VaultPanel />
              <ForgePanel />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
