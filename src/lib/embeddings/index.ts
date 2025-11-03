/**
 * EMBEDDINGS MODULE - Main Entry Point
 *
 * Vector embeddings and similarity search using Pinecone
 */

export {
  generateEmbedding,
  storeEmbedding,
  findSimilar,
  findSimilarByText,
  deleteEmbedding,
  isPineconeConfigured,
  isOpenAIConfigured,
  getServiceStatus,
  initializePineconeIndex,
} from './vector-service';
