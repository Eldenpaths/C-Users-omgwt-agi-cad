// CLAUDE-EDIT: Phase 8C Glyph Language v1.0 (MVP)
// CLAUDE-META: Phase 9B Hybrid Patch - Nexus Commands
export type GlyphCmd =
  | { t: "NOTE"; text: string }
  | { t: "MARK"; x: number; y: number; label?: string }
  | { t: "LINE"; x1: number; y1: number; x2: number; y2: number }
  | { t: "BOX"; x: number; y: number; w: number; h: number; label?: string }
  | { t: "SPAWN"; parentId: string; name: string }
  | { t: "MONITOR"; agentId: string }
  | { t: "RESET" }
  | { t: "STATUS" };

export function parseGlyph(src: string): GlyphCmd[] {
  // Simple, whitespace-insensitive DSL:
  // NOTE "text..."
  // MARK x y "label?"
  // LINE x1 y1 x2 y2
  // BOX x y w h "label?"
  // SPAWN parent:name (Phase 9B Nexus)
  // MONITOR id (Phase 9B Nexus)
  // RESET (Phase 9B Nexus)
  // STATUS (Phase 9B Nexus)
  const lines = src.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  const cmds: GlyphCmd[] = [];
  for (const line of lines) {
    const mNote = line.match(/^NOTE\s+"(.+)"$/i);
    if (mNote) { cmds.push({ t: "NOTE", text: mNote[1] }); continue; }

    const mMark = line.match(/^MARK\s+(-?\d+)\s+(-?\d+)(?:\s+"(.+)")?$/i);
    if (mMark) { cmds.push({ t: "MARK", x:+mMark[1], y:+mMark[2], label:mMark[3] }); continue; }

    const mLine = line.match(/^LINE\s+(-?\d+)\s+(-?\d+)\s+(-?\d+)\s+(-?\d+)$/i);
    if (mLine) { cmds.push({ t:"LINE", x1:+mLine[1], y1:+mLine[2], x2:+mLine[3], y2:+mLine[4] }); continue; }

    const mBox = line.match(/^BOX\s+(-?\d+)\s+(-?\d+)\s+(\d+)\s+(\d+)(?:\s+"(.+)")?$/i);
    if (mBox) { cmds.push({ t:"BOX", x:+mBox[1], y:+mBox[2], w:+mBox[3], h:+mBox[4], label:mBox[5] }); continue; }

    // Phase 9B: Nexus commands
    const mSpawn = line.match(/^SPAWN\s+(\S+):(\S+)$/i);
    if (mSpawn) { cmds.push({ t: "SPAWN", parentId: mSpawn[1], name: mSpawn[2] }); continue; }

    const mMonitor = line.match(/^MONITOR\s+(\S+)$/i);
    if (mMonitor) { cmds.push({ t: "MONITOR", agentId: mMonitor[1] }); continue; }

    if (line.match(/^RESET$/i)) { cmds.push({ t: "RESET" }); continue; }

    if (line.match(/^STATUS$/i)) { cmds.push({ t: "STATUS" }); continue; }
  }
  return cmds;
}
