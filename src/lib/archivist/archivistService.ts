/**
 * Phase 18: Archivist Service
 * Thread search and recovery from conversation history
 */

import {
  ThreadEntry,
  ThreadMessage,
  ThreadArtifact,
  ArchivistSearchQuery,
  ArchivistSearchResult,
  ArchivistRecoveryRequest,
  ArchivistRecoveryResult,
  VaultEntryType,
  VaultEntryStatus,
} from '../vault/vaultTypes';
import { vaultService } from '../vault/vaultService';

// ============================================================================
// Archivist Service Class
// ============================================================================

export class ArchivistService {
  // ========================================================================
  // Search Operations
  // ========================================================================

  async searchThreads(searchQuery: ArchivistSearchQuery): Promise<ArchivistSearchResult[]> {
    console.log(`🔍 Archivist searching for: "${searchQuery.query}"`);

    // Query vault for thread entries
    const vaultQuery = {
      type: VaultEntryType.THREAD,
      status: VaultEntryStatus.ACTIVE,
      limit: searchQuery.limit || 20,
    };

    const results = await vaultService.queryEntries<ThreadEntry>(vaultQuery);

    // Filter and rank results
    const searchResults: ArchivistSearchResult[] = [];

    for (const thread of results.entries) {
      const relevance = this.calculateRelevance(thread, searchQuery);

      if (relevance >= (searchQuery.minRelevance || 0.3)) {
        // Count matched messages
        const matchedMessages = this.countMatchedMessages(thread, searchQuery.query);

        // Generate preview
        const preview = this.generatePreview(thread, searchQuery.query);

        searchResults.push({
          threadId: thread.metadata.id,
          title: thread.title,
          platform: thread.platform,
          relevance,
          matchedMessages,
          preview,
          timestamp: thread.metadata.createdAt,
          tags: thread.metadata.tags,
        });
      }
    }

    // Sort by relevance
    searchResults.sort((a, b) => b.relevance - a.relevance);

    console.log(`✅ Archivist found ${searchResults.length} matching threads`);
    return searchResults;
  }

  async searchByKeywords(keywords: string[]): Promise<ArchivistSearchResult[]> {
    const vaultQuery = {
      type: VaultEntryType.THREAD,
      tags: keywords,
      status: VaultEntryStatus.ACTIVE,
      limit: 50,
    };

    const results = await vaultService.queryEntries<ThreadEntry>(vaultQuery);

    return results.entries.map((thread) => ({
      threadId: thread.metadata.id,
      title: thread.title,
      platform: thread.platform,
      relevance: 1.0,
      matchedMessages: thread.messages.length,
      preview: thread.summary || thread.messages[0]?.content.substring(0, 200) || '',
      timestamp: thread.metadata.createdAt,
      tags: thread.keywords || [],
    }));
  }

  async searchByDateRange(start: number, end: number, platform?: string): Promise<ArchivistSearchResult[]> {
    const vaultQuery = {
      type: VaultEntryType.THREAD,
      createdAfter: start,
      createdBefore: end,
      status: VaultEntryStatus.ACTIVE,
      limit: 100,
    };

    const results = await vaultService.queryEntries<ThreadEntry>(vaultQuery);

    // Filter by platform if specified
    const filtered = platform
      ? results.entries.filter((t) => t.platform === platform)
      : results.entries;

    return filtered.map((thread) => ({
      threadId: thread.metadata.id,
      title: thread.title,
      platform: thread.platform,
      relevance: 1.0,
      matchedMessages: thread.messages.length,
      preview: thread.summary || thread.messages[0]?.content.substring(0, 200) || '',
      timestamp: thread.metadata.createdAt,
      tags: thread.keywords || [],
    }));
  }

  // ========================================================================
  // Recovery Operations
  // ========================================================================

