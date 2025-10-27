// Phase 8C: lightweight .agc parser and buffer prep
// Accepts a binary or JSON AGC file (mocked for now) and
// returns a typed array ready for GPU upload.

export type AGCData = {
  format: "crystal" | "ifs";
  vertices: Float32Array;
  meta: Record<string, any>;
};

export async function parseAGC(file: File): Promise<AGCData> {
  const text = await file.text();

  // Temporary heuristic: treat text AGC as JSON
  try {
    const json = JSON.parse(text);
    const vertices = new Float32Array(json.vertices ?? []);
    return { format: json.format ?? "crystal", vertices, meta: json.meta ?? {} };
  } catch {
    // fallback: random lattice pattern
    const vertices = new Float32Array(
      Array.from({ length: 300 }, () => Math.random() * 2 - 1)
    );
    return { format: "crystal", vertices, meta: { mock: true } };
  }
}
