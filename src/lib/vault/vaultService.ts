/**
 * Phase 18: Vault Service
 * Storage operations for vault entries with Firestore integration
 *
 * Phase 19A Enhancement: Schema validation using Zod
 */

import { getFirestoreInstance } from '../firebase';
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  startAfter,
  Timestamp,
  QueryConstraint,
} from 'firebase/firestore';
import {
  VaultEntry,
  VaultEntryType,
  VaultEntryStatus,
  VaultEntryMetadata,
  VaultQuery,
  VaultQueryResult,
  VaultStatistics,
  VaultEvent,
  DesignEntry,
  MemoryEntry,
  ThreadEntry,
  SnapshotEntry,
  GlyphStateEntry,
  ConversationEntry,
  ArtifactEntry,
} from './vaultTypes';
import { createHash } from 'crypto';
import {
  validateVaultEntry,
  validateLabData,
  formatValidationErrors,
  logValidationFailure,
} from '../schemas/vault-events';

// ============================================================================
// Constants
// ============================================================================

const VAULT_COLLECTION = 'vault_entries';
const VAULT_EVENTS_COLLECTION = 'vault_events';
const VAULT_STATS_COLLECTION = 'vault_statistics';

// ============================================================================
// Vault Service Class
// ============================================================================

export class VaultService {
  private db = getFirestoreInstance();
  private validationEnabled = true; // Can be disabled for testing

  // ========================================================================
  // Validation Operations (Phase 19A)
  // ========================================================================

