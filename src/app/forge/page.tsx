// CLAUDE-EDIT: Compose ForgeViewer + GlyphConsole + AgentOverlay
// CLAUDE-META: Phase 9B Hybrid Patch - Nexus Integration
"use client";

export const dynamic = 'force-dynamic';

import { useGlyphs } from "@/hooks/useGlyphs";
import { useNexusState } from "@/hooks/useNexusState";
import { useEffect } from "react";
import GlyphConsole from "@/components/glyph/GlyphConsole";
import AgentOverlay from "@/components/glyph/AgentOverlay";
import ForgeViewer from "@/components/ForgeViewer";
import NexusViz from "@/components/nexus/NexusViz";
import DriftMonitorPanel from "@/components/nexus/DriftMonitorPanel";

export default function ForgePage() {
  const { overlays, commands } = useGlyphs();
  const { agents, spawnAgent, resetNexus, error } = useNexusState();

  // Process Nexus commands from glyph input
  useEffect(() => {
    commands.forEach(cmd => {
      if (cmd.t === "SPAWN") {
        spawnAgent({ parentId: cmd.parentId, name: cmd.name });
      } else if (cmd.t === "RESET") {
        resetNexus();
      }
      // MONITOR and STATUS are display-only, no action needed
    });
  }, [commands, spawnAgent, resetNexus]);

  return (
    <div className="grid gap-6 p-8 md:grid-cols-12">
      <div className="md:col-span-8 space-y-3">
        <div className="h-[400px]">
          <ForgeViewer overlays={overlays} />
        </div>
        <div className="h-[400px] relative">
          <NexusViz agents={agents} />
          {error && (
            <div className="absolute bottom-4 right-4 bg-red-900/80 text-red-200 px-4 py-2 rounded text-sm font-mono">
              {error}
            </div>
          )}
        </div>
      </div>
      <div className="md:col-span-4 space-y-3">
        <GlyphConsole />
        <div className="h-[400px]">
          <DriftMonitorPanel agents={agents} />
        </div>
        <AgentOverlay />
      </div>
    </div>
  );
}
