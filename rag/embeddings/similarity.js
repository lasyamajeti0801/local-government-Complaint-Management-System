/**
 * Similarity metrics for vector search and lexical retrieval.
 */

/**
 * Calculates Cosine Similarity between two numerical vectors.
 * Returns a value between -1.0 and 1.0 (typically 0.0 to 1.0 for normalized embeddings).
 */
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) {
    return 0.0;
  }

  let dotProduct = 0.0;
  let normA = 0.0;
  let normB = 0.0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) {
    return 0.0;
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Computes BM25 score for lexical keyword matching.
 * @param {Array<string>} queryTokens
 * @param {Array<string>} docTokens
 * @param {number} avgDocLength
 * @param {number} docFreq (how many docs contain the token)
 * @param {number} totalDocs
 */
function computeBM25(queryTokens, docTokens, avgDocLength = 150, docFreqMap = {}, totalDocs = 100) {
  const k1 = 1.5;
  const b = 0.75;
  const docLen = docTokens.length;

  // Build term frequency for document
  const tf = {};
  for (const t of docTokens) {
    tf[t] = (tf[t] || 0) + 1;
  }

  let score = 0.0;
  for (const q of queryTokens) {
    if (!tf[q]) continue;

    const n = docFreqMap[q] || 1;
    // IDF calculation
    const idf = Math.log(1 + (totalDocs - n + 0.5) / (n + 0.5));
    const termTf = tf[q];
    const denom = termTf + k1 * (1 - b + b * (docLen / avgDocLength));
    score += idf * ((termTf * (k1 + 1)) / denom);
  }

  return score;
}

module.exports = {
  cosineSimilarity,
  computeBM25
};
