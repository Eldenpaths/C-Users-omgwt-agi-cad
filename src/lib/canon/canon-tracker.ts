/**
 * Canon Tracking System
 * Tracks all significant decisions, principles, constraints, and patterns
 * during build and usage of AGI-CAD
 */

import { firestoreClient } from '@/lib/firestore/client';

export type CanonType = 'decision' | 'principle' | 'constraint' | 'pattern';
export type CanonStatus = 'exploring' | 'pinned' | 'locked' | 'deviated';

export interface CanonEntry {
  id: string;
  type: CanonType;
  status: CanonStatus;
  title: string;
  description: string;
  reason?: string;
  timestamp: Date;
  author: 'system' | 'user' | 'agent';
  relatedExperiments: string[];
  confidence: number; // 0-100
  votes?: {
    up: number;
    down: number;
  };
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface CanonFilters {
  type?: CanonType;
  status?: CanonStatus;
  author?: 'system' | 'user' | 'agent';
  tags?: string[];
  minConfidence?: number;
}

class CanonTracker {
  private entries: Map<string, CanonEntry> = new Map();
  private initialized = false;

  /**
   * Initialize the canon tracker
   */
  async initialize(userId?: string): Promise<void> {
    if (this.initialized) return;

    // Load existing canon entries from Firestore (if userId provided)
    if (userId) {
      try {
        const entries = await this.loadFromFirestore(userId);
        entries.forEach((entry) => {
          this.entries.set(entry.id, entry);
        });
      } catch (error) {
        console.warn('Failed to load canon from Firestore:', error);
      }
    }

    // Load initial system canon
    this.loadInitialCanon();

    this.initialized = true;
  }

  /**
   * Create a new canon entry
   */
  async createEntry(data: Omit<CanonEntry, 'id' | 'timestamp'>, userId?: string): Promise<CanonEntry> {
    const entry: CanonEntry = {
      ...data,
      id: this.generateId(),
      timestamp: new Date(),
    };

    this.entries.set(entry.id, entry);

    // Save to Firestore if userId provided
    if (userId) {
      try {
        await this.saveToFirestore(userId, entry);
      } catch (error) {
        console.error('Failed to save canon to Firestore:', error);
      }
    }

    return entry;
  }

  /**
   * Pin an entry (exploring → pinned)
   */
  async pinEntry(id: string, userId?: string): Promise<CanonEntry | null> {
    const entry = this.entries.get(id);
    if (!entry) return null;

    if (entry.status === 'exploring') {
      entry.status = 'pinned';
      this.entries.set(id, entry);

      if (userId) {
        await this.saveToFirestore(userId, entry);
      }
    }

    return entry;
  }

  /**
   * Lock an entry as canonical (pinned → locked)
   */
  async lockEntry(id: string, userId?: string): Promise<CanonEntry | null> {
    const entry = this.entries.get(id);
    if (!entry) return null;

    if (entry.status === 'pinned') {
      entry.status = 'locked';
      entry.confidence = 100; // Locked = 100% confidence
      this.entries.set(id, entry);

      if (userId) {
        await this.saveToFirestore(userId, entry);
      }
    }

    return entry;
  }

  /**
   * Deviate from a locked entry (with reason)
   */
  async deviateEntry(id: string, reason: string, userId?: string): Promise<CanonEntry | null> {
    const entry = this.entries.get(id);
    if (!entry) return null;

    entry.status = 'deviated';
    entry.reason = reason;
    this.entries.set(id, entry);

    if (userId) {
      await this.saveToFirestore(userId, entry);
    }

    return entry;
  }

  /**
   * Update entry confidence
   */
  updateConfidence(id: string, confidence: number): void {
    const entry = this.entries.get(id);
    if (entry && entry.status !== 'locked') {
      entry.confidence = Math.max(0, Math.min(100, confidence));
      this.entries.set(id, entry);
    }
  }

