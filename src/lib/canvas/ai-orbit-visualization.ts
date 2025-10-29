// CLAUDE-META: AGI-CAD AI Nexus - AI Orbit Visualization
// Architect: Claude Code (Sonnet 4.5)
// Purpose: Visualize AI routing and cost metrics on canvas
// Status: Production - Phase 11 AI Nexus

import * as THREE from 'three';
import { AIProvider, AIRoutingResult } from '../ai/nexus/ai-router';

/**
 * AI Orbit Node (represents an AI provider)
 */
export interface AIOrbitNode {
  provider: AIProvider;
  position: THREE.Vector3;
  mesh: THREE.Mesh;
  label: THREE.Sprite;
  active: boolean;
  pulsePhase: number;
}

/**
 * AI Orbit Visualization Configuration
 */
export interface AIOrbitConfig {
  orbitRadius: number;
  nodeSize: number;
  animationSpeed: number;
  showLabels: boolean;
  showConnections: boolean;
  highlightActive: boolean;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: AIOrbitConfig = {
  orbitRadius: 5,
  nodeSize: 0.3,
  animationSpeed: 1.0,
  showLabels: true,
  showConnections: true,
  highlightActive: true,
};

/**
 * AI Orbit Visualization
 * Displays AI providers in orbit around a central point with active connections
 */
export class AIOrbitVisualization {
  private scene: THREE.Scene;
  private config: AIOrbitConfig;
  private nodes: Map<string, AIOrbitNode> = new Map();
  private connections: THREE.Line[] = [];
  private centerMesh: THREE.Mesh;
  private routingResults: AIRoutingResult[] = [];

  constructor(scene: THREE.Scene, config: Partial<AIOrbitConfig> = {}) {
    this.scene = scene;
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Create center node (represents AGI-CAD system)
    this.centerMesh = this.createCenterNode();
    this.scene.add(this.centerMesh);
  }

  /**
   * Create center node mesh
   */
  private createCenterNode(): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(0.5, 32, 32);
    const material = new THREE.MeshStandardMaterial({
      color: 0xffa500, // Orange
      emissive: 0xffa500,
      emissiveIntensity: 0.5,
      metalness: 0.8,
      roughness: 0.2,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, 0, 0);

    return mesh;
  }

  /**
   * Add AI provider to visualization
   */
  addProvider(provider: AIProvider, angle: number): void {
    // Calculate position on orbit
    const x = Math.cos(angle) * this.config.orbitRadius;
    const z = Math.sin(angle) * this.config.orbitRadius;
    const position = new THREE.Vector3(x, 0, z);

    // Create node mesh
    const geometry = new THREE.SphereGeometry(this.config.nodeSize, 16, 16);
    const color = provider.tier === 'free' ? 0x00ff00 : 0xff0000; // Green for free, red for paid

    const material = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.3,
      metalness: 0.5,
      roughness: 0.5,
      transparent: true,
      opacity: provider.available ? 1.0 : 0.3,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    this.scene.add(mesh);

    // Create label
    const label = this.createLabel(provider.name, position);
    if (this.config.showLabels) {
      this.scene.add(label);
    }

    // Store node
    const node: AIOrbitNode = {
      provider,
      position,
      mesh,
      label,
      active: false,
      pulsePhase: 0,
    };

    this.nodes.set(provider.id, node);
  }

  /**
   * Create text label for provider
   */
  private createLabel(text: string, position: THREE.Vector3): THREE.Sprite {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.width = 256;
    canvas.height = 64;

    context.fillStyle = '#ffffff';
    context.font = 'bold 24px Arial';
    context.textAlign = 'center';
    context.fillText(text, 128, 40);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(material);

    sprite.position.set(position.x, position.y + 0.8, position.z);
    sprite.scale.set(2, 0.5, 1);

    return sprite;
  }

  /**
   * Update visualization with routing result
   */
  updateWithRoutingResult(result: AIRoutingResult): void {
    this.routingResults.push(result);

    // Keep last 10 results
    if (this.routingResults.length > 10) {
      this.routingResults.shift();
    }

    // Clear previous connections
    this.clearConnections();

    // Deactivate all nodes
    for (const node of this.nodes.values()) {
      node.active = false;
    }

    // Activate nodes used in routing
    const providersUsed = result.metrics.providersUsed;

    for (const providerName of providersUsed) {
      const node = Array.from(this.nodes.values()).find(
        n => n.provider.name === providerName
      );

      if (node) {
        node.active = true;
        this.createConnection(this.centerMesh.position, node.position, result.strategy);
      }
    }
  }

  /**
   * Create connection line between nodes
   */
  private createConnection(
    from: THREE.Vector3,
    to: THREE.Vector3,
    strategy: 'free' | 'hybrid' | 'paid'
  ): void {
    const points = [from, to];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);

