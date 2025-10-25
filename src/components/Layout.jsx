"use client";

import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import useSidebarState from "@/hooks/useSidebarState";

export default function Layout({ children }) {
  const { open: sidebarOpen, toggle } = useSidebarState();

  return (
    <div className="flex h-screen bg-[var(--bg)] text-[var(--fg)] transition-colors duration-300">
      <Sidebar open={sidebarOpen} setOpen={() => toggle()} />
      <div className="flex flex-col flex-1 relative">
        <Topbar toggleSidebar={toggle} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
