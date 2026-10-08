/**
 * Nagar Connect RAG - Multi-format Document Text Extractor
 * Supports PDF, DOCX, TXT, MD, JSON
 */
const fs = require('fs');
const path = require('path');
const { cleanText } = require('./cleaner');

async function extractTextFromFile(filePath, mimeTypeOrExt) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found at path: ${filePath}`);
  }

  const ext = (mimeTypeOrExt || path.extname(filePath)).toLowerCase().replace('.', '');
  let extractedText = '';
  let metadata = {
    fileSize: fs.statSync(filePath).size,
    extension: ext,
    pageCount: 1
  };

  try {
    switch (ext) {
      case 'pdf': {
        const pdfParse = require('pdf-parse');
        const dataBuffer = fs.readFileSync(filePath);
        const pdfData = await pdfParse(dataBuffer);
        extractedText = pdfData.text;
        metadata.pageCount = pdfData.numpages || 1;
        break;
      }

      case 'docx':
      case 'doc': {
        const mammoth = require('mammoth');
        const result = await mammoth.extractRawText({ path: filePath });
        extractedText = result.value;
        break;
      }

      case 'json': {
        const jsonContent = fs.readFileSync(filePath, 'utf8');
        const parsed = JSON.parse(jsonContent);
        extractedText = typeof parsed === 'string' ? parsed : JSON.stringify(parsed, null, 2);
        break;
      }

      case 'txt':
      case 'md':
      case 'markdown':
      case 'csv':
      default: {
        extractedText = fs.readFileSync(filePath, 'utf8');
        break;
      }
    }

    const cleaned = cleanText(extractedText);
    return {
      text: cleaned,
      metadata
    };
  } catch (err) {
    console.error(`Error extracting text from ${filePath} (${ext}):`, err);
    throw new Error(`Text extraction failed: ${err.message}`);
  }
}

module.exports = {
  extractTextFromFile
};