    // Color based on strategy
    let color: number;
    switch (strategy) {
      case 'free':
        color = 0x00ff00; // Green
        break;
      case 'hybrid':
        color = 0xffff00; // Yellow
        break;
      case 'paid':
        color = 0xff0000; // Red
        break;
    }

    const material = new THREE.LineBasicMaterial({
      color,
      linewidth: 2,
      transparent: true,
      opacity: 0.6,
    });

    const line = new THREE.Line(geometry, material);
    this.scene.add(line);
    this.connections.push(line);
  }

  /**
   * Clear all connections
   */
  private clearConnections(): void {
    for (const line of this.connections) {
      this.scene.remove(line);
      line.geometry.dispose();
      (line.material as THREE.Material).dispose();
    }
    this.connections = [];
  }

  /**
   * Animate visualization (call in render loop)
   */
  animate(deltaTime: number): void {
    // Pulse center node
    const pulse = Math.sin(Date.now() * 0.001) * 0.1 + 1.0;
    this.centerMesh.scale.set(pulse, pulse, pulse);

    // Animate active nodes
    for (const node of this.nodes.values()) {
      if (node.active && this.config.highlightActive) {
        node.pulsePhase += deltaTime * this.config.animationSpeed;
        const scale = Math.sin(node.pulsePhase) * 0.2 + 1.2;
        node.mesh.scale.set(scale, scale, scale);

        // Increase emissive intensity
        const material = node.mesh.material as THREE.MeshStandardMaterial;
        material.emissiveIntensity = 0.5 + Math.sin(node.pulsePhase) * 0.3;
      } else {
        node.mesh.scale.set(1, 1, 1);
        const material = node.mesh.material as THREE.MeshStandardMaterial;
        material.emissiveIntensity = 0.3;
      }
    }

    // Rotate labels to face camera (if camera is provided)
    // Note: This would need camera reference - skip for now
  }

  /**
   * Get cost savings display data
   */
  getCostMetrics(): {
    totalCost: number;
    totalSavings: number;
    avgCost: number;
    executionCount: number;
  } {
    const totalCost = this.routingResults.reduce((sum, r) => sum + r.metrics.totalCost, 0);
    const totalSavings = this.routingResults.reduce((sum, r) => sum + r.metrics.costSavings, 0);
    const executionCount = this.routingResults.length;

    return {
      totalCost,
      totalSavings,
      avgCost: executionCount > 0 ? totalCost / executionCount : 0,
      executionCount,
    };
  }

  /**
   * Remove provider from visualization
   */
  removeProvider(providerId: string): void {
    const node = this.nodes.get(providerId);
    if (node) {
      this.scene.remove(node.mesh);
      this.scene.remove(node.label);
      node.mesh.geometry.dispose();
      (node.mesh.material as THREE.Material).dispose();
      node.label.material.map?.dispose();
      node.label.material.dispose();

      this.nodes.delete(providerId);
    }
  }

  /**
   * Clear all visualization
   */
  clear(): void {
    this.clearConnections();

    for (const node of this.nodes.values()) {
      this.scene.remove(node.mesh);
      this.scene.remove(node.label);
      node.mesh.geometry.dispose();
      (node.mesh.material as THREE.Material).dispose();
      node.label.material.map?.dispose();
      node.label.material.dispose();
    }

    this.nodes.clear();
    this.scene.remove(this.centerMesh);
    this.centerMesh.geometry.dispose();
    (this.centerMesh.material as THREE.Material).dispose();
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<AIOrbitConfig>): void {
    this.config = { ...this.config, ...config };

    // Apply configuration changes
    if (config.showLabels !== undefined) {
      for (const node of this.nodes.values()) {
        node.label.visible = config.showLabels;
      }
    }

    if (config.showConnections !== undefined && !config.showConnections) {
      this.clearConnections();
    }
  }

  /**
   * Get node for provider
   */
  getNode(providerId: string): AIOrbitNode | undefined {
    return this.nodes.get(providerId);
  }

  /**
   * Get all nodes
   */
  getAllNodes(): AIOrbitNode[] {
    return Array.from(this.nodes.values());
  }
}

/**
 * Helper: Initialize AI orbit visualization with all providers
 */
export function initializeAIOrbitVisualization(
  scene: THREE.Scene,
  providers: AIProvider[],
  config?: Partial<AIOrbitConfig>
): AIOrbitVisualization {
  const visualization = new AIOrbitVisualization(scene, config);

  // Add providers in orbit
  const angleStep = (Math.PI * 2) / providers.length;

  providers.forEach((provider, index) => {
    const angle = angleStep * index;
    visualization.addProvider(provider, angle);
  });

  return visualization;
}

export default AIOrbitVisualization;
