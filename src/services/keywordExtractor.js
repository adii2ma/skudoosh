import * as tf from '@tensorflow/tfjs';

/**
 * Service to extract keywords from text using TensorFlow.js
 */
class KeywordExtractor {
  constructor() {
    this.model = null;
    this.initialized = false;
    this.commonWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 
      'with', 'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being', 'have',
      'has', 'had', 'do', 'does', 'did', 'will', 'would', 'shall', 'should',
      'can', 'could', 'may', 'might', 'must', 'that', 'this', 'these', 'those',
      'of', 'from', 'as', 'by', 'about', 'like', 'through', 'over', 'before', 'after',
      'between', 'under', 'above', 'below', 'up', 'down', 'into', 'onto', 'upon'
    ]);
  }

  /**
   * Initialize the TensorFlow.js model
   */
  async initialize() {
    try {
      // Load the Universal Sentence Encoder model
      console.log('Loading TensorFlow.js model...');
      
      // There are different model approaches we could take:
      // 1. Use a pre-trained model like Universal Sentence Encoder
      this.model = await tf.loadGraphModel(
        'https://tfhub.dev/tensorflow/tfjs-model/universal-sentence-encoder-lite/1/default/1',
        { fromTFHub: true }
      );
      
      this.initialized = true;
      console.log('TensorFlow.js model loaded successfully');
      return true;
    } catch (error) {
      console.error('Failed to load TensorFlow.js model:', error);
      return false;
    }
  }

  /**
   * Extract keywords from text
   * @param {string} text - The text to extract keywords from
   * @param {number} limit - Maximum number of keywords to return
   * @returns {Promise<Array<{word: string, score: number}>>} - Array of keywords with scores
   */
  async extractKeywords(text, limit = 5) {
    // If TensorFlow.js model is not initialized, use fallback method
    if (!this.initialized || !this.model) {
      console.log('Using fallback keyword extraction method');
      return this.extractKeywordsFallback(text, limit);
    }

    try {
      // Preprocess the text
      const sentences = this.splitIntoSentences(text);
      
      // Get embeddings for sentences
      const embeddings = await this.getEmbeddings(sentences);
      
      // Extract individual words
      const words = this.extractWords(text);
      
      // Calculate TF-IDF scores
      const wordScores = this.calculateWordImportance(words, text);
      
      // Sort by score and take top N
      const sortedKeywords = Object.entries(wordScores)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([word, score]) => ({ word, score }));
      
      return sortedKeywords;
    } catch (error) {
      console.error('Error extracting keywords with TensorFlow.js:', error);
      return this.extractKeywordsFallback(text, limit);
    }
  }

  /**
   * Fallback method for keyword extraction based on word frequency
   * @param {string} text - The text to extract keywords from
   * @param {number} limit - Maximum number of keywords to return
   * @returns {Array<{word: string, score: number}>} - Array of keywords with scores
   */
  extractKeywordsFallback(text, limit = 5) {
    // Simple word frequency approach
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .split(/\s+/) // Split on whitespace
      .filter(word => word.length > 3 && !this.commonWords.has(word));
    
    // Count word frequency
    const wordCounts = {};
    words.forEach(word => {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    });
    
    // Convert to array and sort by frequency
    const sortedWords = Object.entries(wordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([word, count]) => ({ 
        word, 
        score: count / words.length // Normalize score
      }));
    
    return sortedWords;
  }

  /**
   * Split text into sentences
   * @param {string} text - The text to split
   * @returns {Array<string>} - Array of sentences
   */
  splitIntoSentences(text) {
    return text.split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  /**
   * Extract words from text
   * @param {string} text - The text to extract words from
   * @returns {Array<string>} - Array of words
   */
  extractWords(text) {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3 && !this.commonWords.has(word));
  }

  /**
   * Get embeddings for sentences using Universal Sentence Encoder
   * @param {Array<string>} sentences - Array of sentences
   * @returns {Promise<tf.Tensor>} - Tensor of embeddings
   */
  async getEmbeddings(sentences) {
    const embeddings = await this.model.predict(sentences);
    return embeddings;
  }

  /**
   * Calculate word importance based on TF-IDF
   * @param {Array<string>} words - Array of words
   * @param {string} text - The original text
   * @returns {Object} - Object with word scores
   */
  calculateWordImportance(words, text) {
    const wordCounts = {};
    const totalWords = words.length;
    
    // Count word frequency (Term Frequency)
    words.forEach(word => {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    });
    
    // Calculate score for each word
    const wordScores = {};
    Object.entries(wordCounts).forEach(([word, count]) => {
      // Term Frequency
      const tf = count / totalWords;
      
      // Inverted Document Frequency would typically use a corpus,
      // but here we'll use a simple heuristic based on word length and rarity
      const idf = Math.log(1 + word.length / 5);
      
      // TF-IDF score
      wordScores[word] = tf * idf;
    });
    
    return wordScores;
  }
}

export default new KeywordExtractor();
