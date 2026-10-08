/**
 * Nagar Connect RAG - Semantic & Sliding Window Chunker
 * Chunks text by logical sections, paragraphs, and sliding token windows with metadata
 */
const { extractSections } = require('../ingestion/cleaner');

function estimateTokenCount(text) {
  if (!text) return 0;
  // Approximation: ~1.3 tokens per word for English / technical domain
  const words = text.trim().split(/\s+/).filter(Boolean);
  return Math.ceil(words.length * 1.3);
}

function chunkDocument(docData, options = {}) {
  const {
    document_id,
    title,
    department,
    document_type,
    version,
    visibility,
    content
  } = docData;

  const maxChunkSizeWords = options.maxChunkSizeWords || 120;
  const overlapWords = options.overlapWords || 25;

  const sections = extractSections(content);
  const chunks = [];
  let globalChunkIndex = 0;

  for (let sIdx = 0; sIdx < sections.length; sIdx++) {
    const section = sections[sIdx];
    const paragraphs = section.content.split(/\n\s*\n/).filter(p => p.trim().length > 0);

    let currentBufferWords = [];

    for (const para of paragraphs) {
      const paraWords = para.trim().split(/\s+/).filter(Boolean);

      if (currentBufferWords.length + paraWords.length <= maxChunkSizeWords) {
        currentBufferWords.push(...paraWords);
      } else {
        if (currentBufferWords.length > 0) {
          const chunkText = currentBufferWords.join(' ');
          globalChunkIndex++;
          chunks.push({
            chunk_id: `CHK_${document_id}_${String(globalChunkIndex).padStart(3, '0')}`,
            document_id,
            title,
            department,
            document_type,
            version,
            chunk_index: globalChunkIndex,
            content: chunkText,
            token_count: estimateTokenCount(chunkText),
            page_number: Math.max(1, Math.ceil(globalChunkIndex / 3)),
            section: section.title,
            visibility
          });

          // Sliding window overlap
          currentBufferWords = currentBufferWords.slice(-overlapWords);
        }

        // If single paragraph is itself longer than maxChunkSizeWords, split it in pieces
        let remainingParaWords = paraWords;
        while (remainingParaWords.length > maxChunkSizeWords) {
          const slice = remainingParaWords.slice(0, maxChunkSizeWords);
          globalChunkIndex++;
          const chunkText = slice.join(' ');
          chunks.push({
            chunk_id: `CHK_${document_id}_${String(globalChunkIndex).padStart(3, '0')}`,
            document_id,
            title,
            department,
            document_type,
            version,
            chunk_index: globalChunkIndex,
            content: chunkText,
            token_count: estimateTokenCount(chunkText),
            page_number: Math.max(1, Math.ceil(globalChunkIndex / 3)),
            section: section.title,
            visibility
          });
          remainingParaWords = remainingParaWords.slice(maxChunkSizeWords - overlapWords);
        }

        currentBufferWords = remainingParaWords;
      }
    }

    if (currentBufferWords.length > 0) {
      const chunkText = currentBufferWords.join(' ');
      globalChunkIndex++;
      chunks.push({
        chunk_id: `CHK_${document_id}_${String(globalChunkIndex).padStart(3, '0')}`,
        document_id,
        title,
        department,
        document_type,
        version,
        chunk_index: globalChunkIndex,
        content: chunkText,
        token_count: estimateTokenCount(chunkText),
        page_number: Math.max(1, Math.ceil(globalChunkIndex / 3)),
        section: section.title,
        visibility
      });
    }
  }

  return chunks;
}

module.exports = {
  estimateTokenCount,
  chunkDocument
};
