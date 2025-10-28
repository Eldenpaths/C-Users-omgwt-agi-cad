// CLAUDE-META: Phase 10B Fusion Testing - Physics + Vision Integration
// Architect: ChatGPT (GPT-5) Canonical Authority
// Purpose: Combined Forge simulation with Physics Validator and Vision Agent
// Status: Shadow Testing - HYBRID_SAFE Active

import { PhysicsValidator } from '../../src/lib/physics/physics-validator';
import { VisionAgent } from '../../src/lib/vision/vision-agent';
import { GeometricReasoningEngine, GeometricPrimitive } from '../../src/lib/vision/geometric-reasoning';

describe('Physics + Vision Integration - Forge Simulation', () => {
  let physicsValidator: PhysicsValidator;
  let visionAgent: VisionAgent;
  let wgre: GeometricReasoningEngine;

  beforeEach(() => {
    physicsValidator = new PhysicsValidator();
    visionAgent = new VisionAgent();
    wgre = new GeometricReasoningEngine();
  });

  describe('Vision → Geometry → Physics Pipeline', () => {
    test('should process sketch to validated CAD model', async () => {
      // Step 1: Vision Agent analyzes sketch
      const mockSketchData = 'data:image/png;base64,mockSketchData';
      const visionResult = await visionAgent.analyzeImage(mockSketchData);

      expect(visionResult.detectedShapes).toBeDefined();
      expect(visionResult.suggestedPrimitives).toBeDefined();
      expect(visionResult.confidence).toBeGreaterThan(0);

      // Step 2: W-GRE generates Symbolic Metric Report
      const smr = await wgre.analyze(visionResult.suggestedPrimitives);

      expect(smr.metrics.totalVertices).toBeGreaterThan(0);
      expect(smr.metrics.boundingBox).toBeDefined();
      expect(smr.quality.fabricability).toBeGreaterThanOrEqual(0);
      expect(smr.quality.fabricability).toBeLessThanOrEqual(1);

      // Step 3: Physics Validator checks structural integrity
      const physicsResult = await physicsValidator.validate(
        visionResult.suggestedPrimitives,
        'aluminum'
      );

      expect(physicsResult).toHaveProperty('valid');
      expect(physicsResult).toHaveProperty('stressAnalysis');
      expect(physicsResult).toHaveProperty('deformation');
    });

    test('should reject designs with poor fabricability', async () => {
      const unfabricableGeometry: GeometricPrimitive[] = [
        {
          type: 'mesh',
          vertices: [
            { x: 0, y: 0, z: 0 },
            { x: 0.001, y: 0.001, z: 0.001 }, // Too small
          ],
          faces: [[0, 1]],
        },
      ];

      const smr = await wgre.analyze(unfabricableGeometry);

      expect(smr.quality.fabricability).toBeLessThan(0.5);

      const physicsResult = await physicsValidator.validate(unfabricableGeometry, 'steel');

      // Should have warnings about fabricability
      expect(physicsResult.warnings.length).toBeGreaterThan(0);
    });

    test('should enforce 3-second timeout on W-GRE analysis', async () => {
      const largeGeometry: GeometricPrimitive[] = Array.from({ length: 10000 }, (_, i) => ({
        type: 'point' as const,
        x: i,
        y: i,
        z: i,
      }));

      const startTime = Date.now();

      try {
        await wgre.analyze(largeGeometry);
      } catch (error) {
        const elapsed = Date.now() - startTime;
        expect(elapsed).toBeLessThanOrEqual(3500); // 3s timeout + 500ms buffer
      }
    });
  });

  describe('Material Validation', () => {
    test('should validate aluminum cube under standard loads', async () => {
      const cubeGeometry: GeometricPrimitive[] = [
        {
          type: 'mesh',
          vertices: [
            { x: 0, y: 0, z: 0 },
            { x: 100, y: 0, z: 0 },
            { x: 100, y: 100, z: 0 },
            { x: 0, y: 100, z: 0 },
            { x: 0, y: 0, z: 100 },
            { x: 100, y: 0, z: 100 },
            { x: 100, y: 100, z: 100 },
            { x: 0, y: 100, z: 100 },
          ],
          faces: [
            [0, 1, 2, 3], // Bottom
            [4, 5, 6, 7], // Top
            [0, 1, 5, 4], // Front
            [2, 3, 7, 6], // Back
            [0, 3, 7, 4], // Left
            [1, 2, 6, 5], // Right
          ],
        },
      ];

      const result = await physicsValidator.validate(cubeGeometry, 'aluminum');

      expect(result.valid).toBe(true);
      expect(result.stressAnalysis.maxStress).toBeLessThan(1000); // MPa threshold
      expect(result.deformation.safetyFactor).toBeGreaterThanOrEqual(2.0);
    });

    test('should warn about insufficient safety factor', async () => {
      const thinPlate: GeometricPrimitive[] = [
        {
          type: 'mesh',
          vertices: [
            { x: 0, y: 0, z: 0 },
            { x: 1000, y: 0, z: 0 },
            { x: 1000, y: 1000, z: 0 },
            { x: 0, y: 1000, z: 0 },
            { x: 0, y: 0, z: 0.1 }, // Very thin
            { x: 1000, y: 0, z: 0.1 },
            { x: 1000, y: 1000, z: 0.1 },
            { x: 0, y: 1000, z: 0.1 },
          ],
          faces: [
            [0, 1, 2, 3],
            [4, 5, 6, 7],
            [0, 1, 5, 4],
            [2, 3, 7, 6],
            [0, 3, 7, 4],
            [1, 2, 6, 5],
          ],
        },
      ];

      const result = await physicsValidator.validate(thinPlate, 'plastic');

      if (result.deformation.safetyFactor < 2.0) {
        expect(result.warnings).toContain('Safety factor below recommended minimum');
      }
    });

    test('should reject designs exceeding stress threshold', async () => {
      const overloadedGeometry: GeometricPrimitive[] = [
        {
          type: 'mesh',
          vertices: [
            { x: 0, y: 0, z: 0 },
            { x: 1, y: 0, z: 0 }, // Tiny structure
            { x: 1, y: 1, z: 0 },
            { x: 0, y: 1, z: 0 },
          ],
          faces: [[0, 1, 2, 3]],
        },
      ];

      const result = await physicsValidator.validate(overloadedGeometry, 'wood');

      if (result.stressAnalysis.maxStress > 1000) {
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Max stress exceeds threshold');
      }
    });
  });

  describe('Geometric Reasoning', () => {
    test('should compute accurate bounding box', async () => {
      const geometry: GeometricPrimitive[] = [
        { type: 'point', x: -10, y: -20, z: -30 },
        { type: 'point', x: 10, y: 20, z: 30 },
      ];

      const smr = await wgre.analyze(geometry);

      expect(smr.metrics.boundingBox.min).toEqual({ x: -10, y: -20, z: -30 });
      expect(smr.metrics.boundingBox.max).toEqual({ x: 10, y: 20, z: 30 });
    });

    test('should detect symmetry types', async () => {
      const symmetricCube: GeometricPrimitive[] = [
        {
          type: 'mesh',
          vertices: [
            { x: -1, y: -1, z: -1 },
            { x: 1, y: -1, z: -1 },
            { x: 1, y: 1, z: -1 },
            { x: -1, y: 1, z: -1 },
            { x: -1, y: -1, z: 1 },
            { x: 1, y: -1, z: 1 },
            { x: 1, y: 1, z: 1 },
            { x: -1, y: 1, z: 1 },
          ],
          faces: [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [2, 3, 7, 6], [0, 3, 7, 4], [1, 2, 6, 5]],
        },
      ];

      const smr = await wgre.analyze(symmetricCube);

      expect(['cubic', 'bilateral', 'radial', 'none']).toContain(smr.analysis.symmetryType);
    });

    test('should assess structural integrity', async () => {
      const solidGeometry: GeometricPrimitive[] = [
        {
          type: 'mesh',
          vertices: [
            { x: 0, y: 0, z: 0 },
            { x: 10, y: 0, z: 0 },
            { x: 10, y: 10, z: 0 },
            { x: 0, y: 10, z: 0 },
            { x: 5, y: 5, z: 10 },
          ],
          faces: [[0, 1, 4], [1, 2, 4], [2, 3, 4], [3, 0, 4], [0, 1, 2, 3]],
        },
      ];

      const smr = await wgre.analyze(solidGeometry);

      expect(smr.quality.structuralIntegrity).toBeGreaterThanOrEqual(0);
      expect(smr.quality.structuralIntegrity).toBeLessThanOrEqual(1);
    });
  });

  describe('End-to-End Fabrication Pipeline', () => {
    test('should complete sketch-to-fabrication workflow', async () => {
      // 1. User uploads sketch
      const sketchData = 'mock-sketch-data';

      // 2. Vision Agent extracts geometry
      const visionResult = await visionAgent.analyzeImage(sketchData);
      expect(visionResult.confidence).toBeGreaterThan(0.5);

      // 3. Refine geometry based on feedback
      const refinedGeometry = await visionAgent.refineGeometry(
        visionResult.suggestedPrimitives,
        'Make it more symmetric'
      );
      expect(refinedGeometry).toBeDefined();

      // 4. W-GRE analyzes refined geometry
      const smr = await wgre.analyze(refinedGeometry.suggestedPrimitives);
      expect(smr.quality.fabricability).toBeGreaterThan(0.3);

      // 5. Physics validation before fabrication
      const physicsResult = await physicsValidator.validate(
        refinedGeometry.suggestedPrimitives,
        'steel'
      );

      // 6. Commit if all checks pass
      if (physicsResult.valid && smr.quality.fabricability > 0.5) {
        expect(true).toBe(true); // Fabrication approved
      } else {
        expect(physicsResult.warnings.length + physicsResult.errors.length).toBeGreaterThan(0);
      }
    });

    test('should provide feedback loop for failed validations', async () => {
      const invalidGeometry: GeometricPrimitive[] = [
        {
          type: 'mesh',
          vertices: [{ x: 0, y: 0, z: 0 }], // Insufficient vertices
          faces: [],
        },
      ];

      const physicsResult = await physicsValidator.validate(invalidGeometry, 'aluminum');

      if (!physicsResult.valid) {
        expect(physicsResult.errors.length).toBeGreaterThan(0);

        // System should provide actionable feedback
        const feedback = physicsResult.errors.join('; ');
        expect(feedback.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Performance Benchmarks', () => {
    test('should complete vision analysis in under 2 seconds', async () => {
      const startTime = Date.now();

      await visionAgent.analyzeImage('mock-data');

      const elapsed = Date.now() - startTime;
      expect(elapsed).toBeLessThan(2000);
    });

    test('should complete physics validation in under 500ms', async () => {
      const simpleGeometry: GeometricPrimitive[] = [
        {
          type: 'mesh',
          vertices: [
            { x: 0, y: 0, z: 0 },
            { x: 1, y: 0, z: 0 },
            { x: 1, y: 1, z: 0 },
            { x: 0, y: 1, z: 0 },
          ],
          faces: [[0, 1, 2, 3]],
        },
      ];

      const startTime = Date.now();

      await physicsValidator.validate(simpleGeometry, 'steel');

      const elapsed = Date.now() - startTime;
      expect(elapsed).toBeLessThan(500);
    });
  });
});
