/**
 * Nagar Connect RAG - Hybrid Vector Store & In-Memory Retrieval Index
 * Performs Hybrid Search (Dense Cosine Vectors + Sparse BM25 Keyword Scoring)
 */
const { generateEmbedding, cosineSimilarity, tokenize } = require('../embeddings/embedder');
const { filterChunksByRole } = require('./permissionFilter');
const { query: dbQuery, run: dbRun } = require('../../database/db');

class VectorStore {
  constructor() {
    this.chunks = []; // In-memory cached chunks with precalculated embeddings
    this.isInitialized = false;
  }

  /**
   * Load and index all chunks from SQLite database
   */
  async initialize() {
    try {
      const rows = await dbQuery(`
        SELECT 
          c.id, c.chunk_id, c.document_id, c.chunk_index, c.content, c.token_count,
          c.page_number, c.section, c.visibility, c.embedding_json,
          d.title, d.department, d.document_type, d.version
        FROM document_chunks c
        JOIN documents d ON c.document_id = d.id
        WHERE d.status = 'INDEXED'
      `);

      this.chunks = rows.map(r => {
        let embedding = null;
        if (r.embedding_json) {
          try {
            embedding = JSON.parse(r.embedding_json);
          } catch (e) {
            embedding = null;
          }
        }
        if (!embedding) {
          embedding = generateEmbedding(r.content);
        }

        return {
          id: r.id,
          chunk_id: r.chunk_id,
          document_id: r.document_id,
          title: r.title,
          department: r.department,
          document_type: r.document_type,
          version: r.version,
          chunk_index: r.chunk_index,
          content: r.content,
          token_count: r.token_count,
          page_number: r.page_number,
          section: r.section,
          visibility: r.visibility,
          embedding
        };
      });

      this.isInitialized = true;
      console.log(`🏛️ RAG Vector Store initialized with ${this.chunks.length} active chunks.`);
      return this.chunks.length;
    } catch (err) {
      console.error('❌ Failed to initialize RAG Vector Store:', err.message);
      this.chunks = [];
      return 0;
    }
  }

  /**
   * Add new chunks into the vector store in-memory and database
   */
  async addChunks(newChunks) {
    for (const chk of newChunks) {
      if (!chk.embedding) {
        chk.embedding = generateEmbedding(chk.content);
      }
      this.chunks.push(chk);
    }
  }

  /**
   * Remove chunks for a deleted document
   */
  removeDocumentChunks(documentId) {
    this.chunks = this.chunks.filter(c => c.document_id !== documentId);
  }

  /**
   * Calculate BM25-style keyword matching score
   */
  calculateBM25Score(queryTokens, chunkContent) {
    if (!queryTokens || queryTokens.length === 0) return 0;
    const chunkTokens = tokenize(chunkContent);
    if (chunkTokens.length === 0) return 0;

    const chunkTf = {};
    chunkTokens.forEach(t => {
      chunkTf[t] = (chunkTf[t] || 0) + 1;
    });

    let score = 0;
    const k1 = 1.2;
    const b = 0.75;
    const avgDocLen = 80;
    const docLen = chunkTokens.length;

    for (const qToken of queryTokens) {
      if (chunkTf[qToken]) {
        const tf = chunkTf[qToken];
        // IDF approximation
        const idf = Math.log(1 + (this.chunks.length + 1) / (1 + (chunkTf[qToken] ? 1 : 0)));
        const numerator = tf * (k1 + 1);
        const denominator = tf + k1 * (1 - b + b * (docLen / avgDocLen));
        score += idf * (numerator / denominator);
      }
    }

    return Math.min(1.0, score / 4.0); // Normalize to 0..1 scale
  }

  /**
   * Perform Hybrid Search: Dense Cosine Similarity + Sparse BM25 Keyword Search
   */
  async hybridSearch(queryText, options = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const {
      userRole = 'CITIZEN',
      departmentFilter = null,
      topK = 5,
      denseWeight = 0.65,
      sparseWeight = 0.35,
      minScoreThreshold = 0.20
    } = options;

    // 1. Role-based permission filtering
    const accessibleChunks = filterChunksByRole(this.chunks, userRole, departmentFilter);

    if (accessibleChunks.length === 0) {
      return [];
    }

    // 2. Generate query embedding and query tokens
    const queryEmbedding = generateEmbedding(queryText);
    const queryTokens = tokenize(queryText);

    // 3. Score each chunk
    const scoredResults = accessibleChunks.map(chunk => {
      const denseScore = cosineSimilarity(queryEmbedding, chunk.embedding);
      const sparseScore = this.calculateBM25Score(queryTokens, chunk.content);

      // If no keyword match exists and dense similarity is modest, consider chunk irrelevant
      if (sparseScore <= 0.01 && denseScore < 0.60) {
        return null;
      }

      // Section title boost if section matches query keywords
      let sectionBoost = 0;
      if (chunk.section && queryTokens.some(t => chunk.section.toLowerCase().includes(t))) {
        sectionBoost = 0.20;
      }

      // Hybrid combined score
      const hybridScore = (denseScore * denseWeight) + (sparseScore * sparseWeight) + sectionBoost;

      return {
        chunk,
        denseScore: parseFloat(denseScore.toFixed(4)),
        sparseScore: parseFloat(sparseScore.toFixed(4)),
        hybridScore: parseFloat(hybridScore.toFixed(4))
      };
    }).filter(Boolean);

    // 4. Sort descending by hybrid score and filter by threshold
    const filtered = scoredResults
      .filter(res => res.hybridScore >= 0.40)
      .sort((a, b) => b.hybridScore - a.hybridScore);

    return filtered.slice(0, topK);
  }
}

// Singleton vector store instance
const vectorStoreInstance = new VectorStore();

module.exports = {
  VectorStore,
  vectorStore: vectorStoreInstance
};
