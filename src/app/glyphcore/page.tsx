'use client'
import React from 'react'
import Layout from '@/components/Layout'
import GlyphCoreConsole from '@/components/glyph/GlyphCoreConsole'

export default function GlyphCorePage() {
  return (
    <Layout>
      <div className="forge-theme min-h-screen p-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-semibold text-amber-200">GlyphCore</h1>
          <p className="text-amber-400/80 mb-4">Phase 29B – Hybrid Compression, Schema, Fusion Bridge</p>
          <GlyphCoreConsole />
        </div>
      </div>
    </Layout>
  )
}

