"use client";
import { useEffect, useState } from "react";
import { onSnapshot, query, orderBy, limit } from "firebase/firestore";
import { getDriftMapRef } from "@/lib/firestore/driftMapSchema";
import eventBus from "@/lib/EventBus"; // if you already have an eventBus

// --- DriftMap math utilities (from Mistral) ---
function clusterPoints(points: any[], r = 100): any[][] {
  const clusters: any[][] = [];
  const visited = new Set();
  for (let i = 0; i < points.length; i++) {
    if (visited.has(i)) continue;
    const cluster = [points[i]];
    for (let j = i + 1; j < points.length; j++) {
      if (visited.has(j)) continue;
      const dx = points[i].x - points[j].x;
      const dy = points[i].y - points[j].y;
      if (dx * dx + dy * dy <= r * r) {
        cluster.push(points[j]);
        visited.add(j);
      }
    }
    clusters.push(cluster);
  }
  return clusters;
}

function temporalDecay(deltaT, tau = 600000) {
  return Math.exp(-deltaT / tau);
}

function calculateDensity(points, weights, area) {
  const sumWeights = weights.reduce((a, b) => a + b, 0);
  return sumWeights / area;
}

function meanSeverity(latencies, mu, sigma) {
  const sum = latencies.reduce((a, l) => a + Math.abs(l - mu) / sigma, 0);
  return sum / latencies.length;
}

// --- Component ---
export default function DriftMap() {
  const [clusters, setClusters] = useState<any[]>([]);

  useEffect(() => {
    const q = query(getDriftMapRef(), orderBy("createdAt", "desc"), limit(100));
    const unsub = onSnapshot(q, (snap) =>
      setClusters(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return () => unsub();
  }, []);

  return (
    <div className="relative w-full h-96 rounded-lg border border-gray-800 bg-gray-950 overflow-hidden">
      <svg className="absolute inset-0 w-full h-full">
        {clusters.map((c) => (
          <circle
            key={c.id}
            cx={c.center?.x || 0}
            cy={c.center?.y || 0}
            r={Math.max(4, (c.density || 0) * 3)}
            fill={`rgba(255,0,0,${c.decay || 0.4})`}
          />
        ))}
      </svg>
      <div className="absolute top-2 left-3 text-xs text-gray-400">
        🗺 Predictive Drift Map — {clusters.length} clusters
      </div>
    </div>
  );
}
