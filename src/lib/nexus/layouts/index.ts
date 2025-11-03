// src/lib/nexus/layouts/index.ts

export { default as GeoSpatialLayout } from './geo-spatial';
export { default as FlowchartLayout } from './flowchart';

// Export layout types for UI
export const AVAILABLE_LAYOUTS = [
  'solar',
  'graph', 
  'timeline',
  'hierarchy',
  'geo-spatial', // NEW
  'flowchart'    // NEW
] as const;

export type LayoutType = typeof AVAILABLE_LAYOUTS[number];
