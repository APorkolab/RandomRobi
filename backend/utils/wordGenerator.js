/**
 * Local word generator to replace external random word API
 */

const categories = {
  general: [
    'adventure', 'amazing', 'beautiful', 'creative', 'discovery', 'energy',
    'fantastic', 'harmony', 'inspiration', 'journey', 'knowledge', 'laughter',
    'magic', 'nature', 'opportunity', 'passion', 'quality', 'rainbow',
    'sunshine', 'technology', 'universe', 'victory', 'wisdom', 'excellence',
    'freedom', 'happiness', 'innovation', 'mystery', 'perspective', 'serenity'
  ],
  science: [
    'astronomy', 'biology', 'chemistry', 'physics', 'mathematics', 'geology',
    'ecology', 'genetics', 'quantum', 'molecule', 'electron', 'photon',
    'gravity', 'evolution', 'research', 'experiment', 'hypothesis', 'theory',
    'discovery', 'innovation', 'laboratory', 'microscope', 'telescope', 'DNA',
    'neuron', 'enzyme', 'protein', 'catalyst', 'spectrum', 'analysis'
  ],
  technology: [
    'algorithm', 'artificial', 'automation', 'blockchain', 'coding', 'database',
    'encryption', 'framework', 'graphics', 'hardware', 'interface', 'javascript',
    'kernel', 'laptop', 'machine', 'network', 'operating', 'programming',
    'quantum', 'robotics', 'software', 'technology', 'upgrade', 'virtual',
    'website', 'android', 'browser', 'computer', 'digital', 'internet'
  ],
  entertainment: [
    'music', 'movie', 'gaming', 'dancing', 'singing', 'comedy', 'drama',
    'action', 'adventure', 'fantasy', 'mystery', 'romance', 'thriller',
    'animation', 'documentary', 'concert', 'theater', 'festival', 'show',
    'performance', 'streaming', 'podcast', 'video', 'audio', 'instrument',
    'melody', 'rhythm', 'beat', 'soundtrack'
  ],
  lifestyle: [
    'cooking', 'travel', 'fashion', 'fitness', 'health', 'yoga', 'meditation',
    'nutrition', 'recipe', 'adventure', 'vacation', 'culture', 'art',
    'photography', 'reading', 'writing', 'gardening', 'hobby', 'sport',
    'exercise', 'wellness', 'mindfulness', 'creativity', 'inspiration',
    'motivation', 'balance', 'achievement', 'goal', 'success'
  ]
};

/**
 * Get a random word from a specific category
 * @param {string} category - Category name (optional)
 * @returns {string} Random word
 */
function getRandomWord(category = null) {
  let wordList;

  if (category && categories[category]) {
    wordList = categories[category];
  } else {
    // Combine all categories for general random selection
    wordList = Object.values(categories).flat();
  }

  const randomIndex = Math.floor(Math.random() * wordList.length);
  return wordList[randomIndex];
}

/**
 * Get multiple random words
 * @param {number} count - Number of words to return
 * @param {string} category - Category name (optional)
 * @returns {string[]} Array of random words
 */
function getRandomWords(count = 1, category = null) {
  const words = [];
  const used = new Set();

  let wordList;
  if (category && categories[category]) {
    wordList = categories[category];
  } else {
    wordList = Object.values(categories).flat();
  }

  while (words.length < count && used.size < wordList.length) {
    const word = getRandomWord(category);
    if (!used.has(word)) {
      used.add(word);
      words.push(word);
    }
  }

  return words;
}

/**
 * Get available categories
 * @returns {string[]} Array of category names
 */
function getCategories() {
  return Object.keys(categories);
}

module.exports = {
  getRandomWord,
  getRandomWords,
  getCategories,
  categories
};