  async recoverThread(request: ArchivistRecoveryRequest): Promise<ArchivistRecoveryResult> {
    console.log(`🔄 Archivist recovering thread: ${request.threadId}`);

    try {
      // Check if thread already exists in vault
      const existing = await vaultService.getEntry<ThreadEntry>(request.threadId);

      if (existing) {
        console.log(`✅ Thread already in vault: ${request.threadId}`);
        return {
          success: true,
          thread: existing,
          recoveredAt: Date.now(),
          artifactsCount: existing.artifacts.length,
        };
      }

      // Attempt to recover from external source based on platform
      const recovered = await this.recoverFromPlatform(request);

      if (!recovered) {
        return {
          success: false,
          error: `Unable to recover thread from ${request.platform}`,
          recoveredAt: Date.now(),
        };
      }

      // Save to vault
      const threadId = await vaultService.createThread({
        ...recovered,
        metadata: {
          createdBy: 'archivist',
          tags: ['recovered', request.platform],
        },
      });

      console.log(`✅ Thread recovered and saved: ${threadId}`);

      return {
        success: true,
        thread: recovered,
        recoveredAt: Date.now(),
        artifactsCount: recovered.artifacts.length,
      };
    } catch (error) {
      console.error(`❌ Thread recovery failed:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        recoveredAt: Date.now(),
      };
    }
  }

  async batchRecover(requests: ArchivistRecoveryRequest[]): Promise<ArchivistRecoveryResult[]> {
    console.log(`📦 Archivist batch recovering ${requests.length} threads`);

    const results: ArchivistRecoveryResult[] = [];

    for (const request of requests) {
      const result = await this.recoverThread(request);
      results.push(result);

      // Add delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    const successCount = results.filter((r) => r.success).length;
    console.log(`✅ Batch recovery complete: ${successCount}/${requests.length} succeeded`);

    return results;
  }

  // ========================================================================
  // Platform-Specific Recovery (Placeholders)
  // ========================================================================

  private async recoverFromPlatform(
    request: ArchivistRecoveryRequest
  ): Promise<ThreadEntry | null> {
    switch (request.platform) {
      case 'claude':
        return this.recoverFromClaude(request);
      case 'openai':
        return this.recoverFromOpenAI(request);
      case 'github':
        return this.recoverFromGitHub(request);
      default:
        console.warn(`⚠️ Unsupported platform: ${request.platform}`);
        return null;
    }
  }

  private async recoverFromClaude(request: ArchivistRecoveryRequest): Promise<ThreadEntry | null> {
    // Placeholder for Claude API integration
    console.log(`🔄 Attempting recovery from Claude: ${request.threadId}`);

    // In production, this would use Claude API to fetch conversation history
    // For now, return a mock thread
    return this.createMockThread(request, 'claude');
  }

  private async recoverFromOpenAI(request: ArchivistRecoveryRequest): Promise<ThreadEntry | null> {
    // Placeholder for OpenAI API integration
    console.log(`🔄 Attempting recovery from OpenAI: ${request.threadId}`);

    // In production, this would use OpenAI API to fetch conversation history
    return this.createMockThread(request, 'openai');
  }

  private async recoverFromGitHub(request: ArchivistRecoveryRequest): Promise<ThreadEntry | null> {
    // Placeholder for GitHub API integration
    console.log(`🔄 Attempting recovery from GitHub: ${request.threadId}`);

    // In production, this would use GitHub API to fetch issue/PR conversations
    return this.createMockThread(request, 'github');
  }

  // ========================================================================
  // Analysis Operations
  // ========================================================================

  async analyzeThread(threadId: string): Promise<ThreadAnalysis> {
    const thread = await vaultService.getEntry<ThreadEntry>(threadId);

    if (!thread) {
      throw new Error(`Thread not found: ${threadId}`);
    }

    const analysis: ThreadAnalysis = {
      threadId,
      messageCount: thread.messages.length,
      artifactCount: thread.artifacts.length,
      wordCount: this.countWords(thread),
      participantCount: this.countParticipants(thread),
      duration: this.calculateDuration(thread),
      topKeywords: this.extractKeywords(thread),
      sentiment: this.analyzeSentiment(thread),
      topics: this.extractTopics(thread),
    };

    return analysis;
  }

  async generateThreadSummary(threadId: string): Promise<string> {
    const thread = await vaultService.getEntry<ThreadEntry>(threadId);

    if (!thread) {
      throw new Error(`Thread not found: ${threadId}`);
    }

    // Generate a basic summary
    const summary = `Thread "${thread.title}" on ${thread.platform} with ${thread.messages.length} messages and ${thread.artifacts.length} artifacts.`;

    // Update thread with summary
    await vaultService.updateEntry<ThreadEntry>(threadId, {
      summary,
    } as Partial<ThreadEntry>);

    return summary;
  }

  // ========================================================================
  // Helper Methods
  // ========================================================================

  private calculateRelevance(thread: ThreadEntry, query: ArchivistSearchQuery): number {
    let relevance = 0;

    // Check title
    if (thread.title.toLowerCase().includes(query.query.toLowerCase())) {
      relevance += 0.5;
    }

    // Check messages
    const matchingMessages = thread.messages.filter((msg) =>
      msg.content.toLowerCase().includes(query.query.toLowerCase())
    );
    relevance += Math.min(0.5, matchingMessages.length * 0.1);

    // Check keywords
    if (query.keywords && thread.keywords) {
      const matchedKeywords = query.keywords.filter((k) =>
        thread.keywords!.includes(k)
      );
      relevance += matchedKeywords.length * 0.2;
    }

    return Math.min(1.0, relevance);
  }

  private countMatchedMessages(thread: ThreadEntry, query: string): number {
    return thread.messages.filter((msg) =>
      msg.content.toLowerCase().includes(query.toLowerCase())
    ).length;
  }

  private generatePreview(thread: ThreadEntry, query: string): string {
    // Find first matching message
    const matchingMsg = thread.messages.find((msg) =>
      msg.content.toLowerCase().includes(query.toLowerCase())
    );

    if (matchingMsg) {
      const index = matchingMsg.content.toLowerCase().indexOf(query.toLowerCase());
      const start = Math.max(0, index - 50);
      const end = Math.min(matchingMsg.content.length, index + query.length + 50);
      return '...' + matchingMsg.content.substring(start, end) + '...';
    }

    return thread.summary || thread.messages[0]?.content.substring(0, 150) || '';
  }

  private countWords(thread: ThreadEntry): number {
    return thread.messages.reduce((count, msg) => {
      return count + msg.content.split(/\s+/).length;
    }, 0);
  }

  private countParticipants(thread: ThreadEntry): number {
    const participants = new Set<string>();
    thread.messages.forEach((msg) => participants.add(msg.role));
    return participants.size;
  }

  private calculateDuration(thread: ThreadEntry): number {
    if (thread.messages.length < 2) return 0;

    const first = thread.messages[0].timestamp;
    const last = thread.messages[thread.messages.length - 1].timestamp;
    return last - first;
  }

  private extractKeywords(thread: ThreadEntry): string[] {
    // Simple keyword extraction
    const text = thread.messages.map((m) => m.content).join(' ');
    const words = text.toLowerCase().split(/\s+/);
    const wordCount = new Map<string, number>();

    words.forEach((word) => {
      if (word.length > 4) {
        wordCount.set(word, (wordCount.get(word) || 0) + 1);
      }
    });

    return Array.from(wordCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map((entry) => entry[0]);
  }

  private analyzeSentiment(thread: ThreadEntry): number {
    // Placeholder sentiment analysis
    // Returns a score from -1 (negative) to 1 (positive)
    return 0.5;
  }

  private extractTopics(thread: ThreadEntry): string[] {
    // Placeholder topic extraction
    return thread.keywords || ['general'];
  }

  private createMockThread(
    request: ArchivistRecoveryRequest,
    platform: string
  ): ThreadEntry {
    return {
      metadata: {
        id: request.threadId,
        type: VaultEntryType.THREAD,
        status: VaultEntryStatus.ACTIVE,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        createdBy: 'archivist',
        tags: ['recovered', platform],
        version: 1,
      },
      threadId: request.threadId,
      platform: platform as any,
      title: `Recovered Thread ${request.threadId}`,
      messages: [],
      artifacts: [],
      summary: 'Thread recovered by Archivist',
      keywords: [],
    };
  }
}

// ============================================================================
// Types
// ============================================================================

export interface ThreadAnalysis {
  threadId: string;
  messageCount: number;
  artifactCount: number;
  wordCount: number;
  participantCount: number;
  duration: number;
  topKeywords: string[];
  sentiment: number;
  topics: string[];
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const archivistService = new ArchivistService();

// ============================================================================
// Convenience Functions
// ============================================================================

export async function searchThreads(query: string, limit: number = 10): Promise<ArchivistSearchResult[]> {
  return archivistService.searchThreads({
    query,
    limit,
  });
}

export async function recoverThread(threadId: string, platform: string): Promise<ArchivistRecoveryResult> {
  return archivistService.recoverThread({
    threadId,
    platform: platform as any,
    includeArtifacts: true,
    includeMetadata: true,
  });
}

export async function analyzeThread(threadId: string): Promise<ThreadAnalysis> {
  return archivistService.analyzeThread(threadId);
}
