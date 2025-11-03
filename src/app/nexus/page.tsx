/**
 * Phase 17C: Nexus Glyph Visualizer Page with Layout Switcher
 * Displays all 20 lab glyphs with 6 different layout modes
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import NexusGlyphAnimator from '@/components/nexus/NexusGlyphAnimator';
import { LayoutType, LAYOUT_CONFIGS } from '@/lib/nexus/types';

export default function NexusPage() {
  const [activeLayout, setActiveLayout] = useState<LayoutType>('solar');

  return (
    <div className="w-screen h-screen bg-black overflow-hidden">
      {/* Header */}
      <div className="absolute top-4 left-4 z-10 text-white">
        <h1 className="text-2xl font-bold mb-2">AGI-CAD Nexus</h1>
        <p className="text-sm text-gray-400">Phase 17C: Multi-Layout Visualizer</p>
        <p className="text-xs text-gray-500 mt-1">20 Lab Types • 6 Layout Modes</p>

        {/* Lab Access Buttons */}
        <div className="mt-4 space-y-2">
          <Link href="/labs">
            <button className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition duration-150 shadow-lg">
              Science Labs Hub →
            </button>
          </Link>
          <Link href="/plasma-lab">
            <button className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition duration-150 shadow-lg">
              Open Plasma Lab →
            </button>
          </Link>
        </div>
      </div>

      {/* Layout Switcher */}
      <div className="absolute top-4 right-4 z-10">
        <div className="bg-gray-900/90 backdrop-blur-sm rounded-lg p-3 border border-gray-700">
          <h3 className="text-white text-sm font-semibold mb-3">Layout Mode</h3>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(LAYOUT_CONFIGS) as LayoutType[]).map((layout) => {
              const config = LAYOUT_CONFIGS[layout];
              const isActive = activeLayout === layout;

              return (
                <button
                  key={layout}
                  onClick={() => setActiveLayout(layout)}
                  className={`
                    px-3 py-2 rounded-md text-xs font-medium transition-all duration-200
                    ${isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }
                  `}
                  title={config.description}
                >
                  {config.name}
                </button>
              );
            })}
          </div>

          {/* Active Layout Info */}
          <div className="mt-3 pt-3 border-t border-gray-700">
            <p className="text-xs text-gray-400">
              {LAYOUT_CONFIGS[activeLayout].description}
            </p>
          </div>
        </div>
      </div>

      {/* 3D Visualizer */}
      <NexusGlyphAnimator
        width={typeof window !== 'undefined' ? window.innerWidth : 1920}
        height={typeof window !== 'undefined' ? window.innerHeight : 1080}
        enableControls={true}
        activeLayout={activeLayout}
      />
    </div>
  );
}
