/**
 * LLM Provider Abstraction Interface
 * Enables pluggable generative models (Local, Demo, or External Cloud LLMs)
 * without hardcoding or requiring paid API subscriptions.
 */
class LLMProvider {
  constructor(name = 'BaseProvider') {
    this.name = name;
  }

  /**
   * Generates a grounded response based strictly on retrieved context chunks.
   *
   * @param {string} query - Citizen or Officer prompt
   * @param {Array<Object>} contextChunks - Ranked, authorized context chunks
   * @param {Object} options - { assistantRole, language, department }
   * @returns {Promise<{ answer: string, confidence: number }>}
   */
  async generateAnswer(query, contextChunks, options = {}) {
    throw new Error('generateAnswer() must be implemented by subclass.');
  }
}

module.exports = { LLMProvider };
