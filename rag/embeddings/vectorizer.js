const crypto = require('crypto');

/**
 * 128-dimensional dense semantic vectorizer with civic vocabulary weighting.
 * Maps any text input to a normalized unit-vector embedding.
 */
class DenseVectorizer {
  constructor(dimensions = 128) {
    this.dimensions = dimensions;
    // Civic and municipal keyword weights for enhanced domain accuracy
    this.domainWeights = {
      pothole: 2.5, road: 2.0, asphalt: 2.2, bituminous: 2.4, crater: 2.0, traffic: 1.5,
      water: 2.2, pipe: 2.0, pipeline: 2.3, leakage: 2.4, burst: 2.5, pressure: 1.8, contamination: 2.6,
      garbage: 2.2, waste: 2.0, sanitation: 2.4, dustbin: 2.1, segregation: 2.3, tipper: 1.9,
      streetlight: 2.5, lamp: 2.0, led: 2.1, cable: 1.9, dark: 1.8, pole: 1.9, outage: 2.2,
      drainage: 2.4, sewer: 2.2, culvert: 2.5, desilting: 2.6, waterlogging: 2.5, monsoon: 2.0,
      sla: 2.8, timeline: 2.2, deadline: 2.3, escalation: 2.7, penalty: 2.4, fine: 2.2,
      officer: 1.8, citizen: 1.8, field: 1.8, inspection: 2.0, verification: 2.0, charter: 2.5,
      grievance: 2.6, complaint: 2.2, redressal: 2.5, feedback: 2.0, emergency: 2.8, safety: 2.2
    };
  }

  /**
   * Tokenizes text into lowercase words, removing punctuation and short stop words
   */
  tokenize(text) {
    if (!text || typeof text !== 'string') return [];
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of',
      'with', 'by', 'from', 'up', 'about', 'into', 'over', 'after', 'is', 'are',
      'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does',
      'did', 'it', 'its', 'this', 'that', 'these', 'those', 'as', 'if'
    ]);

    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopWords.has(w));
  }

  /**
   * Generates a deterministic 128-dimensional dense numerical vector
   * utilizing feature hashing, domain term boosting, and L2 unit-norm projection.
   *
   * @param {string} text
   * @returns {Array<number>} 128-dim normalized float array
   */
  embed(text) {
    const vector = new Float64Array(this.dimensions);
    const tokens = this.tokenize(text);

    if (tokens.length === 0) {
      // Empty text gets slight non-zero random distribution
      vector[0] = 1.0;
      return Array.from(vector);
    }

    // 1. Process Unigrams with Feature Hashing
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      const weight = this.domainWeights[token] || 1.0;

      // Hash to dimension index
      const hash1 = this._hashString(token, 0);
      const dim1 = Math.abs(hash1) % this.dimensions;
      const sign1 = (hash1 & 1) === 0 ? 1 : -1;
      vector[dim1] += sign1 * weight;

      // Secondary hash for dispersion
      const hash2 = this._hashString(token, 17);
      const dim2 = Math.abs(hash2) % this.dimensions;
      const sign2 = (hash2 & 1) === 0 ? 1 : -1;
      vector[dim2] += sign2 * (weight * 0.5);

      // 2. Process Bigrams for local context window
      if (i < tokens.length - 1) {
        const bigram = `${token}_${tokens[i + 1]}`;
        const bigramHash = this._hashString(bigram, 31);
        const bigramDim = Math.abs(bigramHash) % this.dimensions;
        vector[bigramDim] += 1.5;
      }
    }

    // 3. L2 Unit Normalization: vector / ||vector||
    let sumSquares = 0.0;
    for (let i = 0; i < this.dimensions; i++) {
      sumSquares += vector[i] * vector[i];
    }

    const norm = Math.sqrt(sumSquares);
    const normalized = new Array(this.dimensions);

    if (norm > 0) {
      for (let i = 0; i < this.dimensions; i++) {
        normalized[i] = Number((vector[i] / norm).toFixed(6));
      }
    } else {
      for (let i = 0; i < this.dimensions; i++) {
        normalized[i] = 0.0;
      }
      normalized[0] = 1.0;
    }

    return normalized;
  }

  /**
   * Fast integer hash with seed
   */
  _hashString(str, seed = 0) {
    let hash = 0x811c9dc5 ^ seed;
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193);
    }
    return hash;
  }
}

const defaultVectorizer = new DenseVectorizer(128);

module.exports = {
  DenseVectorizer,
  defaultVectorizer
};
