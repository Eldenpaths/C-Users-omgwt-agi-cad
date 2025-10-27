// Phase 8C: Upload + visualize AGC data in WebGPU canvas
// CLAUDE-EDIT: Copied from frontend/src/components and fixed import paths
// CLAUDE-EDIT: Added overlay support for glyph rendering
"use client";
import React, { useRef, useState } from "react";
import { initWebGPU } from "@/lib/renderer/initWebGPU";
import { parseAGC } from "@/lib/renderer/agcParser";

// CLAUDE-EDIT: overlays prop
type Overlay = { kind:"text"| "dot" | "line" | "box"; [k:string]: any };

export default function ForgeViewer({ overlays = [] as Overlay[] }:{ overlays?: Overlay[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [log, setLog] = useState<string>("Drop an .agc file to render");

  const handleFile = async (f: File) => {
    setLog(`Parsing ${f.name} …`);
    const data = await parseAGC(f);
    setLog(`Loaded ${data.format} with ${data.vertices.length / 3} points`);

    const { frame } = await initWebGPU(canvasRef.current!);
    // simple animation loop, later we'll feed vertex buffer
    const loop = () => {
      frame();
      requestAnimationFrame(loop);
    };
    loop();
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  return (
    <div
      onDrop={onDrop}
      onDragOver={(e) => e.preventDefault()}
      className="relative w-full h-[70vh] rounded-2xl overflow-hidden bg-neutral-900/90 text-amber-200"
    >
      {/* CLAUDE-EDIT: Wrapped canvas with SVG overlay layer */}
      <div className="relative">
        <canvas ref={canvasRef} className="w-full h-[520px] rounded-lg bg-black/40 border border-amber-800/40" />
        {/* overlay layer */}
        <svg className="absolute inset-0 pointer-events-none">
          {overlays.map((o, i) => {
            if (o.kind === "text") return <text key={i} x={o.x} y={o.y} fontSize="14" fill="#fbbf24">{o.text}</text>;
            if (o.kind === "dot")  return <circle key={i} cx={o.x} cy={o.y} r="4" fill="#fbbf24" />;
            if (o.kind === "line") return <line key={i} x1={o.x1} y1={o.y1} x2={o.x2} y2={o.y2} stroke="#fbbf24" strokeWidth="2" />;
            if (o.kind === "box")  return <rect key={i} x={o.x} y={o.y} width={o.w} height={o.h} fill="none" stroke="#fbbf24" strokeWidth="2" />;
            return null;
          })}
        </svg>
      </div>
      <div className="absolute inset-x-0 bottom-2 text-center text-xs">{log}</div>
    </div>
  );
}
