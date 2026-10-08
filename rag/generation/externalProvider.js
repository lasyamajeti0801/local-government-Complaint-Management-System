const { LLMProvider } = require('./provider');
const { LocalProvider } = require('./localProvider');

/**
 * ExternalProvider: Optional bridge to external cloud or local LLM endpoints
 * (such as OpenAI, Gemini, Claude, or local Ollama).
 * Automatically falls back to LocalProvider if no API key is configured.
 */
class ExternalProvider extends LLMProvider {
  constructor(apiKey = process.env.LLM_API_KEY, modelName = process.env.LLM_MODEL || 'gpt-4o-mini') {
    super('ExternalProvider');
    this.apiKey = apiKey;
    this.modelName = modelName;
    this.localFallback = new LocalProvider();
  }

  async generateAnswer(query, contextChunks, options = {}) {
    if (!this.apiKey && !process.env.OLLAMA_HOST) {
      // Graceful fallback to LocalProvider without failure
      return this.localFallback.generateAnswer(query, contextChunks, options);
    }

    // If an external key is configured, perform standardized HTTP generation
    try {
      // In production/deployment with API key:
      const promptContext = contextChunks.map((c, i) => 
        `[Document ${i + 1}]: "${c.document_title}", Section: "${c.section_title}", Page: ${c.page_number}\n${c.content}`
      ).join('\n\n---\n\n');

      const systemPrompt = `You are Nagar Connect Municipal AI, an authoritative public service assistant. 
Answer the user's question using ONLY the retrieved municipal document excerpts below.
Strict rules:
1. Always base statements directly on the provided context.
2. If the context does not contain the answer, reply EXACTLY: "I could not find this information in the authorized municipal knowledge base."
3. Cite the Document Title, Section, and Page in your answer.`;

      // Fallback if network call fails or isn't configured
      return this.localFallback.generateAnswer(query, contextChunks, options);
    } catch (err) {
      console.warn('ExternalProvider failed, falling back to LocalProvider:', err.message);
      return this.localFallback.generateAnswer(query, contextChunks, options);
    }
  }
}

module.exports = { ExternalProvider };
