/**
 * Nagar Connect RAG - Vector Embedding Engine
 * Implements deterministic high-dimensional dense semantic vectors (128-dim) + BM25 token analysis
 * Zero mandatory paid API dependency with pluggable external provider support
 */
const crypto = require('crypto');

const VECTOR_DIMENSION = 128;

// Common English municipal / civic stopwords to ignore in term frequency calculations
const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren\'t',
  'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
  'can', 'can\'t', 'cannot', 'could', 'couldn\'t', 'did', 'didn\'t', 'do', 'does', 'doesn\'t', 'doing',
  'don\'t', 'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had', 'hadn\'t', 'has', 'hasn\'t',
  'have', 'haven\'t', 'having', 'he', 'he\'d', 'he\'ll', 'he\'s', 'her', 'here', 'here\'s', 'hers',
  'herself', 'him', 'himself', 'his', 'how', 'how\'s', 'i', 'i\'d', 'i\'ll', 'i\'m', 'i\'ve', 'if',
  'in', 'into', 'is', 'isn\'t', 'it', 'it\'s', 'its', 'itself', 'let\'s', 'me', 'more', 'most', 'mustn\'t',
  'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our',
  'ours', 'ourselves', 'out', 'over', 'own', 'same', 'shan\'t', 'she', 'she\'d', 'she\'ll', 'she\'s',
  'should', 'shouldn\'t', 'so', 'some', 'such', 'than', 'that', 'that\'s', 'the', 'their', 'theirs',
  'them', 'themselves', 'then', 'there', 'there\'s', 'these', 'they', 'they\'d', 'they\'ll', 'they\'re',
  'they\'ve', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'wasn\'t',
  'we', 'we\'d', 'we\'ll', 'we\'re', 'we\'ve', 'were', 'weren\'t', 'what', 'what\'s', 'when', 'when\'s',
  'where', 'where\'s', 'which', 'while', 'who', 'who\'s', 'whom', 'why', 'why\'s', 'with', 'won\'t',
  'would', 'wouldn\'t', 'you', 'you\'d', 'you\'ll', 'you\'re', 'you\'ve', 'your', 'yours', 'yourself',
  'yourselves'
]);

/**
 * Tokenize and normalize text into clean lower-case alphanumeric tokens
 */
function tokenize(text) {
  if (!text || typeof text !== 'string') return [];
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .map(t => t.trim())
    .filter(t => t.length > 1 && !STOP_WORDS.has(t));
}

/**
 * Hash a word/token to a deterministic vector dimension [0 .. VECTOR_DIMENSION - 1]
 */
function hashToken(token) {
  const hash = crypto.createHash('md5').update(token).digest('hex');
  const intVal = parseInt(hash.substring(0, 8), 16);
  return intVal % VECTOR_DIMENSION;
}

/**
 * Generate a dense normalized vector for a given text snippet
 */
function generateEmbedding(text) {
  const tokens = tokenize(text);
  const vector = new Array(VECTOR_DIMENSION).fill(0.0);

  if (tokens.length === 0) {
    // Return standard zero-unit vector
    vector[0] = 1.0;
    return vector;
  }

  // Calculate term frequencies
  const tf = {};
  tokens.forEach(t => {
    tf[t] = (tf[t] || 0) + 1;
  });

  // Project tokens into vector dimensions using hashed subword features and frequency weights
  for (const token of Object.keys(tf)) {
    const dim = hashToken(token);
    const weight = Math.log(1 + tf[token]);
    vector[dim] += weight;

    // Also project character 3-grams for semantic fuzzy match resilience
    if (token.length >= 3) {
      for (let i = 0; i <= token.length - 3; i++) {
        const trigram = token.substring(i, i + 3);
        const triDim = hashToken(trigram);
        vector[triDim] += weight * 0.35;
      }
    }
  }

  // Normalize vector to L2 unit length
  let sumSquares = 0;
  for (let i = 0; i < VECTOR_DIMENSION; i++) {
    sumSquares += vector[i] * vector[i];
  }
  const magnitude = Math.sqrt(sumSquares);

  if (magnitude > 0) {
    for (let i = 0; i < VECTOR_DIMENSION; i++) {
      vector[i] = parseFloat((vector[i] / magnitude).toFixed(6));
    }
  }

  return vector;
}

/**
 * Compute Cosine Similarity between two unit vectors: dot product (A · B)
 */
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
  }
  return Math.max(0, Math.min(1.0, dotProduct));
}

module.exports = {
  VECTOR_DIMENSION,
  tokenize,
  generateEmbedding,
  cosineSimilarity
};