  /**
   * Vote on an entry (community feature)
   */
  async voteEntry(id: string, vote: 'up' | 'down', userId?: string): Promise<CanonEntry | null> {
    const entry = this.entries.get(id);
    if (!entry) return null;

    if (!entry.votes) {
      entry.votes = { up: 0, down: 0 };
    }

    if (vote === 'up') {
      entry.votes.up++;
    } else {
      entry.votes.down++;
    }

    this.entries.set(id, entry);

    if (userId) {
      await this.saveToFirestore(userId, entry);
    }

    return entry;
  }

  /**
   * Query canon entries with filters
   */
  queryCanon(filters: CanonFilters = {}): CanonEntry[] {
    let results = Array.from(this.entries.values());

    if (filters.type) {
      results = results.filter((e) => e.type === filters.type);
    }

    if (filters.status) {
      results = results.filter((e) => e.status === filters.status);
    }

    if (filters.author) {
      results = results.filter((e) => e.author === filters.author);
    }

    if (filters.tags && filters.tags.length > 0) {
      results = results.filter((e) =>
        e.tags?.some((tag) => filters.tags!.includes(tag))
      );
    }

    if (filters.minConfidence !== undefined) {
      results = results.filter((e) => e.confidence >= filters.minConfidence!);
    }

    // Sort by confidence (desc) then timestamp (desc)
    results.sort((a, b) => {
      if (b.confidence !== a.confidence) {
        return b.confidence - a.confidence;
      }
      return b.timestamp.getTime() - a.timestamp.getTime();
    });

    return results;
  }

  /**
   * Get entry by ID
   */
  getEntry(id: string): CanonEntry | null {
    return this.entries.get(id) || null;
  }

  /**
   * Get all entries
   */
  getAllEntries(): CanonEntry[] {
    return Array.from(this.entries.values());
  }

  /**
   * Export canon as markdown document
   */
  exportCanon(): string {
    const locked = this.queryCanon({ status: 'locked' });
    const pinned = this.queryCanon({ status: 'pinned' });
    const exploring = this.queryCanon({ status: 'exploring' });
    const deviated = this.queryCanon({ status: 'deviated' });

    let markdown = '# AGI-CAD CANON\n\n';
    markdown += `Generated: ${new Date().toISOString()}\n\n`;

    markdown += '## 🔒 LOCKED (Canonical)\n\n';
    locked.forEach((entry) => {
      markdown += `### ${entry.title}\n`;
      markdown += `**Type:** ${entry.type} | **Confidence:** ${entry.confidence}%\n`;
      markdown += `${entry.description}\n\n`;
      if (entry.reason) {
        markdown += `*Reason:* ${entry.reason}\n\n`;
      }
    });

    markdown += '\n## 📌 PINNED (Validated)\n\n';
    pinned.forEach((entry) => {
      markdown += `### ${entry.title}\n`;
      markdown += `**Type:** ${entry.type} | **Confidence:** ${entry.confidence}%\n`;
      markdown += `${entry.description}\n\n`;
    });

    markdown += '\n## 🔄 EXPLORING (In Progress)\n\n';
    exploring.forEach((entry) => {
      markdown += `### ${entry.title}\n`;
      markdown += `${entry.description}\n\n`;
    });

    if (deviated.length > 0) {
      markdown += '\n## ⚠️ DEVIATIONS\n\n';
      deviated.forEach((entry) => {
        markdown += `### ${entry.title}\n`;
        markdown += `${entry.description}\n`;
        markdown += `**Deviation Reason:** ${entry.reason}\n\n`;
      });
    }

    return markdown;
  }

  /**
   * Delete an entry
   */
  async deleteEntry(id: string, userId?: string): Promise<boolean> {
    const deleted = this.entries.delete(id);

    if (deleted && userId) {
      try {
        await this.deleteFromFirestore(userId, id);
      } catch (error) {
        console.error('Failed to delete from Firestore:', error);
      }
    }

    return deleted;
  }

  // ═══════════════════════════════════════════════════════
  // PRIVATE METHODS
  // ═══════════════════════════════════════════════════════

