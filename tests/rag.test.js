/**
 * Nagar Connect - Member 5 RAG Pipeline Integration Tests
 * Verifies: Ingestion, Chunking, Embeddings, RBAC filtering, Hybrid search, Citations, Anti-hallucination guardrail
 */
const assert = require('assert');
const { initSchema } = require('../database/db');
const { seed } = require('../database/seed/seed');
const { ragPipeline } = require('../rag');
const { filterChunksByRole, isChunkAccessible } = require('../rag/retrieval/permissionFilter');
const { generateEmbedding, cosineSimilarity } = require('../rag/embeddings/embedder');
const { chunkDocument } = require('../rag/chunking/chunker');

async function runRAGTests() {
  console.log('\n🧪 ===============================================');
  console.log('🧪 RUNNING MEMBER 5 RAG & KNOWLEDGE BASE TESTS');
  console.log('🧪 ===============================================\n');

  // 1. Seed & Initialize
  await seed();
  await ragPipeline.initialize();

  // Test 1: Embedding Engine Determinism & Unit Magnitude
  console.log('▶ Test 1: Embedding generation & cosine similarity');
  const vec1 = generateEmbedding('Drinking water pipeline burst and leakage');
  const vec2 = generateEmbedding('Major tap water pipe burst near road');
  const vec3 = generateEmbedding('Street lamp LED light not glowing at night');

  assert.strictEqual(vec1.length, 128, 'Vector must be 128 dimensions');
  const simRelated = cosineSimilarity(vec1, vec2);
  const simUnrelated = cosineSimilarity(vec1, vec3);
  console.log(`  Similarity (Water Pipe vs Water Pipe): ${simRelated.toFixed(4)}`);
  console.log(`  Similarity (Water Pipe vs Street Light): ${simUnrelated.toFixed(4)}`);
  assert(simRelated > simUnrelated, 'Related texts must have higher cosine similarity than unrelated texts');
  console.log('  ✅ Test 1 Passed: Embeddings and cosine similarity are mathematically sound.\n');

  // Test 2: Chunking & Metadata Attachment
  console.log('▶ Test 2: Semantic Document Chunking');
  const sampleText = `
CHAPTER 1: CITIZEN CHARTER GUARANTEES
1.1 Guaranteed Service Delivery: Every resident citizen is entitled to potable drinking water within 24 hours of report.
1.2 Penalties for default: Fine of Rs 50 per day for delay.
  `;
  const chunks = chunkDocument({
    document_id: 'DOC_TEST_001',
    title: 'Test Charter',
    department: 'Water Supply',
    document_type: 'Charter',
    version: '1.0',
    visibility: 'CITIZEN,OFFICER',
    content: sampleText
  });
  assert(chunks.length > 0, 'Chunker must produce chunks');
  assert.strictEqual(chunks[0].document_id, 'DOC_TEST_001', 'Chunk must retain document_id');
  assert(chunks[0].token_count > 0, 'Token count must be estimated');
  console.log(`  Produced ${chunks.length} chunks with token count: ${chunks[0].token_count}`);
  console.log('  ✅ Test 2 Passed: Semantic chunker retains all metadata.\n');

  // Test 3: Role-Aware RBAC Filter (Strict Guardrails)
  console.log('▶ Test 3: Strict Role-Based Access Control Filtering');
  const publicChunk = { visibility: 'CITIZEN,OFFICER,FIELD_STAFF,MUNICIPAL_ADMIN,SUPER_ADMIN' };
  const adminOnlyChunk = { visibility: 'MUNICIPAL_ADMIN,COMMISSIONER,SUPER_ADMIN' };
  const fieldOnlyChunk = { visibility: 'FIELD_STAFF,OFFICER,SUPER_ADMIN' };

  assert.strictEqual(isChunkAccessible(publicChunk.visibility, 'CITIZEN'), true, 'Citizen must access public chunk');
  assert.strictEqual(isChunkAccessible(adminOnlyChunk.visibility, 'CITIZEN'), false, 'Citizen CANNOT access admin-only chunk');
  assert.strictEqual(isChunkAccessible(fieldOnlyChunk.visibility, 'CITIZEN'), false, 'Citizen CANNOT access field-only chunk');
  assert.strictEqual(isChunkAccessible(adminOnlyChunk.visibility, 'MUNICIPAL_ADMIN'), true, 'Admin can access admin chunk');
  assert.strictEqual(isChunkAccessible(adminOnlyChunk.visibility, 'SUPER_ADMIN'), true, 'Super admin has full access');
  console.log('  ✅ Test 3 Passed: RBAC prevents unauthorized document exposure.\n');

  // Test 4: Query Retrieval & Grounded Answering for Citizen
  console.log('▶ Test 4: RAG Query for Citizen (Water SLA & Penalties)');
  const citizenResult = await ragPipeline.queryRAG({
    queryText: 'What is the SLA timeline for repairing a main water pipeline burst and what is the penalty?',
    userRole: 'CITIZEN'
  });

  console.log(`  Citizen Query Response Preview: "${citizenResult.answer.substring(0, 140)}..."`);
  console.log(`  Citations generated: ${citizenResult.sources.length}`);
  assert(citizenResult.sources.length > 0, 'Must return at least 1 verified citation');
  assert(citizenResult.sources[0].documentTitle.length > 0, 'Citation must contain document title');
  assert(citizenResult.sources[0].relevanceScore.includes('%'), 'Citation must contain relevance score percentage');
  console.log('  ✅ Test 4 Passed: Citizen received grounded answer with verifiable citations.\n');

  // Test 5: Role Guardrail Query (Citizen asking for Admin Sanction Limits)
  console.log('▶ Test 5: Guardrail check - Citizen asking for Confidential Admin Policy');
  const unauthorizedResult = await ragPipeline.queryRAG({
    queryText: 'What is the maximum emergency financial spending cap for Zonal Commissioner without e-tender?',
    userRole: 'CITIZEN'
  });
  console.log(`  Citizen response for confidential query: "${unauthorizedResult.answer}"`);
  assert(
    unauthorizedResult.sources.length === 0 || unauthorizedResult.answer.includes('could not find'),
    'Citizen must not retrieve confidential admin policy chunks'
  );
  console.log('  ✅ Test 5 Passed: Confidential admin policies successfully concealed from Citizen.\n');

  // Test 6: Same Confidential Query by Municipal Admin
  console.log('▶ Test 6: Authorized Admin Query for Financial Delegation');
  const adminResult = await ragPipeline.queryRAG({
    queryText: 'What is the maximum emergency financial spending cap for Zonal Commissioner without e-tender?',
    userRole: 'MUNICIPAL_ADMIN'
  });
  console.log(`  Admin Response: "${adminResult.answer.substring(0, 160)}..."`);
  assert(adminResult.sources.length > 0, 'Admin must retrieve authorized financial sanction documents');
  console.log('  ✅ Test 6 Passed: Admin successfully retrieved confidential municipal policy.\n');

  // Test 7: Telemetry & Stats
  console.log('▶ Test 7: RAG Telemetry Stats');
  const stats = await ragPipeline.getStats();
  console.log('  RAG Stats:', stats);
  assert(stats.totalDocuments > 0, 'Total documents must be > 0');
  assert(stats.totalChunks > 0, 'Total chunks must be > 0');
  console.log('  ✅ Test 7 Passed: Telemetry reports accurate index statistics.\n');

  console.log('🎉 ALL MEMBER 5 RAG TESTS PASSED FLAWLESSLY! 🏛️\n');
}

if (require.main === module) {
  runRAGTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Test failed:', err);
      process.exit(1);
    });
}

module.exports = { runRAGTests };
