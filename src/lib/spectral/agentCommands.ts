// src/lib/spectral/agentCommands.ts

export interface AgentCommand {
  command: string;
  args: any[];
}

// Minimal simulator shape to satisfy type checker.
// The concrete implementation is defined elsewhere in the app at runtime.
export interface SpectralSimulator {
  spectralData: Array<{ element: string; intensity: number }>;
  generateSpectralData: () => Array<{ element: string; intensity: number }>;
}

class SpectralAgent {
  public spectralSimulator: SpectralSimulator;

  constructor(simulator: SpectralSimulator) {
    this.spectralSimulator = simulator;
  }

  handleCommand(command: AgentCommand) {
    switch (command.command) {
      case "adjustIntensity":
        this.adjustIntensity(command.args[0], command.args[1]);
        break;
      case "resetSimulation":
        this.resetSimulation();
        break;
      default:
        console.warn("Unknown command");
    }
  }

  adjustIntensity(element: string, intensity: number) {
    this.spectralSimulator.spectralData.forEach((line) => {
      if (line.element === element) {
        line.intensity = intensity;
      }
    });
  }

  resetSimulation() {
    this.spectralSimulator.spectralData = this.spectralSimulator.generateSpectralData();
  }
}

export default SpectralAgent;
