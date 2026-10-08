/**
 * Cleans extracted municipal text while preserving section markers,
 * legal provisions, headings, and structured lists.
 */
function cleanText(rawText) {
  if (!rawText || typeof rawText !== 'string') return '';

  return rawText
    // Replace non-breaking spaces and zero-width spaces
    .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, ' ')
    // Replace carriage returns with standard newlines
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Remove null bytes and unusual control characters
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Normalize repeated horizontal whitespace
    .replace(/[ \t]+/g, ' ')
    // Normalize excessive consecutive blank lines (limit to max 2)
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Extracts potential section titles or headings from a text block
 */
function detectSectionTitle(chunkText) {
  const lines = chunkText.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    // Check for markdown headers (# Title, ## Section)
    if (/^#{1,4}\s+(.+)$/.test(trimmed)) {
      return trimmed.replace(/^#{1,4}\s+/, '').trim();
    }
    // Check for legal/SOP section headings like "SECTION 3.2", "ARTICLE IV", "POLICY CLAUSE"
    if (/^(SECTION|ARTICLE|CLAUSE|POLICY|PROCEDURE|RULE|CHAPTER)\s+[\w\.\-]+/i.test(trimmed)) {
      return trimmed;
    }
  }
  // Fallback to first line if reasonably short (< 80 chars) and does not end with full stop
  if (lines.length > 0 && lines[0].length < 80 && !lines[0].endsWith('.')) {
    return lines[0].trim();
  }
  return 'General Provisions';
}

module.exports = {
  cleanText,
  detectSectionTitle
};
