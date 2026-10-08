const { cosineSimilarity, computeBM25 } = require('../embeddings/similarity');
const { defaultVectorizer } = require('../embeddings/vectorizer');
const { filterAuthorizedChunks } = require('./permissionFilter');
const { vectorStore } = require('./vectorStore');

/**
 * Executes a hybrid retrieval pipeline:
 * 1. Filter chunks by caller authorization (Role & Dept).
 * 2. Compute Dense Vector Cosine Similarity with query embedding.
 * 3. Compute BM25 Lexical Keyword score.
 * 4. Fuse scores: FinalScore = alpha * CosineScore + (1 - alpha) * NormalizedBM25
 * 5. Return top ranked candidate chunks.
 *
 * @param {string} queryText
 * @param {Object} options - { userRole, userDeptId, topK, minRelevance, alpha }
 */
async function hybridSearch(queryText, options = {}) {
  const {
    userRole = 'CITIZEN',
    userDeptId = null,
    topK = 5,
    minRelevance = 0.28,
    alpha = 0.65 // 65% dense vector, 35% lexical BM25
  } = options;

  if (!vectorStore.isInitialized) {
    await vectorStore.initialize();
  }

  const allChunks = vectorStore.getAllChunks();
  if (allChunks.length === 0) {
    return [];
  }

  // 1. Role-Aware Permission Filtering
  const authorizedChunks = filterAuthorizedChunks(allChunks, userRole, userDeptId);
  if (authorizedChunks.length === 0) {
    return [];
  }

  // 2. Query Embedding and Tokenization
  const queryEmbedding = defaultVectorizer.embed(queryText);
  const queryTokens = defaultVectorizer.tokenize(queryText);

  // Compute doc frequencies for BM25
  const docFreqMap = {};
  for (const c of authorizedChunks) {
    const tokens = new Set(defaultVectorizer.tokenize(c.content));
    for (const t of queryTokens) {
      if (tokens.has(t)) {
        docFreqMap[t] = (docFreqMap[t] || 0) + 1;
      }
    }
  }

  // 3. Score each authorized chunk
  const scoredChunks = [];
  let maxBm25 = 0.0001;

  for (const chunk of authorizedChunks) {
    // Dense Vector Cosine Similarity
    const cosine = cosineSimilarity(queryEmbedding, chunk.embedding);

    // Lexical BM25 Score
    const chunkTokens = defaultVectorizer.tokenize(chunk.content);
    const bm25 = computeBM25(queryTokens, chunkTokens, 150, docFreqMap, authorizedChunks.length);
    if (bm25 > maxBm25) maxBm25 = bm25;

    scoredChunks.push({
      chunk,
      cosineScore: cosine,
      bm25Score: bm25
    });
  }

  // 4. Score Fusion and Normalization
  const fusedResults = scoredChunks.map(item => {
    const normalizedBm25 = item.bm25Score / maxBm25;
    // Boost if query tokens appear directly in chunk title or section
    let headerBoost = 0.0;
    const lowerHeader = (item.chunk.section_title || '').toLowerCase();
    for (const qt of queryTokens) {
      if (lowerHeader.includes(qt)) {
        headerBoost += 0.15;
      }
    }

    const fusedScore = (alpha * item.cosineScore) + ((1 - alpha) * normalizedBm25) + headerBoost;

    return {
      id: item.chunk.id,
      document_id: item.chunk.document_id,
      document_title: item.chunk.doc_title,
      document_type: item.chunk.document_type,
      version: item.chunk.doc_version,
      section_title: item.chunk.section_title,
      page_number: item.chunk.page_number,
      content: item.chunk.content,
      visibility: item.chunk.visibility,
      department_id: item.chunk.department_id,
      cosineScore: Number(item.cosineScore.toFixed(4)),
      bm25Score: Number(item.bm25Score.toFixed(4)),
      relevanceScore: Number(Math.min(1.0, Math.max(0.0, fusedScore)).toFixed(4))
    };
  });

  // 5. Filter by threshold and sort descending
  const filtered = fusedResults
    .filter(res => res.relevanceScore >= minRelevance)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, topK);

  return filtered;
}

module.exports = { hybridSearch };
