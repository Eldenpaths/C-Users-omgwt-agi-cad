// src/lib/nexus/layouts/flowchart.ts
// Phase 17C: Flowchart Layout (Missing Mode #2 from Gemini Review)
// For: Science Lab experiments, state machines, sequential workflows

import { LayoutStrategy, NexusNode, NodePosition } from '../types';

/**
 * Flowchart Layout: Visualizes sequential processes and state machines.
 * 
 * Use Cases:
 * - Science Labs: Step-by-step experiments (heat → test → analyze → record)
 * - Agent Workflows: PTAC instruction sequences
 * - Manufacturing: Assembly line stages
 * - State Machines: Agent decision trees
 * 
 * Features:
 * - Topological sort (dependencies determine order)
 * - Automatic rank assignment (steps flow top-to-bottom or left-to-right)
 * - Current state highlighting
 * - Branch visualization (parallel paths)
 */

export interface FlowchartMetadata {
  // Dependencies (which nodes must complete before this one)
  dependencies?: string[]; // Array of node IDs
  
  // Execution state
  state?: 'pending' | 'active' | 'completed' | 'failed' | 'skipped';
  
  // Step number (optional manual override)
  stepNumber?: number;
  
  // Branch/lane assignment (for parallel flows)
  lane?: string;
  
  // Timing information
  startTime?: number;
  endTime?: number;
  estimatedDuration?: number;
}

interface FlowchartRank {
  rank: number; // Vertical position (step in sequence)
  lane: number; // Horizontal position (branch/parallel track)
}

export class FlowchartLayout implements LayoutStrategy {
  private config: {
    // Layout direction
    direction: 'vertical' | 'horizontal';
    
    // Spacing between nodes
    rankSpacing: number; // Distance between sequential steps
    laneSpacing: number; // Distance between parallel branches
    
    // Starting position
    origin: [number, number, number];
    
    // Highlight current step
    highlightActive: boolean;
  };
  
  constructor(config?: Partial<FlowchartLayout['config']>) {
    this.config = {
      direction: 'vertical',
      rankSpacing: 200,
      laneSpacing: 150,
      origin: [0, 0, 0],
      highlightActive: true,
      ...config
    };
  }
  
  layout(nodes: NexusNode[]): NodePosition[] {
    // Step 1: Build dependency graph
    const graph = this.buildDependencyGraph(nodes);
    
    // Step 2: Topological sort to get rank (execution order)
    const ranks = this.topologicalSort(graph);
    
    // Step 3: Assign lanes (horizontal position for parallel branches)
    const lanes = this.assignLanes(nodes, ranks);
    
    // Step 4: Position nodes based on rank and lane
    const positions: NodePosition[] = [];
    
    for (const node of nodes) {
      const metadata = node.metadata as FlowchartMetadata;
      const rank = ranks.get(node.id) || 0;
      const lane = lanes.get(node.id) || 0;
      
      // Calculate position based on direction
      let [x, y, z] = this.config.origin;
      
      if (this.config.direction === 'vertical') {
        // Top-to-bottom flow
        x += lane * this.config.laneSpacing;
        y -= rank * this.config.rankSpacing;
      } else {
        // Left-to-right flow
        x += rank * this.config.rankSpacing;
        y += lane * this.config.laneSpacing;
      }
      
      // Scale based on state (highlight active nodes)
      let scale: [number, number, number] = [1, 1, 1];
      if (this.config.highlightActive && metadata.state === 'active') {
        scale = [1.3, 1.3, 1.3];
      }
      
      positions.push({
        nodeId: node.id,
        position: [x, y, z],
        rotation: [0, 0, 0],
        scale
      });
    }
    
    return positions;
  }
  
