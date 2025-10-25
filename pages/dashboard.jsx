"use client";
import { useRouter } from "next/router";
import useAuth from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import HudSync from "@/components/HudSync";
import useAgents from "@/hooks/useAgents";   // ← NEW import for Phase 6

export default function Dashboard() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  // 🚀 Activate Forge + Vault agent listeners once user authenticated
  useAgents(user);

  if (loading) {
    return (
      <main className="h-screen flex items-center justify-center bg-gray-950 text-gray-100">
        <p>Loading dashboard…</p>
      </main>
    );
  }

  if (!user) {
    console.warn("🚫 Unauthorized access, redirecting to login");
    if (typeof window !== "undefined") router.push("/");
    return null;
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* 🔭 Integrity HUD */}
        <HudSync />

        {/* 🧩 Agent Telemetry Panel (for 6E QA) */}
        <section className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
          <h2 className="text-lg font-semibold mb-2">Agent Events Log</h2>
          <p className="opacity-80">
            Watch the console for <code>forge:update</code> and 
            <code>vault:update</code> messages when Firestore data changes.
          </p>
        </section>

        {/* 🧱 Main Dashboard Controls */}
        <section className="rounded-xl border border-white/10 bg-white/5 p-6">
          <h1 className="text-2xl font-bold mb-2">Welcome to AGI-CAD</h1>
          <p className="mb-4 opacity-90">Logged in as: {user.email}</p>

          <div className="flex gap-4">
            <button
              onClick={() => alert("Feature coming soon!")}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
            >
              Open Design Panel
            </button>
            <button
              onClick={logout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
            >
              Sign Out
            </button>
          </div>
        </section>
      </div>
    </Layout>
  );
}
