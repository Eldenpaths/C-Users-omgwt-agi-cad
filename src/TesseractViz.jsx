import { useMetricsFeed } from "@/hooks/useMetricsFeed";
import { motion } from "framer-motion";

/**
 * Animated Tesseract Visualization
 * Driven by live data from /api/metrics
 */
export default function TesseractViz() {
  const { metrics, error } = useMetricsFeed(1000);

  if (error) return <div className="text-red-400 p-4">Error: {error}</div>;
  if (!metrics) return <div className="text-gray-400 p-4">Loading metrics...</div>;

  const { latencyT, fidelityH, costC, entropyE } = metrics;

  // Normalize to 0–1 ranges for animation intensity
  const normLatency = Math.min(1, latencyT / 100);
  const normFidelity = Math.max(0, Math.min(1, fidelityH));
  const normCost = Math.min(1, costC / 200);
  const normEntropy = Math.min(1, entropyE);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 text-gray-200">
      <h1 className="text-3xl font-bold text-cyan-400 mb-8">Tesseract Glyph Viz</h1>

      <svg viewBox="-100 -100 200 200" className="w-96 h-96 border-2 border-gray-700 rounded-xl">
        {/* Ψ Stabilizer — Fidelity */}
        <motion.rect
          x={-40} y={-40} width={80} height={80}
          stroke="#A78BFA" strokeWidth="4" fill="none"
          animate={{
            rotate: (1 - normFidelity) * 20,
            strokeDasharray: 4 + (1 - normFidelity) * 30,
          }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        />

        {/* Θ Pacer — Latency */}
        <motion.circle
          cx="0" cy="0" r="45"
          stroke={latencyT > 70 ? "#F87171" : "#34D399"}
          strokeWidth="2" fill="none"
          animate={{
            r: [45, 60, 45],
            opacity: [1, 0.4, 1],
          }}
          transition={{
            duration: 0.5 + normLatency * 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Ξ Effector — Cost */}
        {[0, 45, 90, 135].map((angle, i) => (
          <motion.line
            key={i}
            x1="0" y1="0" x2="60" y2="0"
            stroke={costC > 150 ? "#FBBF24" : "#6EE7B7"}
            strokeWidth="2"
            transform={`rotate(${angle})`}
            animate={{
              x2: 60 + normCost * 20,
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1 + normCost,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        ))}

        {/* Σ Drift Field — Entropy */}
        <motion.g opacity={normEntropy}>
          {Array.from({ length: 8 }).map((_, i) => (
            <motion.circle
              key={i}
              cx={Math.cos(i * Math.PI / 4) * 70}
              cy={Math.sin(i * Math.PI / 4) * 70}
              r="4"
              fill="#F472B6"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.3, 0.8, 0.3],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.1,
              }}
            />
          ))}
        </motion.g>
      </svg>

      {/* Live Metrics Display */}
      <div className="mt-8 grid grid-cols-2 gap-4 text-sm">
        <div className="p-4 bg-gray-800 rounded-lg">
          <div className="text-purple-400 font-semibold">Ψ Fidelity</div>
          <div className="text-2xl">{(fidelityH * 100).toFixed(1)}%</div>
        </div>
        <div className="p-4 bg-gray-800 rounded-lg">
          <div className="text-emerald-400 font-semibold">Θ Latency</div>
          <div className="text-2xl">{latencyT.toFixed(0)}ms</div>
        </div>
        <div className="p-4 bg-gray-800 rounded-lg">
          <div className="text-amber-400 font-semibold">Ξ Cost</div>
          <div className="text-2xl">${costC.toFixed(2)}</div>
        </div>
        <div className="p-4 bg-gray-800 rounded-lg">
          <div className="text-pink-400 font-semibold">Σ Entropy</div>
          <div className="text-2xl">{(entropyE * 100).toFixed(1)}%</div>
        </div>
      </div>
    </div>
  );
}
