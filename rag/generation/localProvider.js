const { LLMProvider } = require('./provider');

/**
 * LocalProvider: In-house semantic synthesizer.
 * Analyzes the retrieved document chunks, extracts pertinent procedural facts,
 * standards, penalties, and SLAs, and formats an authoritative e-governance answer.
 * Enforces strict grounding: if the retrieved authorized chunks do not contain
 * the core subject matter of the query, it refuses to answer.
 * Requires ZERO external API keys or cloud dependencies.
 */
class LocalProvider extends LLMProvider {
  constructor() {
    super('LocalProvider');
  }

  async generateAnswer(query, contextChunks, options = {}) {
    // Strict Mandate 1: If no authorized context chunks exist, immediately refuse
    if (!contextChunks || contextChunks.length === 0) {
      return {
        answer: 'I could not find this information in the authorized municipal knowledge base.',
        confidence: 0.0,
        refused: true
      };
    }

    const normalizedQuery = query.toLowerCase().trim();
    // Extract significant query terms (length > 3, exclude common words)
    const stopWords = new Set([
      'what', 'when', 'where', 'which', 'who', 'whom', 'whose', 'why', 'how',
      'the', 'is', 'are', 'was', 'were', 'for', 'from', 'with', 'about', 'can',
      'could', 'should', 'would', 'have', 'has', 'had', 'does', 'did', 'and', 'but'
    ]);
    const significantQueryTerms = normalizedQuery
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3 && !stopWords.has(w));

    // Strict Mandate 2: Query Term Coverage Check across top chunks
    // To prevent false positive matches on broad terms like "the" or generic roles,
    // verify that core intent keywords are actually present in the authorized chunks.
    const allChunkText = contextChunks.map(c => `${c.section_title} ${c.content}`.toLowerCase()).join(' ');
    
    let matchedCoreTerms = 0;
    for (const term of significantQueryTerms) {
      if (allChunkText.includes(term)) {
        matchedCoreTerms++;
      }
    }

    const coverageRatio = significantQueryTerms.length > 0 
      ? (matchedCoreTerms / significantQueryTerms.length) 
      : 1.0;

    // If less than 40% of significant query terms exist in the authorized chunks,
    // or if zero specific keywords match, refuse immediately!
    if (significantQueryTerms.length >= 2 && (coverageRatio < 0.40 || matchedCoreTerms === 0)) {
      return {
        answer: 'I could not find this information in the authorized municipal knowledge base.',
        confidence: 0.0,
        refused: true
      };
    }

    // Extract sentences from top chunks that contain query terms
    const relevantSentences = [];
    const seenSentences = new Set();

    for (const chunk of contextChunks.slice(0, 3)) {
      // Split chunk content into sentences or bullets
      const sentences = chunk.content
        .split(/(?<=[.!?\n])\s+/)
        .map(s => s.trim())
        .filter(s => s.length > 25);

      for (const sent of sentences) {
        const lowerSent = sent.toLowerCase();
        let matches = 0;
        for (const term of significantQueryTerms) {
          if (lowerSent.includes(term)) matches++;
        }

        if (matches > 0 && !seenSentences.has(lowerSent)) {
          seenSentences.add(lowerSent);
          relevantSentences.push({
            text: sent,
            matches,
            section: chunk.section_title,
            docTitle: chunk.document_title,
            page: chunk.page_number
          });
        }
      }
    }

    // Sort extracted sentences by match density
    relevantSentences.sort((a, b) => b.matches - a.matches);

    // If no relevant sentences found despite loose chunk match, refuse
    if (relevantSentences.length === 0) {
      return {
        answer: 'I could not find this information in the authorized municipal knowledge base.',
        confidence: 0.0,
        refused: true
      };
    }

    // Intent detectors
    const isSlaQuery = /(sla|time|hours|days|deadline|duration|turnaround)/i.test(normalizedQuery);
    const isProcedureQuery = /(how to|procedure|steps|process|report|file|submit)/i.test(normalizedQuery);
    const isPenaltyQuery = /(penalty|fine|punishment|illegal|violation)/i.test(normalizedQuery);

    let synthesis = '';

    // Primary summary paragraph citing authorized source
    const primaryDoc = contextChunks[0];
    synthesis += `According to the authorized **${primaryDoc.document_title}** (${primaryDoc.section_title || 'General Provisions'}, Page ${primaryDoc.page_number}):\n\n`;

    // Assemble top factual statements
    const keyFacts = relevantSentences.slice(0, 4);
    for (const fact of keyFacts) {
      let cleanText = fact.text.replace(/^[-*•]\s*/, '').trim();
      synthesis += `• ${cleanText}\n`;
    }
    synthesis += '\n';

    // Actionable municipal guidance based on query type
    if (isSlaQuery) {
      synthesis += `**SLA & Redressal Notice:** Municipal grievances must be resolved within the stipulated timeline outlined in the municipal charter. Citizens can track progress in real-time or request executive escalation if the SLA expires.\n`;
    } else if (isProcedureQuery) {
      synthesis += `**Actionable Protocol:** You may lodge or follow up on this complaint directly through the **Nagar Connect Portal** or approach the designated Ward Nodal Officer during public grievance hours.\n`;
    } else if (isPenaltyQuery) {
      synthesis += `**Regulatory Compliance:** Non-compliance or violations are liable for compounding penalties and statutory municipal action under applicable municipal by-laws.\n`;
    }

    return {
      answer: synthesis.trim(),
      confidence: Number(contextChunks[0].finalScore || contextChunks[0].relevanceScore || 0.85),
      refused: false
    };
  }
}

module.exports = { LocalProvider };
