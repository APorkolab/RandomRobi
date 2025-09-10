/**
 * Video Cache Service
 * Implements intelligent caching and rate limiting for video generation
 * to prevent overwhelming external APIs and improve performance
 */

const NodeCache = require('node-cache');
const axios = require('axios');
const logger = require('../logger/logger');
const { getRandomWord } = require('../utils/wordGenerator');

class VideoCacheService {
  constructor() {
    // Cache for video links (TTL: 1 hour)
    this.videoCache = new NodeCache({
      stdTTL: 3600, // 1 hour
      checkperiod: 300, // Check for expired keys every 5 minutes
      maxKeys: 1000 // Max 1000 cached videos
    });

    // Cache for keywords (TTL: 6 hours)
    this.keywordCache = new NodeCache({
      stdTTL: 21600, // 6 hours
      checkperiod: 300,
      maxKeys: 500
    });

    // Rate limiting for external APIs
    this.lastDatamuseCall = 0;
    this.lastYoutubeCall = 0;
    this.DATAMUSE_RATE_LIMIT = 1000; // 1 second between calls
    this.YOUTUBE_RATE_LIMIT = 3000; // 3 seconds between calls

    // Pre-populate cache with some videos
    this.initializeCache();
  }

  /**
   * Get a random keyword with caching and rate limiting
   */
  async getRandomKeyword() {
    try {
      // Check if we have cached keywords
      const cachedKeywords = this.keywordCache.get('datamuse_keywords');
      if (cachedKeywords && cachedKeywords.length > 0) {
        const randomKeyword = cachedKeywords[Math.floor(Math.random() * cachedKeywords.length)];
        logger.info(`Using cached keyword: ${randomKeyword}`);
        return randomKeyword;
      }

      // Rate limiting for Datamuse API
      const now = Date.now();
      const timeSinceLastCall = now - this.lastDatamuseCall;
      if (timeSinceLastCall < this.DATAMUSE_RATE_LIMIT) {
        logger.info('Rate limiting Datamuse API, using local word generator');
        return getRandomWord();
      }

      // Try Datamuse API with rate limiting
      this.lastDatamuseCall = now;
      const patterns = [
        'a*', 'b*', 'c*', 'd*', 'e*', 'f*', 'g*', 'h*',
        'i*', 'j*', 'k*', 'l*', 'm*', 'n*', 'o*', 'p*',
        'r*', 's*', 't*', 'u*', 'v*', 'w*'
      ];
      const randomPattern = patterns[Math.floor(Math.random() * patterns.length)];
      const maxWords = Math.floor(Math.random() * 100) + 50;

      const response = await axios.get(
        `https://api.datamuse.com/words?sp=${randomPattern}&max=${maxWords}`,
        { timeout: 5000 }
      );

      if (response.data && response.data.length > 0) {
        const keywords = response.data.map((item) => item.word);
        // Cache the keywords for future use
        this.keywordCache.set('datamuse_keywords', keywords);

        const randomKeyword = keywords[Math.floor(Math.random() * keywords.length)];
        logger.info(`Generated random keyword from Datamuse API: ${randomKeyword}`);
        return randomKeyword;
      }

      // Fallback to local generator
      const localKeyword = getRandomWord();
      logger.info(`Using local word generator fallback: ${localKeyword}`);
      return localKeyword;
    } catch (error) {
      logger.warn('Datamuse API error, using local word generator:', error.message);
      return getRandomWord();
    }
  }

