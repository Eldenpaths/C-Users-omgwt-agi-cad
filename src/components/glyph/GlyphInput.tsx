// CLAUDE-EDIT: GlyphInput (editor)
"use client";
import { useRef } from "react";

export default function GlyphInput({ value, onChange }:{
  value: string; onChange: (v:string)=>void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  return (
    <div className="forge-panel p-3 rounded-lg">
      <div className="text-sm mb-2 opacity-80">Glyph Script</div>
      <textarea
        ref={ref}
        className="w-full h-40 bg-black/30 rounded p-3 font-mono text-amber-200 outline-none"
        value={value}
        onChange={e=>onChange(e.target.value)}
        spellCheck={false}
      />
      <div className="text-xs mt-2 opacity-60">
        Commands: NOTE "text" · MARK x y · LINE x1 y1 x2 y2 · BOX x y w h
      </div>
      <div className="text-xs mt-1 opacity-60 text-amber-400">
        Nexus: SPAWN parent:name · MONITOR id · RESET · STATUS
      </div>
    </div>
  );
}
