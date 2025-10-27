// CLAUDE-EDIT: GlyphConsole (wraps hook + input)
"use client";
import { useGlyphs } from "@/hooks/useGlyphs";
import GlyphInput from "./GlyphInput";

export default function GlyphConsole() {
  const { src, setSrc } = useGlyphs();
  return (
    <div className="space-y-3">
      <GlyphInput value={src} onChange={setSrc} />
      <div className="forge-panel p-3 rounded-lg text-sm">
        <div className="opacity-70">Console</div>
        <div className="opacity-60">OK</div>
      </div>
    </div>
  );
}