  /**
   * Get YouTube video with caching and rate limiting
   */
  async getYouTubeVideo(keyword) {
    try {
      // Check cache first
      const cacheKey = `youtube_${keyword}`;
      const cachedVideo = this.videoCache.get(cacheKey);
      if (cachedVideo) {
        logger.info(`Using cached YouTube video for keyword: ${keyword}`);
        return cachedVideo;
      }

      // Rate limiting for YouTube scraping
      const now = Date.now();
      const timeSinceLastCall = now - this.lastYoutubeCall;
      if (timeSinceLastCall < this.YOUTUBE_RATE_LIMIT) {
        logger.warn(`Rate limiting YouTube API, waiting ${this.YOUTUBE_RATE_LIMIT - timeSinceLastCall}ms`);
        await this.delay(this.YOUTUBE_RATE_LIMIT - timeSinceLastCall);
      }

      this.lastYoutubeCall = Date.now();

      const response = await axios.get(
        `https://www.youtube.com/results?search_query=${encodeURIComponent(keyword)}`,
        {
          timeout: 10000, // Longer timeout for YouTube
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
              + 'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        }
      );

      const html = response.data;
      const match = html.match(/var ytInitialData = (.*?);<\/script>/);

      if (!match || !match[1]) {
        logger.warn(`No ytInitialData found for keyword: ${keyword}`);
        return null;
      }

      const ytInitialData = JSON.parse(match[1]);
      const { contents } = ytInitialData
        .contents.twoColumnSearchResultsRenderer
        .primaryContents.sectionListRenderer.contents[0].itemSectionRenderer;

      const videoLinks = contents
        .filter((item) => item.videoRenderer)
        .map((item) => item.videoRenderer.videoId);

      if (videoLinks.length === 0) {
        logger.warn(`No videos found for keyword: ${keyword}`);
        return null;
      }

      // Get multiple videos and cache them
      const videosToCache = videoLinks.slice(0, 5); // Cache first 5 videos
      videosToCache.forEach((videoId, index) => {
        const videoUrl = `https://www.youtube.com/embed/${videoId}`;
        const cacheKeyForVideo = `${cacheKey}_${index}`;
        this.videoCache.set(cacheKeyForVideo, videoUrl);
      });

      // Return one random video from the results
      const randomIndex = Math.floor(Math.random() * videoLinks.length);
      const videoId = videoLinks[randomIndex];
      const videoUrl = `https://www.youtube.com/embed/${videoId}`;

      // Cache the primary result
      this.videoCache.set(cacheKey, videoUrl);

      logger.info(`Successfully cached YouTube video for keyword: ${keyword}`);
      return videoUrl;
    } catch (error) {
      logger.error('Error retrieving YouTube video:', error.message);
      return null;
    }
  }

  /**
   * Get a random video from cache if available
   */
  getRandomCachedVideo() {
    const allKeys = this.videoCache.keys();
    if (allKeys.length === 0) {
      return null;
    }

    const randomKey = allKeys[Math.floor(Math.random() * allKeys.length)];
    const cachedVideo = this.videoCache.get(randomKey);

    if (cachedVideo) {
      logger.info('Using random cached video');
      return cachedVideo;
    }

    return null;
  }

  /**
   * Initialize cache with some popular videos
   */
  async initializeCache() {
    // Pre-cache some popular keywords from local generator
    const localKeywords = [];
    for (let i = 0; i < 50; i += 1) {
      localKeywords.push(getRandomWord());
    }
    this.keywordCache.set('local_keywords', localKeywords);

    logger.info('Video cache service initialized with pre-populated data');
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      videoCacheSize: this.videoCache.keys().length,
      keywordCacheSize: this.keywordCache.keys().length,
      videoCacheHits: this.videoCache.getStats().hits,
      videoCacheMisses: this.videoCache.getStats().misses,
      keywordCacheHits: this.keywordCache.getStats().hits,
      keywordCacheMisses: this.keywordCache.getStats().misses
    };
  }

  /**
   * Clear all caches
   */
  clearCache() {
    this.videoCache.flushAll();
    this.keywordCache.flushAll();
    logger.info('All caches cleared');
  }

  /**
   * Utility delay function
   */
  // eslint-disable-next-line class-methods-use-this
  delay(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }
}

// Export singleton instance
module.exports = new VideoCacheService();
