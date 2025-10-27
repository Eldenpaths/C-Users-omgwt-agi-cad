// CLAUDE-EDIT: Phase 8C glyph runtime (overlay projection)
import type { GlyphCmd } from "./lang";

export type ScreenOverlay =
  | { kind: "text"; x: number; y: number; text: string }
  | { kind: "dot"; x: number; y: number; label?: string }
  | { kind: "line"; x1: number; y1: number; x2: number; y2: number }
  | { kind: "box"; x: number; y: number; w: number; h: number; label?: string };

// For MVP we assume viewer space == screen space (pixel coords).
export function toOverlays(cmds: GlyphCmd[]): ScreenOverlay[] {
  const out: ScreenOverlay[] = [];
  for (const c of cmds) {
    if (c.t === "NOTE") out.push({ kind: "text", x: 16, y: 16, text: c.text });
    if (c.t === "MARK") out.push({ kind: "dot", x: c.x, y: c.y, label: c.label });
    if (c.t === "LINE") out.push({ kind: "line", x1: c.x1, y1: c.y1, x2: c.x2, y2: c.y2 });
    if (c.t === "BOX") out.push({ kind: "box", x: c.x, y: c.y, w: c.w, h: c.h, label: c.label });
  }
  return out;
}
