// Phase 8C: Upload + visualize AGC data in WebGPU canvas
"use client";
import React, { useRef, useState } from "react";
import { initWebGPU } from "@/src/lib/renderer/initWebGPU";
import { parseAGC } from "@/src/lib/renderer/agcParser";

export default function ForgeViewer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [log, setLog] = useState<string>("Drop an .agc file to render");

  const handleFile = async (f: File) => {
    setLog(`Parsing ${f.name} …`);
    const data = await parseAGC(f);
    setLog(`Loaded ${data.format} with ${data.vertices.length / 3} points`);

    const { frame } = await initWebGPU(canvasRef.current!);
    // simple animation loop, later we’ll feed vertex buffer
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
      <canvas ref={canvasRef} className="w-full h-full block" />
      <div className="absolute inset-x-0 bottom-2 text-center text-xs">{log}</div>
    </div>
  );
}
