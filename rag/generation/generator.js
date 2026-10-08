/**
 * Nagar Connect RAG - Grounded Answer & Citation Generator
 * Generates verified answers with exact municipal citations and anti-hallucination guardrails
 */
const { getLLMProvider } = require('./llmProvider');

async function generateAnswer(queryText, retrievedChunks, options = {}) {
  const startTime = Date.now();
  const userRole = options.userRole || 'CITIZEN';

  // Guardrail 1: If no authorized chunks found
  if (!retrievedChunks || retrievedChunks.length === 0) {
    return {
      answer: 'I could not find this information in the authorized municipal knowledge base.',
      sources: [],
      metadata: {
        role: userRole,
        totalSourcesFound: 0,
        provider: 'LocalProvider',
        executionTimeMs: Date.now() - startTime
      }
    };
  }

  // Generate answer through provider abstraction
  const provider = getLLMProvider();
  const generationResult = await provider.generate(queryText, retrievedChunks, { userRole });

  // Build verifiable source citations
  const sources = retrievedChunks.map((item, index) => {
    const chk = item.chunk;
    const relevanceScore = Math.min(100, Math.max(10, Math.round((item.rerankScore || item.initialScore || 0.5) * 100)));

    // Short snippet extraction
    const snippetWords = chk.content.split(/\s+/).slice(0, 35).join(' ');
    const snippet = snippetWords.length < chk.content.length ? `${snippetWords}...` : snippetWords;

    return {
      sourceId: index + 1,
      chunkId: chk.chunk_id,
      documentId: chk.document_id,
      documentTitle: chk.title,
      department: chk.department,
      documentType: chk.document_type,
      version: chk.version,
      section: chk.section || 'General Overview',
      page: chk.page_number || 1,
      relevanceScore: `${relevanceScore}%`,
      relevanceNumeric: relevanceScore,
      snippet
    };
  });

  return {
    answer: generationResult.answer,
    sources,
    metadata: {
      role: userRole,
      totalSourcesFound: sources.length,
      provider: generationResult.provider,
      model: generationResult.model,
      tokensUsed: generationResult.tokensUsed,
      executionTimeMs: Date.now() - startTime
    }
  };
}

module.exports = {
  generateAnswer
};
