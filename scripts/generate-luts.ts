#!/usr/bin/env node
import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'
import { rgb } from 'd3-color'
import { interpolateViridis, interpolateMagma, interpolateInferno, interpolatePlasma } from 'd3-scale-chromatic'

const OUT_DIR = join(process.cwd(), 'public', 'colormaps')
const N = 256

type LutSpec = { name: string; fn: (t: number) => string }

const luts: LutSpec[] = [
  { name: 'viridis', fn: interpolateViridis },
  { name: 'magma', fn: interpolateMagma },
  { name: 'inferno', fn: interpolateInferno },
  { name: 'plasma', fn: interpolatePlasma },
]

function sample(fn: (t: number) => string, n = N) {
  const arr: number[][] = []
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1)
    const c = rgb(fn(t))
    // store as 0..255 integers for compactness
    arr.push([Math.round(c.r), Math.round(c.g), Math.round(c.b)])
  }
  return arr
}

if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true })

for (const lut of luts) {
  const data = sample(lut.fn)
  const file = join(OUT_DIR, `${lut.name}-256.json`)
  writeFileSync(file, JSON.stringify(data), 'utf8')
  // eslint-disable-next-line no-console
  console.log(`Wrote ${file}`)
}

