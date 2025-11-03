/**
 * Phase 18: Vault Types
 * Comprehensive TypeScript interfaces for vault entries, design persistence, and memory storage
 */

import { LabType, GlyphMetrics } from '../glyph/schema';

// ============================================================================
// Core Vault Entry Types
// ============================================================================

export enum VaultEntryType {
  DESIGN = 'DESIGN',
  MEMORY = 'MEMORY',
  THREAD = 'THREAD',
  SNAPSHOT = 'SNAPSHOT',
  GLYPH_STATE = 'GLYPH_STATE',
  CONVERSATION = 'CONVERSATION',
  ARTIFACT = 'ARTIFACT',
}

export enum VaultEntryStatus {
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
  DELETED = 'DELETED',
  DRAFT = 'DRAFT',
}

export interface VaultEntryMetadata {
  id: string;
  type: VaultEntryType;
  status: VaultEntryStatus;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
  tags: string[];
  version: number;
  parentId?: string;
  checksum?: string;
}

// ============================================================================
// Design Entry Types
// ============================================================================

export interface DesignComponent {
  id: string;
  type: string;
  name: string;
  properties: Record<string, any>;
  children?: string[];
  position?: { x: number; y: number; z?: number };
  metadata?: Record<string, any>;
}

export interface DesignEntry {
  metadata: VaultEntryMetadata;
  title: string;
  description: string;
  components: DesignComponent[];
  relationships: DesignRelationship[];
  parameters: Record<string, any>;
  constraints: DesignConstraint[];
  performance?: PerformanceMetrics;
}

export interface DesignRelationship {
  id: string;
  sourceId: string;
  targetId: string;
  type: 'dependency' | 'composition' | 'association' | 'inheritance';
  properties?: Record<string, any>;
}

export interface DesignConstraint {
  id: string;
  type: 'size' | 'performance' | 'cost' | 'material' | 'custom';
  expression: string;
  value: number | string;
  unit?: string;
  priority: number;
}

export interface PerformanceMetrics {
  computeTime?: number;
  memoryUsage?: number;
  complexity?: number;
  qualityScore?: number;
  fidelityScore?: number;
}

// ============================================================================
// Memory Entry Types
// ============================================================================

export interface MemoryEntry {
  metadata: VaultEntryMetadata;
  content: string;
  context: MemoryContext;
  embeddings?: number[];
  associations: string[]; // IDs of related memories
  importance: number; // 0-1 score
  accessCount: number;
  lastAccessed: number;
}

export interface MemoryContext {
  sessionId?: string;
  userId?: string;
  labType?: LabType;
  task?: string;
  entities?: string[];
  timestamp: number;
}

// ============================================================================
// Thread Entry Types (for Archivist)
// ============================================================================

export interface ThreadEntry {
  metadata: VaultEntryMetadata;
  threadId: string;
  platform: 'claude' | 'openai' | 'anthropic' | 'github' | 'custom';
  title: string;
  messages: ThreadMessage[];
  artifacts: ThreadArtifact[];
  summary?: string;
  keywords?: string[];
}

export interface ThreadMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  metadata?: Record<string, any>;
  artifacts?: string[];
}

export interface ThreadArtifact {
  id: string;
  type: 'code' | 'document' | 'image' | 'data' | 'config';
  name: string;
  content: string;
  language?: string;
  size: number;
  hash: string;
}

// ============================================================================
// Snapshot Entry Types
// ============================================================================

export interface SnapshotEntry {
  metadata: VaultEntryMetadata;
  targetId: string;
  targetType: VaultEntryType;
  state: Record<string, any>;
  diff?: SnapshotDiff;
  reason?: string;
}

export interface SnapshotDiff {
  added: Record<string, any>;
  modified: Record<string, any>;
  removed: string[];
}

// ============================================================================
// Glyph State Entry Types
// ============================================================================

export interface GlyphStateEntry {
  metadata: VaultEntryMetadata;
  glyphId: string;
  labType: LabType;
  state: string;
  metrics: GlyphMetrics;
  transitions: GlyphTransitionRecord[];
  anomalies?: GlyphAnomaly[];
}

export interface GlyphTransitionRecord {
  timestamp: number;
  fromState: string;
  toState: string;
  duration: number;
  trigger: 'manual' | 'automatic' | 'threshold';
  reason?: string;
}

