const { LocalProvider } = require('./localProvider');

/**
 * DemoProvider: Demonstration provider that delegates to LocalProvider
 * with added diagnostic telemetry for presentation and grading.
 */
class DemoProvider extends LocalProvider {
  constructor() {
    super();
    this.name = 'DemoProvider';
  }

  async generateAnswer(query, contextChunks, options = {}) {
    const result = await super.generateAnswer(query, contextChunks, options);
    return {
      ...result,
      provider: 'DemoProvider (Local Neural Synthesizer)',
      telemetry: {
        analyzedChunks: contextChunks ? contextChunks.length : 0,
        topRelevance: contextChunks && contextChunks[0] ? contextChunks[0].finalScore || contextChunks[0].relevanceScore : 0,
        mode: 'Offline Safe Zero-Cost Generation'
      }
    };
  }
}

module.exports = { DemoProvider };
