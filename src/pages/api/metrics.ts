import type { NextApiRequest, NextApiResponse } from "next";

interface MetricFeed {
  timestamp: number;
  latencyT: number;
  fidelityH: number;
  costC: number;
  entropyE: number;
}

function oscillate(base: number, amplitude: number, speed: number, time: number) {
  return base + amplitude * Math.sin(speed * time + Math.random() * 0.5);
}

function generateMockMetrics(): MetricFeed {
  const now = new Date();
  const seconds = now.getSeconds() + now.getMilliseconds() / 1000;
  const t = seconds / 60;

  const latencyT = Math.max(15, oscillate(50, 20, 2 * Math.PI, t) + Math.random() * 3);
  const fidelityH = parseFloat(Math.max(0.7, 1 - latencyT / 100 + Math.random() * 0.05).toFixed(3));
  const costC = parseFloat((100 + t * 30 + Math.random() * 2).toFixed(2));

  const entropyE = parseFloat(
    (
      0.5 * Math.max(0, (latencyT - 70) / 30) +
      0.5 * (1 - fidelityH) +
      Math.random() * 0.05
    ).toFixed(3)
  );

  return {
    timestamp: now.getTime(),
    latencyT: Math.round(latencyT),
    fidelityH,
    costC,
    entropyE,
  };
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
    return;
  }

  const metrics = generateMockMetrics();
  setTimeout(() => {
    res.status(200).json(metrics);
  }, 100);
}
