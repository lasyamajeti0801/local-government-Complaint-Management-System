/**
 * Reranking engine for retrieved RAG candidates.
 * Re-scores candidate chunks using cross-feature analysis:
 * - Exact sub-phrase presence
 * - Information density (actionable steps, SLAs, numbers)
 * - Section header alignment
 */
function rerankChunks(queryText, candidateChunks, options = {}) {
  if (!candidateChunks || candidateChunks.length === 0) {
    return [];
  }

  const normalizedQuery = queryText.toLowerCase().trim();
  const queryWords = normalizedQuery.split(/\s+/).filter(w => w.length > 2);

  const reranked = candidateChunks.map(chunk => {
    let score = chunk.relevanceScore;
    const lowerContent = chunk.content.toLowerCase();
    const lowerSection = (chunk.section_title || '').toLowerCase();

    // 1. Exact Full Phrase Bonus (e.g. "pothole repair", "water leakage")
    if (lowerContent.includes(normalizedQuery)) {
      score += 0.20;
    }

    // 2. Section Title Match Bonus
    for (const word of queryWords) {
      if (lowerSection.includes(word)) {
        score += 0.12;
      }
    }

    // 3. Information Density Bonus (Presence of SLAs, timelines, hours, statutory references)
    if (/(sla|hours|days|procedure|step\s+\d|penalt|fine|contact|section|annexure)/i.test(chunk.content)) {
      score += 0.08;
    }

    // 4. Exact Word Coverage Ratio
    const matchedWords = queryWords.filter(w => lowerContent.includes(w));
    const coverageRatio = queryWords.length > 0 ? (matchedWords.length / queryWords.length) : 0;
    score += coverageRatio * 0.15;

    return {
      ...chunk,
      finalScore: Number(Math.min(1.0, Math.max(0.0, score)).toFixed(4))
    };
  });

  // Sort by final reranked score descending
  reranked.sort((a, b) => b.finalScore - a.finalScore);

  return reranked;
}

module.exports = { rerankChunks };
