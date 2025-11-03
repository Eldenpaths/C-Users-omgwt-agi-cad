/**
 * VAULT EVENT PROCESSOR
 *
 * Event-driven processing of VAULT entries.
 * Automatically generates embeddings and finds similar experiments.
 */

import {
  generateEmbedding,
  storeEmbedding,
  findSimilar,
  isOpenAIConfigured,
  isPineconeConfigured,
} from '@/lib/embeddings';
import type { Experiment } from '@/lib/firestore/schema';

export interface ProcessingResult {
  success: boolean;
  experimentId: string;
  embeddingGenerated: boolean;
  embeddingStored: boolean;
  similarExperiments: Array<{
    id: string;
    score: number;
    title: string;
    labId: string;
  }>;
  suggestions: string[];
  error?: string;
  processingTime: number;
}

/**
 * Process a VAULT entry after save
 * Generates embedding, stores in Pinecone, finds similar experiments
 */
export async function processVaultEntry(
  experiment: Experiment
): Promise<ProcessingResult> {
  const startTime = Date.now();

  const result: ProcessingResult = {
    success: false,
    experimentId: experiment.id,
    embeddingGenerated: false,
    embeddingStored: false,
    similarExperiments: [],
    suggestions: [],
    processingTime: 0,
  };

  try {
    console.log(`[Vault Processor] Processing experiment: ${experiment.id}`);

    // Check if services are configured
    if (!isOpenAIConfigured()) {
      console.warn('[Vault Processor] OpenAI not configured, skipping');
      result.error = 'OpenAI API key not configured';
      result.processingTime = Date.now() - startTime;
      return result;
    }

    if (!isPineconeConfigured()) {
      console.warn('[Vault Processor] Pinecone not configured, skipping');
      result.error = 'Pinecone API key not configured';
      result.processingTime = Date.now() - startTime;
      return result;
    }

    // STEP 1: Generate embedding from experiment data
    const embeddingText = createEmbeddingText(experiment);
    console.log(`[Vault Processor] Generating embedding for "${experiment.title}"`);

    const embedding = await generateEmbedding(embeddingText);
    result.embeddingGenerated = true;
    console.log('[Vault Processor] Embedding generated');

    // STEP 2: Store in Pinecone with metadata
    const metadata = {
      experimentId: experiment.id,
      title: experiment.title,
      labId: experiment.labId,
      status: experiment.status,
      tags: experiment.tags || [],
      createdAt: experiment.createdAt?.toMillis() || Date.now(),
      userId: experiment.userId,
    };

    await storeEmbedding(experiment.id, embedding, metadata);
    result.embeddingStored = true;
    console.log('[Vault Processor] Embedding stored in Pinecone');

    // STEP 3: Find similar experiments
    console.log('[Vault Processor] Finding similar experiments...');
    const similarResults = await findSimilar(embedding, 5);

    // Filter out the current experiment and format results
    result.similarExperiments = similarResults
      .filter((r) => r.id !== experiment.id && r.score > 0.7) // Only high similarity
      .map((r) => ({
        id: r.id,
        score: r.score,
        title: r.metadata.title as string,
        labId: r.metadata.labId as string,
      }));

    console.log(`[Vault Processor] Found ${result.similarExperiments.length} similar experiments`);

    // STEP 4: Generate suggestions based on similar experiments
    result.suggestions = generateSuggestions(experiment, result.similarExperiments);

    result.success = true;
    result.processingTime = Date.now() - startTime;

    console.log(`[Vault Processor] Processing complete in ${result.processingTime}ms`);
    return result;

  } catch (error: any) {
    console.error('[Vault Processor] Processing failed:', error);

    result.error = error.message;
    result.processingTime = Date.now() - startTime;
    return result;
  }
}

/**
 * Create text representation of experiment for embedding
 */
function createEmbeddingText(experiment: Experiment): string {
  const parts: string[] = [];

  // Title and description
  parts.push(`Title: ${experiment.title}`);
  if (experiment.description) {
    parts.push(`Description: ${experiment.description}`);
  }

  // Lab context
  parts.push(`Lab: ${experiment.labId}`);

  // Tags
  if (experiment.tags && experiment.tags.length > 0) {
    parts.push(`Tags: ${experiment.tags.join(', ')}`);
  }

  // Commands executed
  if (experiment.commands && experiment.commands.length > 0) {
    const commandSummary = experiment.commands
      .map((cmd) => cmd.command)
      .join(', ');
    parts.push(`Commands: ${commandSummary}`);
  }

  // Final state (selective properties)
  if (experiment.finalState) {
    const stateKeys = Object.keys(experiment.finalState);
    parts.push(`State properties: ${stateKeys.join(', ')}`);
  }

  return parts.join('\n');
}

/**
 * Generate actionable suggestions based on similar experiments
 */
function generateSuggestions(
  experiment: Experiment,
  similarExperiments: Array<{ id: string; score: number; title: string; labId: string }>
): string[] {
  const suggestions: string[] = [];

  if (similarExperiments.length === 0) {
    suggestions.push('This appears to be a unique experiment with no close matches.');
    return suggestions;
  }

  // Suggestion 1: Cross-reference similar work
  const topMatch = similarExperiments[0];
  suggestions.push(
    `Review "${topMatch.title}" (${(topMatch.score * 100).toFixed(0)}% similar) for insights`
  );

  // Suggestion 2: Cross-lab opportunities
  const differentLabs = similarExperiments.filter((e) => e.labId !== experiment.labId);
  if (differentLabs.length > 0) {
    suggestions.push(
      `Consider applying techniques from ${differentLabs[0].labId} lab`
    );
  }

  // Suggestion 3: Pattern recognition
  if (similarExperiments.length >= 3) {
    suggestions.push(
      `Pattern detected: ${similarExperiments.length} related experiments found - consider creating a workflow`
    );
  }

  return suggestions;
}

/**
 * Batch process multiple experiments (for initial migration)
 */
export async function batchProcessExperiments(
  experiments: Experiment[]
): Promise<ProcessingResult[]> {
  console.log(`[Vault Processor] Batch processing ${experiments.length} experiments`);

  const results: ProcessingResult[] = [];

  for (const experiment of experiments) {
    try {
      const result = await processVaultEntry(experiment);
      results.push(result);

      // Add small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error: any) {
      console.error(`[Vault Processor] Failed to process ${experiment.id}:`, error);
      results.push({
        success: false,
        experimentId: experiment.id,
        embeddingGenerated: false,
        embeddingStored: false,
        similarExperiments: [],
        suggestions: [],
        error: error.message,
        processingTime: 0,
      });
    }
  }

  const successCount = results.filter((r) => r.success).length;
  console.log(`[Vault Processor] Batch complete: ${successCount}/${experiments.length} successful`);

  return results;
}
