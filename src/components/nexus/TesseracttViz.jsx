"use client";
import React from "react";
import { motion } from "framer-motion";
import { Stabilizer, Pacer, Effector, Nexus } from "./GlyphSet"; // reuse Phase18 glyphs

export default function TesseractViz({ metrics, engine }) {
  // Map metrics → glyph animation props
  const { latency, fidelity, cost } = metrics;
  const engineColor = engine.color;

  return (
    <motion.div
      className="relative flex items-center justify-center w-full h-full bg-gray-900 overflow-hidden rounded-2xl"
      animate={{ rotateY: latency * 0.5, rotateX: cost * 50 }}
      transition={{ type: "spring", stiffness: 60, damping: 20 }}
    >
      {/* Outer cube frame */}
      <svg viewBox="-120 -120 240 240" className="absolute w-full h-full">
        <rect x="-100" y="-100" width="200" height="200"
              fill="none" stroke="#374151" strokeWidth="2" strokeDasharray="6 6" />
        <text x="0" y="-110" textAnchor="middle"
              className="fill-gray-600 text-xs font-mono">Tesseract Boundary</text>
      </svg>

      {/* Glyph stack */}
      <svg viewBox="-100 -100 200 200" className="relative z-10">
        <Nexus engineColor={engineColor}/>
        <Effector cost={cost}/>
        <Pacer latency={latency} threshold={60}/>
        <Stabilizer fidelity={fidelity}/>
      </svg>

      <motion.div
        className="absolute bottom-3 text-xs font-mono text-gray-500"
        animate={{ opacity: [1, 0.6, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        Λ {engine.name} · Ψ {fidelity.toFixed(2)} · Θ {latency.toFixed(1)} · Ξ {cost.toFixed(2)}
      </motion.div>
    </motion.div>
  );
}
