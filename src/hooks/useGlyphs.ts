// CLAUDE-EDIT: Phase 8C glyph state hook
// CLAUDE-META: Phase 9B Hybrid Patch - Command exposure
"use client";
import { useMemo, useState } from "react";
import { parseGlyph, type GlyphCmd } from "@/lib/glyph/lang";
import { toOverlays, type ScreenOverlay } from "@/lib/glyph/runtime";

export function useGlyphs() {
  const [src, setSrc] = useState<string>(
    'NOTE "AGI-CAD Phase 9B: Nexus Active"\n' +
    'SPAWN root:Buildsmith\n' +
    'SPAWN root:Corewright\n' +
    'SPAWN root:Simwright\n' +
    'STATUS\n' +
    'MARK 300 200 "Core"\n' +
    'BOX 120 120 160 100 "Forge"\n' +
    'LINE 120 120 280 220'
  );
  const commands: GlyphCmd[] = useMemo(() => parseGlyph(src), [src]);
  const overlays: ScreenOverlay[] = useMemo(() => toOverlays(commands), [commands]);
  return { src, setSrc, commands, overlays };
}