  /**
   * Build adjacency list from dependencies.
   */
  private buildDependencyGraph(nodes: NexusNode[]): Map<string, string[]> {
    const graph = new Map<string, string[]>();
    
    for (const node of nodes) {
      const metadata = node.metadata as FlowchartMetadata;
      const deps = metadata.dependencies || [];
      
      if (!graph.has(node.id)) {
        graph.set(node.id, []);
      }
      
      // Add edges: dependency → dependent
      for (const depId of deps) {
        if (!graph.has(depId)) {
          graph.set(depId, []);
        }
        graph.get(depId)!.push(node.id);
      }
    }
    
    return graph;
  }
  
  /**
   * Topological sort using Kahn's algorithm.
   * Returns rank (level in hierarchy) for each node.
   */
  private topologicalSort(graph: Map<string, string[]>): Map<string, number> {
    const ranks = new Map<string, number>();
    const inDegree = new Map<string, number>();
    
    // Calculate in-degrees (how many dependencies each node has)
    Array.from(graph.keys()).forEach((nodeId) => {
      inDegree.set(nodeId, 0);
    });

    Array.from(graph.entries()).forEach(([_, dependents]) => {
      for (const dependent of dependents) {
        inDegree.set(dependent, (inDegree.get(dependent) || 0) + 1);
      }
    });

    // Queue nodes with no dependencies (rank 0)
    const queue: string[] = [];
    Array.from(inDegree.entries()).forEach(([nodeId, degree]) => {
      if (degree === 0) {
        queue.push(nodeId);
        ranks.set(nodeId, 0);
      }
    });
    
    // Process queue, assigning ranks
    while (queue.length > 0) {
      const current = queue.shift()!;
      const currentRank = ranks.get(current)!;
      
      const dependents = graph.get(current) || [];
      for (const dependent of dependents) {
        // Decrease in-degree
        const newDegree = (inDegree.get(dependent) || 0) - 1;
        inDegree.set(dependent, newDegree);
        
        // Update rank (max of all dependency ranks + 1)
        const newRank = currentRank + 1;
        ranks.set(dependent, Math.max(ranks.get(dependent) || 0, newRank));
        
        // If all dependencies satisfied, add to queue
        if (newDegree === 0) {
          queue.push(dependent);
        }
      }
    }
    
    return ranks;
  }
  
  /**
   * Assign horizontal lanes for parallel branches.
   * Nodes at same rank with no shared dependencies get different lanes.
   */
  private assignLanes(nodes: NexusNode[], ranks: Map<string, number>): Map<string, number> {
    const lanes = new Map<string, number>();
    
    // Group nodes by rank
    const rankGroups = new Map<number, string[]>();
    Array.from(ranks.entries()).forEach(([nodeId, rank]) => {
      if (!rankGroups.has(rank)) {
        rankGroups.set(rank, []);
      }
      rankGroups.get(rank)!.push(nodeId);
    });

    // Assign lanes within each rank
    Array.from(rankGroups.entries()).forEach(([rank, nodeIds]) => {
      // Check for manual lane assignment
      const manualLanes = new Map<string, number>();
      for (const nodeId of nodeIds) {
        const node = nodes.find(n => n.id === nodeId);
        const metadata = node?.metadata as FlowchartMetadata;
        if (metadata.lane !== undefined) {
          const laneNum = parseInt(metadata.lane);
          if (!isNaN(laneNum)) {
            manualLanes.set(nodeId, laneNum);
          }
        }
      }
      
      // Auto-assign remaining nodes
      let nextLane = 0;
      const usedLanes = new Set(manualLanes.values());
      
      for (const nodeId of nodeIds) {
        if (manualLanes.has(nodeId)) {
          lanes.set(nodeId, manualLanes.get(nodeId)!);
        } else {
          // Find next available lane
          while (usedLanes.has(nextLane)) {
            nextLane++;
          }
          lanes.set(nodeId, nextLane);
          usedLanes.add(nextLane);
          nextLane++;
        }
      }
    });

    return lanes;
  }
  
