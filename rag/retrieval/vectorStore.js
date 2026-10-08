const { query, run } = require('../../database/db');
const { defaultVectorizer } = require('../embeddings/vectorizer');

class VectorStore {
  constructor() {
    this.chunksIndex = [];
    this.isInitialized = false;
  }

  /**
   * Loads all active document chunks from the database into the memory index.
   */
  async initialize() {
    try {
      const rows = await query(`
        SELECT 
          c.id,
          c.document_id,
          c.chunk_index,
          c.section_title,
          c.page_number,
          c.content,
          c.token_count,
          c.visibility,
          c.department_id,
          c.embedding_json,
          c.metadata_json,
          d.title as doc_title,
          d.document_type,
          d.version as doc_version,
          d.status as doc_status
        FROM document_chunks c
        JOIN documents d ON c.document_id = d.id
        WHERE d.status = 'ACTIVE'
        ORDER BY c.document_id, c.chunk_index ASC
      `);

      this.chunksIndex = rows.map(r => {
        let embedding = null;
        if (r.embedding_json) {
          try {
            embedding = JSON.parse(r.embedding_json);
          } catch (e) {
            embedding = null;
          }
        }
        if (!embedding || embedding.length === 0) {
          embedding = defaultVectorizer.embed(r.content);
        }

        let metadata = {};
        if (r.metadata_json) {
          try {
            metadata = JSON.parse(r.metadata_json);
          } catch (e) {
            metadata = {};
          }
        }

        return {
          id: r.id,
          document_id: r.document_id,
          doc_title: r.doc_title,
          document_type: r.document_type,
          doc_version: r.doc_version,
          chunk_index: r.chunk_index,
          section_title: r.section_title || 'General',
          page_number: r.page_number || 1,
          content: r.content,
          token_count: r.token_count,
          visibility: r.visibility,
          department_id: r.department_id,
          embedding,
          metadata
        };
      });

      this.isInitialized = true;
      return this.chunksIndex.length;
    } catch (err) {
      console.error('Error initializing VectorStore:', err);
      return 0;
    }
  }

  /**
   * Adds new chunks to the database and syncs the in-memory index.
   */
  async addChunks(chunks) {
    if (!chunks || chunks.length === 0) return;

    for (const chk of chunks) {
      const embedding = chk.embedding || defaultVectorizer.embed(chk.content);
      const embeddingJson = JSON.stringify(embedding);
      const metadataJson = JSON.stringify(chk.metadata || {});

      await run(`
        INSERT OR REPLACE INTO document_chunks (
          id, document_id, chunk_index, section_title, page_number,
          content, token_count, visibility, department_id, embedding_json, metadata_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        chk.id,
        chk.document_id,
        chk.chunk_index,
        chk.section_title,
        chk.page_number,
        chk.content,
        chk.token_count,
        chk.visibility,
        chk.department_id,
        embeddingJson,
        metadataJson
      ]);

      // Push into local memory index
      this.chunksIndex.push({
        id: chk.id,
        document_id: chk.document_id,
        doc_title: chk.metadata ? chk.metadata.title : 'Document',
        document_type: chk.metadata ? chk.metadata.document_type : 'SOP',
        doc_version: chk.metadata ? chk.metadata.version : '1.0',
        chunk_index: chk.chunk_index,
        section_title: chk.section_title || 'General',
        page_number: chk.page_number || 1,
        content: chk.content,
        token_count: chk.token_count,
        visibility: chk.visibility,
        department_id: chk.department_id,
        embedding,
        metadata: chk.metadata || {}
      });
    }
  }

  /**
   * Removes chunks when a document is deleted.
   */
  async deleteChunksByDocumentId(documentId) {
    await run(`DELETE FROM document_chunks WHERE document_id = ?`, [documentId]);
    this.chunksIndex = this.chunksIndex.filter(c => c.document_id !== documentId);
  }

  /**
   * Returns current active chunk count and document count.
   */
  getStats() {
    const uniqueDocs = new Set(this.chunksIndex.map(c => c.document_id)).size;
    return {
      totalChunks: this.chunksIndex.length,
      totalDocuments: uniqueDocs,
      vectorDimensions: 128
    };
  }

  getAllChunks() {
    return this.chunksIndex;
  }
}

const vectorStore = new VectorStore();

module.exports = {
  VectorStore,
  vectorStore
};
