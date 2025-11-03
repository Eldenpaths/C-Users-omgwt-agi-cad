/**
 * Lab Router
 * Central orchestration system for managing multiple Science Labs
 * Provides unified API for agent commands and state queries
 */

export interface LabSimulator {
  command(action: string, params: any): void;
  getVisualizationData(): any;
  init?(temperature: number, pressure: number): void;
  step?(deltaTime: number): any;
}

export interface CommandResult {
  success: boolean;
  labId: string;
  command: string;
  data?: any;
  error?: string;
  timestamp: number;
}

export class LabRouter {
  private labs: Map<string, LabSimulator> = new Map();
  private commandHistory: CommandResult[] = [];
  private maxHistorySize: number = 100;

  /**
   * Register a lab simulator with the router
   */
  registerLab(id: string, simulator: LabSimulator): void {
    if (this.labs.has(id)) {
      console.warn(`Lab ${id} is already registered. Overwriting...`);
    }
    this.labs.set(id, simulator);
    console.log(`Lab registered: ${id}`);
  }

  /**
   * Unregister a lab simulator
   */
  unregisterLab(id: string): boolean {
    const removed = this.labs.delete(id);
    if (removed) {
      console.log(`Lab unregistered: ${id}`);
    }
    return removed;
  }

  /**
   * Execute a command on a specific lab (async version for API)
   */
  async executeCommandAsync(labId: string, command: string, params: any = {}): Promise<CommandResult> {
    const result = this.executeCommand(labId, command, params);

    // Wait a bit for state to update
    await new Promise(resolve => setTimeout(resolve, 100));

    return result;
  }

  /**
   * Execute a command on a specific lab (sync version)
   */
  executeCommand(labId: string, command: string, params: any = {}): CommandResult {
    const lab = this.labs.get(labId);

    if (!lab) {
      const error = `Lab ${labId} not found. Available labs: ${Array.from(this.labs.keys()).join(', ')}`;
      console.error(error);

      const result: CommandResult = {
        success: false,
        labId,
        command,
        error,
        timestamp: Date.now(),
      };

      this.addToHistory(result);
      return result;
    }

    try {
      lab.command(command, params);

      const result: CommandResult = {
        success: true,
        labId,
        command,
        data: { params },
        timestamp: Date.now(),
      };

      this.addToHistory(result);
      console.log(`Command executed: ${labId}.${command}`, params);

      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);

      const result: CommandResult = {
        success: false,
        labId,
        command,
        error: errorMsg,
        timestamp: Date.now(),
      };

      this.addToHistory(result);
      console.error(`Command failed: ${labId}.${command}`, error);

      return result;
    }
  }

  /**
   * Get the current state of a lab (async version for API)
   */
  async getLabStateAsync(labId: string): Promise<any> {
    return this.getLabState(labId);
  }

  /**
   * Get the current state of a lab (sync version)
   */
  getLabState(labId: string): any {
    const lab = this.labs.get(labId);

    if (!lab) {
      throw new Error(`Lab ${labId} not found. Available labs: ${Array.from(this.labs.keys()).join(', ')}`);
    }

    try {
      return lab.getVisualizationData();
    } catch (error) {
      console.error(`Failed to get state for lab ${labId}:`, error);
      throw error;
    }
  }

  /**
   * Get all lab states (async)
   */
  async getAllLabStates(): Promise<Record<string, any>> {
    const states: Record<string, any> = {};

    for (const [id, lab] of this.labs.entries()) {
      try {
        states[id] = lab.getVisualizationData();
      } catch (error) {
        states[id] = { error: String(error) };
      }
    }

    return states;
  }

  /**
   * Get all registered lab IDs
   */
  getRegisteredLabs(): string[] {
    return Array.from(this.labs.keys());
  }

  /**
   * Check if a lab is registered
   */
  isLabRegistered(labId: string): boolean {
    return this.labs.has(labId);
  }

  /**
   * Get command history
   */
  getCommandHistory(limit?: number): CommandResult[] {
    if (limit) {
      return this.commandHistory.slice(-limit);
    }
    return [...this.commandHistory];
  }

  /**
   * Clear command history
   */
  clearHistory(): void {
    this.commandHistory = [];
  }

  /**
   * Execute command on multiple labs (broadcast)
   */
  broadcastCommand(command: string, params: any = {}): CommandResult[] {
    const results: CommandResult[] = [];

    for (const labId of this.labs.keys()) {
      const result = this.executeCommand(labId, command, params);
      results.push(result);
    }

    return results;
  }

  /**
   * Get aggregated stats from all labs
   */
  getAggregatedStats(): any {
    const stats: any = {
      totalLabs: this.labs.size,
      labStates: {},
      timestamp: Date.now(),
    };

    for (const [labId, lab] of this.labs) {
      try {
        stats.labStates[labId] = lab.getVisualizationData();
      } catch (error) {
        stats.labStates[labId] = { error: String(error) };
      }
    }

    return stats;
  }

  /**
   * Add command result to history
   */
  private addToHistory(result: CommandResult): void {
    this.commandHistory.push(result);

    // Trim history if it exceeds max size
    if (this.commandHistory.length > this.maxHistorySize) {
      this.commandHistory = this.commandHistory.slice(-this.maxHistorySize);
    }
  }
}

// Singleton instance
export const labRouter = new LabRouter();

/**
 * Helper function for agent commands
 */
export function sendLabCommand(labId: string, command: string, params?: any): CommandResult {
  return labRouter.executeCommand(labId, command, params);
}

/**
 * Helper function to get lab state
 */
export function getLabData(labId: string): any {
  return labRouter.getLabState(labId);
}
