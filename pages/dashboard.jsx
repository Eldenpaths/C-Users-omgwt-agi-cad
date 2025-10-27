"use client";

import { useRouter } from "next/router";
import useAuth from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import HudSync from "@/components/HudSync";
import SentinelHUD from "@/components/SentinelHUD";
import { runVaultSweep } from "@/lib/vault";

export default function Dashboard() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <main className="h-screen flex items-center justify-center bg-gray-950 text-gray-200">
        <p>Loading dashboard...</p>
      </main>
    );
  }

  return (
    <Layout>
      <section className="p-6">
        <h1 className="text-3xl font-bold text-gray-100 mb-4">
          AGI-CAD Dashboard
        </h1>

        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
          <h2 className="text-2xl font-bold mb-4 opacity-90">
            Main Dashboard Controls
          </h2>

          <div className="flex flex-col gap-3">
            {/* 🔹 Run Vault Sweep Button */}
            <button
              onClick={() => {
                if (user && user.uid) {
                  runVaultSweep(user);
                } else {
                  console.warn("User not ready yet");
                  alert("Please wait for authentication to finish.");
                }
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Run Vault Sweep
            </button>

            {/* 🔹 Open Design Panel */}
            <button
              onClick={() => alert("Feature not implemented yet.")}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
            >
              Open Design Panel
            </button>

            {/* 🔹 Sign Out */}
            <button
              onClick={logout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* 🔹 Phase 7 HUD Systems */}
        <HudSync />
        <SentinelHUD />
      </section>
    </Layout>
  );
}
