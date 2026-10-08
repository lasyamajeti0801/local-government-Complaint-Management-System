/**
 * Nagar Connect RAG - Document Text Cleaning & Normalization
 */

function cleanText(rawText) {
  if (!rawText || typeof rawText !== 'string') return '';

  return rawText
    // Replace non-standard whitespace / carriage returns
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Remove control characters except newline and tab
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Normalize unicode spaces
    .replace(/[\u00A0\u1680\u180E\u2000-\u200B\u202F\u205F\u3000\uFEFF]/g, ' ')
    // Collapse excessive consecutive blank lines into max 2
    .replace(/\n{3,}/g, '\n\n')
    // Trim leading and trailing spaces per line
    .split('\n')
    .map(line => line.trim())
    .join('\n')
    .trim();
}

/**
 * Identify section headers from document text
 */
function extractSections(text) {
  const lines = text.split('\n');
  const sections = [];
  let currentSectionTitle = 'General';
  let currentSectionContent = [];

  // Regex patterns matching headers like: "CHAPTER 1:", "1.1 Title", "SECTION A:", "### Heading"
  const headerPattern = /^(?:(?:CHAPTER|SECTION|MODULE|ARTICLE|RULE)\s+[A-Z0-9.\-_:]+|(?:\d+\.)+\d*\s+[A-Z]|#{1,4}\s+[A-Z0-9])/i;

  for (const line of lines) {
    if (headerPattern.test(line.trim()) && line.trim().length < 120) {
      if (currentSectionContent.length > 0) {
        sections.push({
          title: currentSectionTitle,
          content: currentSectionContent.join('\n').trim()
        });
        currentSectionContent = [];
      }
      currentSectionTitle = line.trim().replace(/^#+\s*/, '');
    } else {
      currentSectionContent.push(line);
    }
  }

  if (currentSectionContent.length > 0) {
    sections.push({
      title: currentSectionTitle,
      content: currentSectionContent.join('\n').trim()
    });
  }

  return sections.length > 0 ? sections : [{ title: 'Overview', content: text }];
}

module.exports = {
  cleanText,
  extractSections
};
