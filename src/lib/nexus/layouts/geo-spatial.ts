// src/lib/nexus/layouts/geo-spatial.ts
// Phase 17C: Geo-Spatial Layout (Missing Mode #1 from Gemini Review)
// For: Elden Paths world-building, PAC Stove physical design, any real-world coordinate systems

import { LayoutStrategy, NexusNode, NodePosition } from '../types';

/**
 * Geo-Spatial Layout: Maps nodes to real-world coordinates.
 * 
 * Use Cases:
 * - Elden Paths: Place biomes, cities, terrain features on 2D map with elevation
 * - PAC Stove: Position components in 3D physical space (x,y,z in millimeters)
 * - Factory Layout: Machine placement on factory floor
 * - Urban Planning: Building positions in city grid
 * 
 * Coordinate System (Y-up, standardized):
 * - X-axis: East/West (or Width)
 * - Y-axis: Elevation/Height
 * - Z-axis: North/South (or Depth)
 */

export interface GeoSpatialMetadata {
  // Physical coordinates (units depend on project scale)
  geoPosition?: [number, number, number]; // [x, y, z]
  
  // Optional orientation (Euler angles in radians)
  orientation?: [number, number, number]; // [pitch, yaw, roll]
  
  // Scale/bounds (for large objects like buildings)
  bounds?: {
    width: number;
    height: number;
    depth: number;
  };
  
  // Map projection type (for large-scale geographic data)
  projection?: 'mercator' | 'equirectangular' | 'orthographic' | 'local';
  
  // Coordinate system metadata
  units?: 'meters' | 'millimeters' | 'feet' | 'map-units';
  origin?: [number, number, number]; // Reference point for local coordinates
}

export class GeoSpatialLayout implements LayoutStrategy {
  private config: {
    // Scale factor (how many pixels per unit)
    scale: number;
    
    // Y-axis behavior
    yAxisMode: 'elevation' | 'flat' | 'inverted';
    
    // Grid snapping
    gridSize?: number;
    
    // Coordinate limits (for large maps)
    bounds?: {
      minX: number;
      maxX: number;
      minZ: number;
      maxZ: number;
    };
  };
  
  constructor(config?: Partial<GeoSpatialLayout['config']>) {
    this.config = {
      scale: 1.0,
      yAxisMode: 'elevation',
      ...config
    };
  }
  
  layout(nodes: NexusNode[]): NodePosition[] {
    const positions: NodePosition[] = [];
    
    for (const node of nodes) {
      const metadata = node.metadata as GeoSpatialMetadata;
      
      // Get geo position or default to origin
      const geoPos = metadata.geoPosition || [0, 0, 0];
      
      // Apply scale and Y-axis mode
      let [x, y, z] = geoPos;
      x *= this.config.scale;
      z *= this.config.scale;
      
      switch (this.config.yAxisMode) {
        case 'elevation':
          y *= this.config.scale;
          break;
        case 'flat':
          y = 0; // Ignore elevation, 2D map
          break;
        case 'inverted':
          y *= -this.config.scale; // Flip Y-axis
          break;
      }
      
      // Apply grid snapping if enabled
      if (this.config.gridSize) {
        x = Math.round(x / this.config.gridSize) * this.config.gridSize;
        z = Math.round(z / this.config.gridSize) * this.config.gridSize;
      }
      
      // Apply bounds clamping
      if (this.config.bounds) {
        x = Math.max(this.config.bounds.minX, Math.min(this.config.bounds.maxX, x));
        z = Math.max(this.config.bounds.minZ, Math.min(this.config.bounds.maxZ, z));
      }
      
      positions.push({
        nodeId: node.id,
        position: [x, y, z],
        rotation: metadata.orientation || [0, 0, 0],
        scale: [1, 1, 1]
      });
    }
    
    return positions;
  }
  
  /**
   * Convert lat/lon to local XZ coordinates (for geographic data).
   * Uses simple equirectangular projection.
   */
  latLonToXZ(lat: number, lon: number, centerLat: number, centerLon: number): [number, number] {
    const R = 6371000; // Earth radius in meters
    
    // Convert to radians
    const latRad = (lat * Math.PI) / 180;
    const lonRad = (lon * Math.PI) / 180;
    const centerLatRad = (centerLat * Math.PI) / 180;
    const centerLonRad = (centerLon * Math.PI) / 180;
    
    // Equirectangular projection
    const x = R * (lonRad - centerLonRad) * Math.cos(centerLatRad);
    const z = R * (latRad - centerLatRad);
    
    return [x * this.config.scale, z * this.config.scale];
  }
  
  /**
   * Helper: Create node with geo-spatial metadata.
   */
  static createGeoNode(
    id: string,
    label: string,
    position: [number, number, number],
    options?: {
      orientation?: [number, number, number];
      bounds?: { width: number; height: number; depth: number };
      units?: string;
    }
  ): Partial<NexusNode> {
    return {
      id,
      label,
      type: 'geo_object',
      metadata: {
        geoPosition: position,
        orientation: options?.orientation,
        bounds: options?.bounds,
        units: options?.units || 'meters'
      } as GeoSpatialMetadata
    };
  }
}

/**
 * Usage Examples:
 * 
 * EXAMPLE 1: Elden Paths World Map
 * ```typescript
 * const worldLayout = new GeoSpatialLayout({
 *   scale: 0.1, // 10 units = 1 pixel
 *   yAxisMode: 'elevation',
 *   gridSize: 100 // Snap to 100-unit grid
 * });
 * 
 * const nodes = [
 *   GeoSpatialLayout.createGeoNode(
 *     'city_ironforge',
 *     'Ironforge',
 *     [1500, 300, 2200], // [x, elevation, z]
 *     { units: 'map-units' }
 *   ),
 *   GeoSpatialLayout.createGeoNode(
 *     'forest_elderwood',
 *     'Elderwood Forest',
 *     [800, 50, 1500],
 *     { bounds: { width: 500, height: 200, depth: 600 } }
 *   )
 * ];
 * 
 * const positions = worldLayout.layout(nodes);
 * ```
 * 
 * EXAMPLE 2: PAC Stove Physical Design
 * ```typescript
 * const stoveLayout = new GeoSpatialLayout({
 *   scale: 1.0, // 1:1 scale
 *   yAxisMode: 'elevation',
 *   units: 'millimeters'
 * });
 * 
 * const components = [
 *   GeoSpatialLayout.createGeoNode(
 *     'burner_front_left',
 *     'Front Left Burner',
 *     [100, 50, 150], // [x, height, z] in mm
 *     { bounds: { width: 80, height: 20, depth: 80 } }
 *   ),
 *   GeoSpatialLayout.createGeoNode(
 *     'control_panel',
 *     'Control Panel',
 *     [200, 100, 50],
 *     { orientation: [0, Math.PI / 4, 0] } // 45° rotation
 *   )
 * ];
 * ```
 * 
 * EXAMPLE 3: Real Geographic Data
 * ```typescript
 * const geoLayout = new GeoSpatialLayout({
 *   scale: 0.01,
 *   yAxisMode: 'flat' // 2D map
 * });
 * 
 * // Convert lat/lon to XZ
 * const [x, z] = geoLayout.latLonToXZ(
 *   45.5231, // Portland latitude
 *   -122.6765, // Portland longitude
 *   45.0, // Center latitude
 *   -122.0 // Center longitude
 * );
 * 
 * const node = GeoSpatialLayout.createGeoNode(
 *   'portland_office',
 *   'Portland Office',
 *   [x, 0, z]
 * );
 * ```
 */

export default GeoSpatialLayout;
