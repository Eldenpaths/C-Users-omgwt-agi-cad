// frontend/src/app/viewer/page.tsx
import React from 'react';
import dynamic from 'next/dynamic';

const RenderPanel = dynamic(() => import('../../components/RenderPanel'), { ssr: false });

export default function ViewerPage() {
  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Forge Viewer (Phase 8B)</h1>
      <RenderPanel />
      <p className="text-sm opacity-70">WebGPU bootstrap running — ready to bind .agc pipelines.</p>
    </main>
  );
}