  /**
   * Enable or disable schema validation
   */
  setValidationEnabled(enabled: boolean): void {
    this.validationEnabled = enabled;
    console.log(`[Vault] Schema validation ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Validate a lab experiment entry against its schema
   */
  private async validateEntry<T extends VaultEntry>(entry: T): Promise<{
    valid: boolean;
    errors?: string[];
  }> {
    if (!this.validationEnabled) {
      return { valid: true };
    }

    try {
      // Check if this is a lab entry (has labId in data)
      const labId = (entry as any).labId || (entry as any).data?.labId;

      if (labId) {
        // Validate lab-specific data
        const result = validateLabData(labId, entry);

        if (!result.success) {
          const errors = formatValidationErrors(result.errors!);

          // Log validation failure for CVRA analysis
          await logValidationFailure(labId, entry, result.errors!);

          console.warn(`[Vault] Schema validation failed for ${labId}:`, errors);
          return { valid: false, errors };
        }
      }

      // Validate as general vault entry if no labId
      // Note: This uses our old VaultEntry interface, which may differ from the new schemas
      // For now, we'll skip this validation if it's a recognized lab type

      return { valid: true };
    } catch (error) {
      console.error('[Vault] Validation error:', error);
      // Don't block saves on validation errors
      return { valid: true };
    }
  }

  // ========================================================================
  // Create Operations
  // ========================================================================

  async createEntry<T extends VaultEntry>(entry: T): Promise<string> {
    // Validate entry before saving (Phase 19A)
    const validation = await this.validateEntry(entry);
    if (!validation.valid && validation.errors) {
      console.warn('[Vault] Entry validation failed, but saving anyway:', validation.errors);
      // For Phase 19A, we log but don't block - in Phase 19B we can make this strict
    }
    const metadata: VaultEntryMetadata = {
      id: '', // Will be set by Firestore
      type: entry.metadata.type,
      status: entry.metadata.status || VaultEntryStatus.ACTIVE,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: entry.metadata.createdBy,
      tags: entry.metadata.tags || [],
      version: 1,
      parentId: entry.metadata.parentId,
    };

    // Calculate checksum
    const content = JSON.stringify(entry);
    metadata.checksum = this.calculateChecksum(content);

    const entryWithMetadata = {
      ...entry,
      metadata,
    };

    const docRef = await addDoc(
      collection(this.db, VAULT_COLLECTION),
      this.serializeEntry(entryWithMetadata)
    );

    // Update metadata with generated ID
    await updateDoc(docRef, {
      'metadata.id': docRef.id,
    });

    // Log creation event
    await this.logEvent({
      id: '',
      type: 'create',
      entryId: docRef.id,
      entryType: entry.metadata.type,
      userId: entry.metadata.createdBy,
      timestamp: Date.now(),
    });

    console.log(`✅ Vault entry created: ${docRef.id} (${entry.metadata.type})`);
    return docRef.id;
  }

  async createDesign(design: Omit<DesignEntry, 'metadata'> & { metadata: Partial<VaultEntryMetadata> }): Promise<string> {
    const entry: DesignEntry = {
      ...design,
      metadata: {
        ...design.metadata,
        type: VaultEntryType.DESIGN,
      } as VaultEntryMetadata,
    };
    return this.createEntry(entry);
  }

  async createMemory(memory: Omit<MemoryEntry, 'metadata'> & { metadata: Partial<VaultEntryMetadata> }): Promise<string> {
    const entry: MemoryEntry = {
      ...memory,
      metadata: {
        ...memory.metadata,
        type: VaultEntryType.MEMORY,
      } as VaultEntryMetadata,
    };
    return this.createEntry(entry);
  }

  async createThread(thread: Omit<ThreadEntry, 'metadata'> & { metadata: Partial<VaultEntryMetadata> }): Promise<string> {
    const entry: ThreadEntry = {
      ...thread,
      metadata: {
        ...thread.metadata,
        type: VaultEntryType.THREAD,
      } as VaultEntryMetadata,
    };
    return this.createEntry(entry);
  }

  // ========================================================================
  // Read Operations
  // ========================================================================

  async getEntry<T extends VaultEntry>(id: string): Promise<T | null> {
    const docRef = doc(this.db, VAULT_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return this.deserializeEntry<T>(docSnap.data());
  }

  async queryEntries<T extends VaultEntry>(vaultQuery: VaultQuery): Promise<VaultQueryResult<T>> {
    const constraints: QueryConstraint[] = [];

    // Type filter
    if (vaultQuery.type) {
      const types = Array.isArray(vaultQuery.type) ? vaultQuery.type : [vaultQuery.type];
      constraints.push(where('metadata.type', 'in', types));
    }

    // Status filter
    if (vaultQuery.status) {
      const statuses = Array.isArray(vaultQuery.status) ? vaultQuery.status : [vaultQuery.status];
      constraints.push(where('metadata.status', 'in', statuses));
    }

    // Tags filter
    if (vaultQuery.tags && vaultQuery.tags.length > 0) {
      constraints.push(where('metadata.tags', 'array-contains-any', vaultQuery.tags));
    }

    // Created by filter
    if (vaultQuery.createdBy) {
      constraints.push(where('metadata.createdBy', '==', vaultQuery.createdBy));
    }

    // Date filters
    if (vaultQuery.createdAfter) {
      constraints.push(where('metadata.createdAt', '>=', vaultQuery.createdAfter));
    }
    if (vaultQuery.createdBefore) {
      constraints.push(where('metadata.createdAt', '<=', vaultQuery.createdBefore));
    }

    // Sorting
    const sortField = vaultQuery.sortBy || 'createdAt';
    const sortDirection = vaultQuery.sortOrder || 'desc';
    constraints.push(orderBy(`metadata.${sortField}`, sortDirection));

    // Limit
    const limitValue = vaultQuery.limit || 50;
    constraints.push(firestoreLimit(limitValue + 1)); // Fetch one extra to check for more

    const q = query(collection(this.db, VAULT_COLLECTION), ...constraints);
    const snapshot = await getDocs(q);

    const entries: T[] = [];
    let hasMore = false;
    let index = 0;

    snapshot.forEach((doc) => {
      if (index < limitValue) {
        entries.push(this.deserializeEntry<T>(doc.data()));
      } else {
        hasMore = true;
      }
      index++;
    });

    return {
      entries,
      total: entries.length,
      hasMore,
      nextOffset: hasMore ? (vaultQuery.offset || 0) + limitValue : undefined,
    };
  }

  // ========================================================================
  // Update Operations
  // ========================================================================

  async updateEntry<T extends VaultEntry>(id: string, updates: Partial<T>): Promise<void> {
    const docRef = doc(this.db, VAULT_COLLECTION, id);
    const existing = await this.getEntry<T>(id);

    if (!existing) {
      throw new Error(`Vault entry not found: ${id}`);
    }

    const merged = {
      ...existing,
      ...updates,
      metadata: {
        ...existing.metadata,
        ...updates.metadata,
        updatedAt: Date.now(),
        version: existing.metadata.version + 1,
      },
    };

    // Recalculate checksum
    const content = JSON.stringify(merged);
    merged.metadata.checksum = this.calculateChecksum(content);

    await updateDoc(docRef, this.serializeEntry(merged));

    // Log update event
    await this.logEvent({
      id: '',
      type: 'update',
      entryId: id,
      entryType: existing.metadata.type,
      userId: existing.metadata.createdBy,
      timestamp: Date.now(),
      changes: updates,
    });

    console.log(`✅ Vault entry updated: ${id} (v${merged.metadata.version})`);
  }

  async archiveEntry(id: string): Promise<void> {
    await this.updateEntry(id, {
      metadata: {
        status: VaultEntryStatus.ARCHIVED,
      },
    } as any);

    console.log(`📦 Vault entry archived: ${id}`);
  }

  async restoreEntry(id: string): Promise<void> {
    await this.updateEntry(id, {
      metadata: {
        status: VaultEntryStatus.ACTIVE,
      },
    } as any);

    console.log(`♻️ Vault entry restored: ${id}`);
  }

  // ========================================================================
  // Delete Operations
  // ========================================================================

  async deleteEntry(id: string, soft: boolean = true): Promise<void> {
    if (soft) {
      await this.updateEntry(id, {
        metadata: {
          status: VaultEntryStatus.DELETED,
        },
      } as any);

      console.log(`🗑️ Vault entry soft-deleted: ${id}`);
    } else {
      const docRef = doc(this.db, VAULT_COLLECTION, id);
      const existing = await this.getEntry(id);

      await deleteDoc(docRef);

      // Log deletion event
      if (existing) {
        await this.logEvent({
          id: '',
          type: 'delete',
          entryId: id,
          entryType: existing.metadata.type,
          userId: existing.metadata.createdBy,
          timestamp: Date.now(),
        });
      }

      console.log(`🗑️ Vault entry permanently deleted: ${id}`);
    }
  }

  // ========================================================================
  // Statistics Operations
  // ========================================================================

  async getStatistics(): Promise<VaultStatistics> {
    const q = query(collection(this.db, VAULT_COLLECTION));
    const snapshot = await getDocs(q);

    const stats: VaultStatistics = {
      totalEntries: snapshot.size,
      entriesByType: {} as Record<VaultEntryType, number>,
      entriesByStatus: {} as Record<VaultEntryStatus, number>,
      totalSize: 0,
    };

    // Initialize counters
    Object.values(VaultEntryType).forEach((type) => {
      stats.entriesByType[type] = 0;
    });
    Object.values(VaultEntryStatus).forEach((status) => {
      stats.entriesByStatus[status] = 0;
    });

    let oldestTimestamp = Date.now();
    let newestTimestamp = 0;

    snapshot.forEach((doc) => {
      const entry = this.deserializeEntry(doc.data());

      // Count by type
      stats.entriesByType[entry.metadata.type]++;

      // Count by status
      stats.entriesByStatus[entry.metadata.status]++;

      // Track timestamps
      if (entry.metadata.createdAt < oldestTimestamp) {
        oldestTimestamp = entry.metadata.createdAt;
      }
      if (entry.metadata.createdAt > newestTimestamp) {
        newestTimestamp = entry.metadata.createdAt;
      }

      // Estimate size
      stats.totalSize += JSON.stringify(entry).length;
    });

    stats.oldestEntry = oldestTimestamp;
    stats.newestEntry = newestTimestamp;

    return stats;
  }

  // ========================================================================
  // Helper Methods
  // ========================================================================

  private calculateChecksum(content: string): string {
    if (typeof window !== 'undefined') {
      // Browser environment - use simple hash
      let hash = 0;
      for (let i = 0; i < content.length; i++) {
        const char = content.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      return Math.abs(hash).toString(16);
    } else {
      // Node environment - use crypto
      return createHash('sha256').update(content).digest('hex');
    }
  }

  private serializeEntry(entry: VaultEntry): any {
    // Convert to Firestore-compatible format
    return JSON.parse(JSON.stringify(entry));
  }

  private deserializeEntry<T extends VaultEntry>(data: any): T {
    return data as T;
  }

  private async logEvent(event: VaultEvent): Promise<void> {
    const eventDoc = {
      ...event,
      firestore_timestamp: Timestamp.now(),
    };

    await addDoc(collection(this.db, VAULT_EVENTS_COLLECTION), eventDoc);
  }

  // ========================================================================
  // Batch Operations
  // ========================================================================

  async batchCreate<T extends VaultEntry>(entries: T[]): Promise<string[]> {
    const ids: string[] = [];

    for (const entry of entries) {
      const id = await this.createEntry(entry);
      ids.push(id);
    }

    console.log(`✅ Batch created ${ids.length} vault entries`);
    return ids;
  }

  async batchDelete(ids: string[], soft: boolean = true): Promise<void> {
    for (const id of ids) {
      await this.deleteEntry(id, soft);
    }

    console.log(`🗑️ Batch deleted ${ids.length} vault entries`);
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const vaultService = new VaultService();

// ============================================================================
// Convenience Functions
// ============================================================================

export async function saveDesign(design: Omit<DesignEntry, 'metadata'> & { metadata: Partial<VaultEntryMetadata> }): Promise<string> {
  return vaultService.createDesign(design);
}

export async function saveMemory(memory: Omit<MemoryEntry, 'metadata'> & { metadata: Partial<VaultEntryMetadata> }): Promise<string> {
  return vaultService.createMemory(memory);
}

export async function saveThread(thread: Omit<ThreadEntry, 'metadata'> & { metadata: Partial<VaultEntryMetadata> }): Promise<string> {
  return vaultService.createThread(thread);
}

export async function getVaultEntry<T extends VaultEntry>(id: string): Promise<T | null> {
  return vaultService.getEntry<T>(id);
}

export async function queryVault<T extends VaultEntry>(query: VaultQuery): Promise<VaultQueryResult<T>> {
  return vaultService.queryEntries<T>(query);
}

export async function getVaultStats(): Promise<VaultStatistics> {
  return vaultService.getStatistics();
}
