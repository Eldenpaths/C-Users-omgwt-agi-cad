// frontend/src/components/RenderPanel.tsx
// Phase 8B: Canvas + render loop + basic FPS HUD (no external deps)

'use client';
import React, { useEffect, useRef, useState } from 'react';
import { initWebGPU } from '@/src/lib/renderer/initWebGPU';

export default function RenderPanel() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const [status, setStatus] = useState<'boot'|'running'|'error'>('boot');
  const [fps, setFps] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current!;
    let running = true;
    let last = performance.now();
    let frames = 0;
    let fpsClock = last;

    const boot = async () => {
      try {
        // Resize to device pixel ratio for crispness
        const resize = () => {
          const dpr = Math.min(window.devicePixelRatio || 1, 2);
          const rect = canvas.getBoundingClientRect();
          canvas.width = Math.max(2, Math.floor(rect.width * dpr));
          canvas.height = Math.max(2, Math.floor(rect.height * dpr));
        };
        resize(); window.addEventListener('resize', resize);

        const { frame } = await initWebGPU(canvas);

        const loop = () => {
          if (!running) return;
          frame();

          // Simple FPS meter
          frames++;
          const now = performance.now();
          if (now - fpsClock >= 500) {
            setFps(Math.round((frames * 1000) / (now - fpsClock)));
            fpsClock = now; frames = 0;
          }
          rafRef.current = requestAnimationFrame(loop);
        };

        setStatus('running');
        loop();

        return () => window.removeEventListener('resize', resize);
      } catch (e) {
        console.error(e);
        setStatus('error');
      }
    };

    boot();

    return () => {
      running = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div className="relative w-full h-[70vh] rounded-2xl overflow-hidden bg-neutral-950/90 ring-1 ring-white/10">
      <canvas ref={canvasRef} className="w-full h-full block [image-rendering:pixelated]" />
      <div className="absolute top-3 right-3 text-xs px-2 py-1 rounded bg-black/60 text-amber-200 shadow">
        {status === 'running' ? `FPS ${fps}` : status.toUpperCase()}
      </div>
      {/* Theme hooks: parent can toggle classes: theme-parchment / theme-cyber / theme-eclipse */}
    </div>
  );
}
