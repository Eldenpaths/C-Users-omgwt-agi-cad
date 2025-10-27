"use client";

import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import useSidebarState from "@/hooks/useSidebarState";
import { useHeartbeat } from "@/hooks/useHeartbeat";
import AgentHUD from "@/components/Agenthud";

/**
 * Phase 7 Layout — integrates live telemetry HUD + heartbeat polling
 * Follows Claude 5B→6 sync rules (no direct writes outside hook)
 */
export default function Layout({ children }) {
  const { open: sidebarOpen, toggle } = useSidebarState();
  const { status, checksum, delta } = useHeartbeat();

  return (
    <div className="flex h-screen bg-[var(--bg)] text-[var(--fg)] transition-colors duration-300">
      {/* Sidebar */}
      <Sidebar open={sidebarOpen} setOpen={() => toggle()} />

      {/* Main column */}
      <div className="flex flex-col flex-1 relative">
        <Topbar toggleSidebar={toggle} />

        {/* Primary content area */}
        <main className="flex-1 overflow-y-auto p-6 relative">
          {children}

          {/* ✅ Phase 7 Integrity HUD */}
          <AgentHUD status={status} checksum={checksum} delta={delta} />
        </main>
      </div>
    </div>
  );
}
