// ai/agi_dev_agent.ts
// Autonomous development agent for AGI-CAD (Local Mode - No Firebase)

import { Anthropic } from '@anthropic-ai/sdk';
import { Octokit } from '@octokit/rest';
import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';

interface Task {
  id: string;
  description: string;
  spec?: string;
  status?: 'pending' | 'in_progress' | 'review' | 'complete';
  files: string[];
  dependencies?: string[];
  branch?: string;
  pr?: string;
}

interface AgentState {
  sessionId: string;
  phase: string;
  currentTask?: Task;
  completedTasks: string[];
  heartbeat: {
    lastPing: number;
    status: 'active' | 'idle' | 'error';
    currentFile?: string;
  };
}

/**
 * Local-only autonomous agent
 * Disables Firebase telemetry, safe for offline use
 */
export class AGIDevAgent {
  private anthropic: Anthropic;
  private github: Octokit;
  private state: AgentState;
  private repoPath: string;

  constructor(
    anthropicKey: string = 'none',
    githubToken: string = 'none',
    repoPath: string = process.cwd()
  ) {
    this.anthropic = new Anthropic({ apiKey: anthropicKey });
    this.github = new Octokit({ auth: githubToken });
    this.repoPath = repoPath;

    this.state = {
      sessionId: `dev-session-${Date.now()}`,
      phase: 'phase-8',
      completedTasks: [],
      heartbeat: {
        lastPing: Date.now(),
        status: 'idle',
      },
    };

    console.log(`🔧 Initialized AGI Dev Agent in local mode`);
    this.startHeartbeat();
  }

  async startSprint(sprintConfig: {
    goal: string;
    tasks: Task[];
    checkpoints?: any[];
  }) {
    console.log(`🚀 Starting sprint: ${sprintConfig.goal}`);
    console.log(`📋 Total tasks: ${sprintConfig.tasks.length}`);

    for (const task of sprintConfig.tasks) {
      await this.executeTask(task);
    }

    console.log('✅ Sprint complete!');
  }

  async executeTask(task: Task) {
    console.log(`\n📝 Task: ${task.description}`);
    this.state.currentTask = task;
    this.updateHeartbeat('in_progress', task.files[0]);

    try {
      const context = await this.gatherContext(task);
      console.log('📄 Context loaded');

      const branch = `ai/task-${task.id}`;
      this.gitCheckout(branch);
      console.log(`🌿 Created branch ${branch}`);

      for (const file of task.files) {
        const filePath = path.join(this.repoPath, file);
        const dir = path.dirname(filePath);
        if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

        if (!existsSync(filePath)) {
          writeFileSync(filePath, `# Placeholder for ${file}\n`);
          console.log(`  ✨ Created ${file}`);
        } else {
          console.log(`  ⚙️ Found existing file: ${file}`);
        }
      }

      this.gitCommit(`Auto scaffold: ${task.description}`);
      this.state.completedTasks.push(task.id);
      this.updateHeartbeat('idle');
    } catch (err) {
      console.error(`❌ Task failed: ${err}`);
      this.updateHeartbeat('error');
    }
  }

  async gatherContext(task: Task): Promise<string> {
    const parts: string[] = [];
    if (task.spec && existsSync(task.spec)) {
      parts.push(`Spec: ${readFileSync(task.spec, 'utf-8')}`);
    }
    return parts.join('\n');
  }

  gitCheckout(branch: string) {
    try {
      execSync(`git checkout -b ${branch}`, { cwd: this.repoPath });
    } catch {
      console.log(`⚠️ Branch ${branch} may already exist`);
    }
  }

  gitCommit(message: string) {
    try {
      execSync('git add .', { cwd: this.repoPath });
      execSync(`git commit -m "${message}"`, { cwd: this.repoPath });
      console.log(`💾 Committed: ${message}`);
    } catch {
      console.log(`⚠️ Skipped commit (no changes or git not set up)`);
    }
  }

  startHeartbeat() {
    setInterval(() => {
      this.state.heartbeat.lastPing = Date.now();
      console.log(
        `💓 Heartbeat: ${this.state.heartbeat.status} | Tasks complete: ${this.state.completedTasks.length}`
      );
    }, 5000);
  }

  updateHeartbeat(status: AgentState['heartbeat']['status'], file?: string) {
    this.state.heartbeat.status = status;
    this.state.heartbeat.currentFile = file;
  }
}

// CLI entrypoint
if (require.main === module) {
  try {
    const configPath = path.join(process.cwd(), '.agi-cad', 'sprint-config.json');
    const config = JSON.parse(readFileSync(configPath, 'utf-8'));
    const agent = new AGIDevAgent();
    agent.startSprint(config);
  } catch (err) {
    console.error('Error:', err);
  }
}
