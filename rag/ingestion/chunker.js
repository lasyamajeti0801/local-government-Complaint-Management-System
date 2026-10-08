const { cleanText, detectSectionTitle } = require('./textCleaner');

/**
 * Splits extracted document pages into semantic chunks with overlap,
 * preserving page boundaries, headings, and attaching comprehensive metadata.
 *
 * @param {Array<{pageNumber: number, content: string}>} pages
 * @param {Object} docMetadata - { document_id, department_id, visibility, document_type, title }
 * @param {Object} options - { chunkSize: 900, chunkOverlap: 180 }
 */
function createChunks(pages, docMetadata = {}, options = {}) {
  const chunkSize = options.chunkSize || 1000;
  const chunkOverlap = options.chunkOverlap || 200;

  const chunks = [];
  let chunkGlobalIndex = 0;
  let currentSection = docMetadata.title || 'General';

  for (const page of pages) {
    const cleanedPageText = cleanText(page.content);
    if (!cleanedPageText) continue;

    // Check if page introduces a new section
    const detected = detectSectionTitle(cleanedPageText);
    if (detected && detected !== 'General Provisions') {
      currentSection = detected;
    }

    // Split page text into overlapping windows
    let startIdx = 0;
    while (startIdx < cleanedPageText.length) {
      let endIdx = startIdx + chunkSize;

      // Try to break at paragraph boundary, sentence end, or newline
      if (endIdx < cleanedPageText.length) {
        const nextBreak = cleanedPageText.indexOf('\n\n', endIdx - 100);
        if (nextBreak !== -1 && nextBreak <= endIdx + 150) {
          endIdx = nextBreak + 2;
        } else {
          const nextPeriod = cleanedPageText.indexOf('. ', endIdx - 80);
          if (nextPeriod !== -1 && nextPeriod <= endIdx + 100) {
            endIdx = nextPeriod + 2;
          }
        }
      } else {
        endIdx = cleanedPageText.length;
      }

      const chunkSlice = cleanedPageText.substring(startIdx, endIdx).trim();

      if (chunkSlice.length > 50) {
        // Recalculate section for this specific chunk if it contains a header
        const localSection = detectSectionTitle(chunkSlice);
        const effectiveSection = (localSection && localSection !== 'General Provisions') 
          ? localSection 
          : currentSection;

        // Estimate tokens (roughly 1 token per 4 chars)
        const tokenEstimate = Math.ceil(chunkSlice.length / 4);

        chunks.push({
          id: `chk_${docMetadata.document_id || 'doc'}_${chunkGlobalIndex + 1}`,
          document_id: docMetadata.document_id,
          chunk_index: chunkGlobalIndex,
          section_title: effectiveSection,
          page_number: page.pageNumber || 1,
          content: chunkSlice,
          token_count: tokenEstimate,
          visibility: docMetadata.visibility || 'PUBLIC',
          department_id: docMetadata.department_id || null,
          metadata: {
            title: docMetadata.title,
            document_type: docMetadata.document_type,
            version: docMetadata.version || '1.0',
            effective_date: docMetadata.effective_date,
            language: docMetadata.language || 'en'
          }
        });

        chunkGlobalIndex++;
      }

      if (endIdx >= cleanedPageText.length) {
        break;
      }

      // Advance with overlap
      startIdx = Math.max(startIdx + 1, endIdx - chunkOverlap);
    }
  }

  return chunks;
}

module.exports = { createChunks };