  private generateId(): string {
    return `canon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private loadInitialCanon(): void {
    // Pre-populate with system canon from the build
    const systemCanon: Array<Omit<CanonEntry, 'id' | 'timestamp'>> = [
      {
        type: 'decision',
        status: 'locked',
        title: 'SOS as Primary Interface',
        description: 'The Symbolic Operating System (SOS) is the main UI, not a secondary dashboard.',
        author: 'system',
        relatedExperiments: [],
        confidence: 100,
        tags: ['architecture', 'ui'],
      },
      {
        type: 'principle',
        status: 'locked',
        title: 'FORGE = Coordination',
        description: 'The FORGE is where creation happens - coordination center for all labs and agents.',
        author: 'system',
        relatedExperiments: [],
        confidence: 100,
        tags: ['architecture', 'naming'],
      },
      {
        type: 'principle',
        status: 'locked',
        title: 'VAULT = Persistence',
        description: 'The VAULT stores all experiments with full context, metadata, and embeddings.',
        author: 'system',
        relatedExperiments: [],
        confidence: 100,
        tags: ['architecture', 'persistence'],
      },
      {
        type: 'decision',
        status: 'locked',
        title: 'Golden/Amber Aesthetic',
        description: 'Mystical golden/amber color scheme with cyber-mystical aesthetic throughout.',
        author: 'system',
        relatedExperiments: [],
        confidence: 100,
        tags: ['design', 'aesthetic'],
      },
      {
        type: 'decision',
        status: 'locked',
        title: 'LangChain.js for Agents',
        description: 'Multi-agent orchestration using LangChain.js (not CrewAI).',
        author: 'system',
        relatedExperiments: [],
        confidence: 100,
        tags: ['agents', 'framework'],
        reason: 'Better TypeScript integration and Next.js compatibility',
      },
      {
        type: 'decision',
        status: 'locked',
        title: 'Pinecone for Vector Embeddings',
        description: 'Vector storage and similarity search using Pinecone serverless.',
        author: 'system',
        relatedExperiments: [],
        confidence: 100,
        tags: ['embeddings', 'infrastructure'],
      },
      {
        type: 'principle',
        status: 'locked',
        title: 'Extensible Lab System',
        description: 'Labs are self-contained plugins that register with the central registry.',
        author: 'system',
        relatedExperiments: [],
        confidence: 100,
        tags: ['architecture', 'extensibility'],
      },
      {
        type: 'constraint',
        status: 'locked',
        title: 'No Breaking Changes',
        description: 'New features must not break existing functionality.',
        author: 'system',
        relatedExperiments: [],
        confidence: 100,
        tags: ['development', 'stability'],
      },
      {
        type: 'pattern',
        status: 'pinned',
        title: 'Framer Motion for Animations',
        description: 'Use Framer Motion for all complex animations and transitions.',
        author: 'system',
        relatedExperiments: [],
        confidence: 90,
        tags: ['ui', 'animation'],
      },
      {
        type: 'pattern',
        status: 'pinned',
        title: 'Tailwind for Styling',
        description: 'Prefer Tailwind CSS over CSS-in-JS for component styling.',
        author: 'system',
        relatedExperiments: [],
        confidence: 90,
        tags: ['ui', 'styling'],
      },
    ];

    // Add system canon
    systemCanon.forEach((canon) => {
      const entry: CanonEntry = {
        ...canon,
        id: this.generateId(),
        timestamp: new Date(),
      };
      this.entries.set(entry.id, entry);
    });
  }

  // Firestore integration methods
  private async loadFromFirestore(userId: string): Promise<CanonEntry[]> {
    // Implementation depends on Firestore client
    // For now, return empty array
    // TODO: Implement when Firestore schema is finalized
    return [];
  }

  private async saveToFirestore(userId: string, entry: CanonEntry): Promise<void> {
    // Implementation depends on Firestore client
    // TODO: Implement when Firestore schema is finalized
  }

  private async deleteFromFirestore(userId: string, entryId: string): Promise<void> {
    // Implementation depends on Firestore client
    // TODO: Implement when Firestore schema is finalized
  }
}

// Singleton instance
export const canonTracker = new CanonTracker();

// Initialize on import (can be called again with userId later)
if (typeof window !== 'undefined') {
  canonTracker.initialize();
}
