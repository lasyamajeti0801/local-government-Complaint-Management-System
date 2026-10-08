const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

/**
 * Extracts raw text and page demarcations from supported document formats:
 * PDF, DOCX, TXT, MD
 */
async function extractText(filePath, fileType) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Document file not found at path: ${filePath}`);
  }

  const normalizedType = (fileType || path.extname(filePath).replace('.', '')).toUpperCase();

  switch (normalizedType) {
    case 'PDF': {
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      
      // Attempt to split pages by form feed (\f) if available, otherwise estimate
      let pages = pdfData.text.split('\f').filter(p => p.trim().length > 0);
      if (pages.length === 0) {
        pages = [pdfData.text];
      }

      return {
        text: pdfData.text,
        pageCount: pdfData.numpages || pages.length || 1,
        pages: pages.map((pageText, idx) => ({
          pageNumber: idx + 1,
          content: pageText
        })),
        info: pdfData.info || {}
      };
    }

    case 'DOCX': {
      const result = await mammoth.extractRawText({ path: filePath });
      const rawText = result.value;
      // Estimate pages roughly 2000 characters per page
      const estimatedPages = Math.max(1, Math.ceil(rawText.length / 2000));
      const pages = [];
      for (let i = 0; i < estimatedPages; i++) {
        pages.push({
          pageNumber: i + 1,
          content: rawText.slice(i * 2000, (i + 1) * 2000)
        });
      }

      return {
        text: rawText,
        pageCount: estimatedPages,
        pages,
        messages: result.messages
      };
    }

    case 'TXT':
    case 'MD': {
      const content = fs.readFileSync(filePath, 'utf-8');
      // For Markdown/Text, detect page breaks or split by major chapters/sections or character length
      const rawPages = content.split(/---page-break---|<!-- pagebreak -->/i);
      let pages;
      if (rawPages.length > 1) {
        pages = rawPages.map((p, idx) => ({ pageNumber: idx + 1, content: p.trim() }));
      } else {
        const estimatedPages = Math.max(1, Math.ceil(content.length / 2200));
        pages = [];
        for (let i = 0; i < estimatedPages; i++) {
          pages.push({
            pageNumber: i + 1,
            content: content.slice(i * 2200, (i + 1) * 2200)
          });
        }
      }

      return {
        text: content,
        pageCount: pages.length,
        pages
      };
    }

    default:
      throw new Error(`Unsupported document format '${normalizedType}'. Supported: PDF, DOCX, TXT, MD`);
  }
}

module.exports = { extractText };