export interface GlyphAnomaly {
  timestamp: number;
  type: 'spike' | 'drop' | 'oscillation' | 'stagnation';
  metric: keyof GlyphMetrics;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

// ============================================================================
// Conversation Entry Types
// ============================================================================

export interface ConversationEntry {
  metadata: VaultEntryMetadata;
  sessionId: string;
  participants: string[];
  turns: ConversationTurn[];
  context: ConversationContext;
  outcomes?: ConversationOutcome[];
}

export interface ConversationTurn {
  id: string;
  speaker: string;
  content: string;
  timestamp: number;
  intent?: string;
  sentiment?: number;
  entities?: Record<string, string[]>;
}

export interface ConversationContext {
  topic?: string;
  goal?: string;
  domain?: string;
  priorKnowledge?: string[];
}

export interface ConversationOutcome {
  type: 'decision' | 'action' | 'learning' | 'artifact';
  description: string;
  confidence: number;
  references?: string[];
}

// ============================================================================
// Artifact Entry Types
// ============================================================================

export interface ArtifactEntry {
  metadata: VaultEntryMetadata;
  name: string;
  type: string;
  content: string | Buffer;
  format: string;
  size: number;
  hash: string;
  dependencies?: string[];
  usage?: ArtifactUsage[];
}

export interface ArtifactUsage {
  context: string;
  timestamp: number;
  user: string;
  purpose: string;
}

// ============================================================================
// Query Types
// ============================================================================

export interface VaultQuery {
  type?: VaultEntryType | VaultEntryType[];
  status?: VaultEntryStatus | VaultEntryStatus[];
  tags?: string[];
  createdAfter?: number;
  createdBefore?: number;
  updatedAfter?: number;
  updatedBefore?: number;
  createdBy?: string;
  searchText?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'version' | 'relevance';
  sortOrder?: 'asc' | 'desc';
}

export interface VaultQueryResult<T = any> {
  entries: T[];
  total: number;
  hasMore: boolean;
  nextOffset?: number;
}

// ============================================================================
// Index Types
// ============================================================================

export interface VaultIndex {
  id: string;
  type: VaultEntryType;
  fields: string[];
  unique: boolean;
  createdAt: number;
}

export interface VaultStatistics {
  totalEntries: number;
  entriesByType: Record<VaultEntryType, number>;
  entriesByStatus: Record<VaultEntryStatus, number>;
  totalSize: number;
  oldestEntry?: number;
  newestEntry?: number;
  lastCompaction?: number;
}

// ============================================================================
// Archivist Types
// ============================================================================

export interface ArchivistSearchQuery {
  query: string;
  platforms?: ('claude' | 'openai' | 'anthropic' | 'github')[];
  dateRange?: {
    start: number;
    end: number;
  };
  keywords?: string[];
  minRelevance?: number;
  limit?: number;
}

export interface ArchivistSearchResult {
  threadId: string;
  title: string;
  platform: string;
  relevance: number;
  matchedMessages: number;
  preview: string;
  timestamp: number;
  tags: string[];
}

export interface ArchivistRecoveryRequest {
  threadId: string;
  platform: string;
  includeArtifacts?: boolean;
  includeMetadata?: boolean;
}

export interface ArchivistRecoveryResult {
  success: boolean;
  thread?: ThreadEntry;
  error?: string;
  recoveredAt: number;
  artifactsCount?: number;
}

// ============================================================================
// Backup and Restore Types
// ============================================================================

export interface VaultBackup {
  id: string;
  timestamp: number;
  entries: VaultEntryMetadata[];
  statistics: VaultStatistics;
  checksum: string;
  compression: 'none' | 'gzip' | 'brotli';
  encrypted: boolean;
}

export interface VaultRestoreOptions {
  backupId: string;
  overwrite?: boolean;
  skipExisting?: boolean;
  validateChecksums?: boolean;
  targetTypes?: VaultEntryType[];
}

// ============================================================================
// Event Types
// ============================================================================

export interface VaultEvent {
  id: string;
  type: 'create' | 'update' | 'delete' | 'archive' | 'restore';
  entryId: string;
  entryType: VaultEntryType;
  userId: string;
  timestamp: number;
  changes?: Record<string, any>;
  metadata?: Record<string, any>;
}

// ============================================================================
// Type Guards
// ============================================================================

export function isDesignEntry(entry: any): entry is DesignEntry {
  return entry?.metadata?.type === VaultEntryType.DESIGN;
}

export function isMemoryEntry(entry: any): entry is MemoryEntry {
  return entry?.metadata?.type === VaultEntryType.MEMORY;
}

export function isThreadEntry(entry: any): entry is ThreadEntry {
  return entry?.metadata?.type === VaultEntryType.THREAD;
}

export function isSnapshotEntry(entry: any): entry is SnapshotEntry {
  return entry?.metadata?.type === VaultEntryType.SNAPSHOT;
}

export function isGlyphStateEntry(entry: any): entry is GlyphStateEntry {
  return entry?.metadata?.type === VaultEntryType.GLYPH_STATE;
}

export function isConversationEntry(entry: any): entry is ConversationEntry {
  return entry?.metadata?.type === VaultEntryType.CONVERSATION;
}

export function isArtifactEntry(entry: any): entry is ArtifactEntry {
  return entry?.metadata?.type === VaultEntryType.ARTIFACT;
}

// ============================================================================
// Utility Types
// ============================================================================

export type VaultEntry =
  | DesignEntry
  | MemoryEntry
  | ThreadEntry
  | SnapshotEntry
  | GlyphStateEntry
  | ConversationEntry
  | ArtifactEntry;

export type VaultEntryData<T extends VaultEntryType> = T extends VaultEntryType.DESIGN
  ? DesignEntry
  : T extends VaultEntryType.MEMORY
  ? MemoryEntry
  : T extends VaultEntryType.THREAD
  ? ThreadEntry
  : T extends VaultEntryType.SNAPSHOT
  ? SnapshotEntry
  : T extends VaultEntryType.GLYPH_STATE
  ? GlyphStateEntry
  : T extends VaultEntryType.CONVERSATION
  ? ConversationEntry
  : T extends VaultEntryType.ARTIFACT
  ? ArtifactEntry
  : never;
