/**
 * Nagar Connect RAG - Cross-Score Reranking & Reciprocal Rank Fusion (RRF)
 * Re-scores and orders retrieved candidate passages before context assembly
 */
const { tokenize } = require('../embeddings/embedder');

function rerankCandidates(candidates, queryText, options = {}) {
  if (!candidates || candidates.length === 0) return [];

  const topK = options.topK || 4;
  const queryTokens = tokenize(queryText);

  // Reciprocal Rank constant k
  const rrfK = 60;

  const reranked = candidates.map((cand, denseRank) => {
    const chunk = cand.chunk;
    const content = chunk.content.toLowerCase();

    // 1. Exact phrase match bonus
    let exactPhraseBonus = 0;
    const cleanQuery = queryText.toLowerCase().trim();
    if (cleanQuery.length > 5 && content.includes(cleanQuery)) {
      exactPhraseBonus = 0.25;
    }

    // 2. Token coverage score (ratio of query tokens present in passage)
    let matchedTokenCount = 0;
    for (const qToken of queryTokens) {
      if (content.includes(qToken)) {
        matchedTokenCount++;
      }
    }
    const tokenCoverage = queryTokens.length > 0 ? (matchedTokenCount / queryTokens.length) : 0;

    // 3. Document type authority weight
    let authorityWeight = 1.0;
    const docType = (chunk.document_type || '').toLowerCase();
    if (docType.includes('charter') || docType.includes('bylaw') || docType.includes('act')) {
      authorityWeight = 1.15;
    } else if (docType.includes('sop') || docType.includes('policy')) {
      authorityWeight = 1.10;
    }

    // 4. Combined RRF score
    const rrfScore = (1 / (rrfK + (denseRank + 1))) + (tokenCoverage * 0.4) + exactPhraseBonus;
    const finalScore = (cand.hybridScore * 0.6 + rrfScore * 0.4) * authorityWeight;

    return {
      chunk: cand.chunk,
      initialScore: cand.hybridScore,
      rerankScore: parseFloat(finalScore.toFixed(4)),
      tokenCoverage: parseFloat(tokenCoverage.toFixed(2)),
      exactPhraseBonus: exactPhraseBonus > 0,
      denseScore: cand.denseScore,
      sparseScore: cand.sparseScore
    };
  });

  // Sort descending by rerank score and filter out low-coverage noise
  const filtered = reranked.filter(r => {
    // If query has 3+ tokens, require at least 25% token coverage or an exact phrase match
    if (queryTokens.length >= 3 && r.tokenCoverage < 0.25 && !r.exactPhraseBonus) {
      return false;
    }
    return r.rerankScore >= 0.40;
  });

  filtered.sort((a, b) => b.rerankScore - a.rerankScore);

  return filtered.slice(0, topK);
}

module.exports = {
  rerankCandidates
};