  /**
   * Helper: Create flowchart node with dependencies.
   */
  static createFlowNode(
    id: string,
    label: string,
    options?: {
      dependencies?: string[];
      state?: FlowchartMetadata['state'];
      lane?: string;
      stepNumber?: number;
    }
  ): Partial<NexusNode> {
    return {
      id,
      label,
      type: 'flow_step',
      metadata: {
        dependencies: options?.dependencies || [],
        state: options?.state || 'pending',
        lane: options?.lane,
        stepNumber: options?.stepNumber
      } as FlowchartMetadata
    };
  }
}

/**
 * Usage Examples:
 * 
 * EXAMPLE 1: Plasma Lab Experiment Sequence
 * ```typescript
 * const labLayout = new FlowchartLayout({
 *   direction: 'vertical',
 *   rankSpacing: 150,
 *   highlightActive: true
 * });
 * 
 * const steps = [
 *   FlowchartLayout.createFlowNode('prepare', 'Prepare Sample', {
 *     state: 'completed'
 *   }),
 *   FlowchartLayout.createFlowNode('heat', 'Heat to 1000°C', {
 *     dependencies: ['prepare'],
 *     state: 'completed'
 *   }),
 *   FlowchartLayout.createFlowNode('ionize', 'Ionize Gas', {
 *     dependencies: ['heat'],
 *     state: 'active' // Currently executing
 *   }),
 *   FlowchartLayout.createFlowNode('measure', 'Measure Output', {
 *     dependencies: ['ionize'],
 *     state: 'pending'
 *   }),
 *   FlowchartLayout.createFlowNode('analyze', 'Analyze Results', {
 *     dependencies: ['measure'],
 *     state: 'pending'
 *   })
 * ];
 * 
 * const positions = labLayout.layout(steps);
 * ```
 * 
 * EXAMPLE 2: Parallel Experiment Branches
 * ```typescript
 * const parallelLayout = new FlowchartLayout({
 *   direction: 'horizontal',
 *   laneSpacing: 200
 * });
 * 
 * const workflow = [
 *   FlowchartLayout.createFlowNode('start', 'Start Experiment'),
 *   
 *   // Branch A
 *   FlowchartLayout.createFlowNode('test_a', 'Test Sample A', {
 *     dependencies: ['start'],
 *     lane: '0' // Top lane
 *   }),
 *   FlowchartLayout.createFlowNode('analyze_a', 'Analyze A', {
 *     dependencies: ['test_a'],
 *     lane: '0'
 *   }),
 *   
 *   // Branch B
 *   FlowchartLayout.createFlowNode('test_b', 'Test Sample B', {
 *     dependencies: ['start'],
 *     lane: '1' // Bottom lane
 *   }),
 *   FlowchartLayout.createFlowNode('analyze_b', 'Analyze B', {
 *     dependencies: ['test_b'],
 *     lane: '1'
 *   }),
 *   
 *   // Merge
 *   FlowchartLayout.createFlowNode('compare', 'Compare Results', {
 *     dependencies: ['analyze_a', 'analyze_b'] // Wait for both
 *   })
 * ];
 * ```
 * 
 * EXAMPLE 3: PTAC Agent Instruction Flow
 * ```typescript
 * const agentFlow = new FlowchartLayout({
 *   direction: 'vertical',
 *   rankSpacing: 100
 * });
 * 
 * const ptacSteps = [
 *   FlowchartLayout.createFlowNode('fetch_data', 'Fetch User Query'),
 *   FlowchartLayout.createFlowNode('parse', 'Parse Intent', {
 *     dependencies: ['fetch_data']
 *   }),
 *   FlowchartLayout.createFlowNode('search_kb', 'Search Knowledge Base', {
 *     dependencies: ['parse']
 *   }),
 *   FlowchartLayout.createFlowNode('generate', 'Generate Response', {
 *     dependencies: ['search_kb']
 *   }),
 *   FlowchartLayout.createFlowNode('validate', 'Validate Output', {
 *     dependencies: ['generate']
 *   }),
 *   FlowchartLayout.createFlowNode('send', 'Send to User', {
 *     dependencies: ['validate']
 *   })
 * ];
 * ```
 */

export default FlowchartLayout;
