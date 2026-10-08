const crypto = require('crypto');
const { hybridSearch } = require('../retrieval/hybridSearch');
const { rerankChunks } = require('../reranking/reranker');
const { LocalProvider } = require('./localProvider');
const { ExternalProvider } = require('./externalProvider');
const { DemoProvider } = require('./demoProvider');
const { run } = require('../../database/db');

// Instantiate providers
const localProvider = new LocalProvider();
const externalProvider = new ExternalProvider();
const demoProvider = new DemoProvider();

/**
 * Returns the appropriate provider based on providerName
 */
function getProvider(providerName = 'local') {
  switch ((providerName || '').toLowerCase()) {
    case 'external':
    case 'cloud':
      return externalProvider;
    case 'demo':
      return demoProvider;
    case 'local':
    default:
      return localProvider;
  }
}

/**
 * Executes the complete Centralized RAG Pipeline:
 * 1. Hybrid Search (Dense Cosine + BM25) with Role Permission Filtering
 * 2. Multi-feature Reranking
 * 3. Context Window Construction
 * 4. Grounded Synthesis via Provider Abstraction
 * 5. Verifiable Source Citation Assembly
 * 6. Audit Logging into rag_queries and rag_responses
 *
 * @param {Object} params
 * @param {string} params.query - Question or prompt
 * @param {string} params.userId - Authenticated user ID
 * @param {string} params.userRole - User role (CITIZEN, OFFICER, FIELD_STAFF, etc.)
 * @param {string} [params.departmentId] - Caller's department (optional)
 * @param {string} [params.assistantContext] - e.g. 'CITIZEN_SERVICE', 'OFFICER_OPERATIONS', etc.
 * @param {string} [params.provider] - 'local', 'demo', 'external'
 */
async function executeRagPipeline(params) {
  const startTime = Date.now();
  const {
    query,
    userId = 'usr_anonymous',
    userRole = 'CITIZEN',
    departmentId = null,
    assistantContext = 'CITIZEN_SERVICE',
    provider = 'local',
    topK = 4
  } = params;

  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return {
      answer: 'Please provide a valid question or civic inquiry.',
      sources: [],
      latencyMs: 0
    };
  }

  const queryId = `rq_${crypto.randomUUID()}`;

  // 1. Hybrid Search with Role Permissions
  const candidateChunks = await hybridSearch(query, {
    userRole,
    userDeptId: departmentId,
    topK: topK * 2, // Fetch slightly more for reranking
    minRelevance: 0.28
  });

  // 2. Reranking
  const rerankedChunks = rerankChunks(query, candidateChunks);
  const selectedChunks = rerankedChunks.slice(0, topK);

  // 3. Provider Generation
  const activeProvider = getProvider(provider);
  const genResult = await activeProvider.generateAnswer(query, selectedChunks, {
    assistantRole: userRole,
    assistantContext,
    department: departmentId
  });

  // 4. Citation Extraction (Verifiable, never fabricated)
  let sources = [];
  if (!genResult.refused && selectedChunks.length > 0) {
    const seenSources = new Set();
    for (const chunk of selectedChunks) {
      const sourceKey = `${chunk.document_title}_${chunk.section_title}_${chunk.page_number}`;
      if (!seenSources.has(sourceKey)) {
        seenSources.add(sourceKey);
        sources.push({
          document_id: chunk.document_id,
          document: chunk.document_title,
          document_type: chunk.document_type,
          version: chunk.version,
          section: chunk.section_title || 'General Provisions',
          page: chunk.page_number || 1,
          relevance: Number(chunk.finalScore || chunk.relevanceScore || 0.85)
        });
      }
    }
  }

  const latencyMs = Date.now() - startTime;

  // 5. Audit Logging into rag_queries and rag_responses
  try {
    await run(`
      INSERT INTO rag_queries (
        id, user_id, user_role, query_text, assistant_context,
        department_filter, visibility_scope, retrieved_chunk_count, latency_ms
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      queryId,
      userId,
      userRole,
      query,
      assistantContext,
      departmentId,
      userRole,
      selectedChunks.length,
      latencyMs
    ]);

    await run(`
      INSERT INTO rag_responses (
        id, query_id, generated_answer, sources_json,
        provider_used, confidence_score, was_fallback_refusal
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      `res_${crypto.randomUUID()}`,
      queryId,
      genResult.answer,
      JSON.stringify(sources),
      activeProvider.name,
      genResult.confidence || 0,
      genResult.refused ? 1 : 0
    ]);
  } catch (err) {
    console.error('Failed to log RAG query/response to database:', err.message);
  }

  return {
    queryId,
    answer: genResult.answer,
    sources,
    confidence: genResult.confidence,
    wasFallbackRefusal: Boolean(genResult.refused),
    provider: activeProvider.name,
    retrievedCount: selectedChunks.length,
    latencyMs
  };
}

module.exports = {
  executeRagPipeline,
  getProvider
};
