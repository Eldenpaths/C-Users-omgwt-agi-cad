// CLAUDE-META: Phase 10 Leapfrog - Firestore Graph Utilities
// Architect: ChatGPT (GPT-5) Canonical Authority
// Purpose: Graph algorithms for agent relationships
// Status: Production - Hybrid Safe Mode Active

export type GraphNode = {
  id: string;
  data: any;
  edges: string[];
};

/**
 * Firestore Graph Utilities
 * Graph algorithms for analyzing agent relationships
 */
export class FirestoreGraph {
  private nodes = new Map<string, GraphNode>();

  /**
   * Add node
   */
  addNode(id: string, data: any): void {
    if (!this.nodes.has(id)) {
      this.nodes.set(id, { id, data, edges: [] });
    }
  }

  /**
   * Add edge
   */
  addEdge(from: string, to: string): void {
    const node = this.nodes.get(from);
    if (node && !node.edges.includes(to)) {
      node.edges.push(to);
    }
  }

  /**
   * Find shortest path (BFS)
   */
  shortestPath(start: string, end: string): string[] | null {
    if (!this.nodes.has(start) || !this.nodes.has(end)) return null;

    const queue: string[] = [start];
    const visited = new Set<string>([start]);
    const parent = new Map<string, string>();

    while (queue.length > 0) {
      const current = queue.shift()!;

      if (current === end) {
        // Reconstruct path
        const path: string[] = [];
        let node: string | undefined = end;
        while (node) {
          path.unshift(node);
          node = parent.get(node);
        }
        return path;
      }

      const edges = this.nodes.get(current)?.edges || [];
      for (const neighbor of edges) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          parent.set(neighbor, current);
          queue.push(neighbor);
        }
      }
    }

    return null;
  }

  /**
   * Get all descendants
   */
  getDescendants(nodeId: string): string[] {
    const descendants: string[] = [];
    const visited = new Set<string>();

    const dfs = (id: string) => {
      if (visited.has(id)) return;
      visited.add(id);

      const node = this.nodes.get(id);
      if (node) {
        for (const child of node.edges) {
          descendants.push(child);
          dfs(child);
        }
      }
    };

    dfs(nodeId);
    return descendants;
  }
}
