const NodeCache = require('node-cache');
const logger = require('../logger/logger');

/**
 * Cache configuration
 */
const CACHE_CONFIG = {
  stdTTL: 600, // 10 minutes default TTL
  checkperiod: 120, // Check for expired keys every 2 minutes
  useClones: false, // Don't clone objects for better performance
};

/**
 * Cache keys and TTL constants
 */
const CACHE_KEYS = {
  VIDEO_RANDOM: 'video:random',
  VIDEO_LATEST: 'video:latest',
  VIDEO_LIST: 'video:list',
  USER_LIST: 'user:list',
  RANDOM_WORD: 'random:word',
  YOUTUBE_SEARCH: (keyword) => `youtube:search:${keyword}`,
};

const CACHE_TTL = {
  SHORT: 300,    // 5 minutes
  MEDIUM: 900,   // 15 minutes
  LONG: 3600,    // 1 hour
  VERY_LONG: 86400, // 24 hours
};

/**
 * In-memory cache implementation
 */
class MemoryCache {
  constructor() {
    this.cache = new NodeCache(CACHE_CONFIG);
    this.cache.on('expired', (key, value) => {
      logger.debug(`Cache key expired: ${key}`);
    });
  }

  async get(key) {
    try {
      const value = this.cache.get(key);
      if (value !== undefined) {
        logger.debug(`Cache hit: ${key}`);
        return value;
      }
      logger.debug(`Cache miss: ${key}`);
      return null;
    } catch (error) {
      logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  async set(key, value, ttl = CACHE_CONFIG.stdTTL) {
    try {
      const success = this.cache.set(key, value, ttl);
      if (success) {
        logger.debug(`Cache set: ${key} (TTL: ${ttl}s)`);
      }
      return success;
    } catch (error) {
      logger.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  async del(key) {
    try {
      const count = this.cache.del(key);
      logger.debug(`Cache delete: ${key} (deleted: ${count})`);
      return count > 0;
    } catch (error) {
      logger.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  }

  async clear() {
    try {
      this.cache.flushAll();
      logger.info('Cache cleared');
      return true;
    } catch (error) {
      logger.error('Cache clear error:', error);
      return false;
    }
  }

  async keys() {
    try {
      return this.cache.keys();
    } catch (error) {
      logger.error('Cache keys error:', error);
      return [];
    }
  }

  getStats() {
    return this.cache.getStats();
  }
}

/**
 * Cache wrapper with circuit breaker pattern
 */
class CacheManager {
  constructor() {
    this.cache = new MemoryCache();
    this.isHealthy = true;
    this.errorCount = 0;
    this.maxErrors = 5;
    this.resetTimeout = 60000; // 1 minute
  }

  async get(key) {
    if (!this.isHealthy) {
      logger.warn(`Cache is unhealthy, skipping get for key: ${key}`);
      return null;
    }

    try {
      const result = await this.cache.get(key);
      this.resetErrors();
      return result;
    } catch (error) {
      this.handleError(error, 'get', key);
      return null;
    }
  }

  async set(key, value, ttl) {
    if (!this.isHealthy) {
      logger.warn(`Cache is unhealthy, skipping set for key: ${key}`);
      return false;
    }

    try {
      const result = await this.cache.set(key, value, ttl);
      this.resetErrors();
      return result;
    } catch (error) {
      this.handleError(error, 'set', key);
      return false;
    }
  }

  async del(key) {
    if (!this.isHealthy) {
      logger.warn(`Cache is unhealthy, skipping delete for key: ${key}`);
      return false;
    }

    try {
      const result = await this.cache.del(key);
      this.resetErrors();
      return result;
    } catch (error) {
      this.handleError(error, 'delete', key);
      return false;
    }
  }

  async clear() {
    try {
      const result = await this.cache.clear();
      this.resetErrors();
      return result;
    } catch (error) {
      this.handleError(error, 'clear');
      return false;
    }
  }

  handleError(error, operation, key = '') {
    this.errorCount++;
    logger.error(`Cache ${operation} error${key ? ` for key ${key}` : ''}:`, error);

    if (this.errorCount >= this.maxErrors) {
      this.isHealthy = false;
      logger.error(`Cache marked as unhealthy after ${this.errorCount} errors`);
      
      setTimeout(() => {
        this.resetErrors();
        logger.info('Cache health reset, attempting recovery');
      }, this.resetTimeout);
    }
  }

  resetErrors() {
    if (this.errorCount > 0 || !this.isHealthy) {
      this.errorCount = 0;
      this.isHealthy = true;
      logger.debug('Cache errors reset');
    }
  }

  getHealth() {
    return {
      isHealthy: this.isHealthy,
      errorCount: this.errorCount,
      stats: this.cache.getStats(),
    };
  }
}

// Create singleton instance
const cacheManager = new CacheManager();

/**
 * Cache decorator for functions
 */
const withCache = (key, ttl = CACHE_TTL.MEDIUM) => {
  return (target, propertyName, descriptor) => {
    const method = descriptor.value;
    
    descriptor.value = async function(...args) {
      const cacheKey = typeof key === 'function' ? key(...args) : key;
      
      // Try to get from cache first
      const cached = await cacheManager.get(cacheKey);
      if (cached !== null) {
        return cached;
      }
      
      // Execute original method
      const result = await method.apply(this, args);
      
      // Cache the result
      if (result !== null && result !== undefined) {
        await cacheManager.set(cacheKey, result, ttl);
      }
      
      return result;
    };
    
    return descriptor;
  };
};

/**
 * Middleware to cache responses
 */
const cacheMiddleware = (keyGenerator, ttl = CACHE_TTL.MEDIUM) => {
  return async (req, res, next) => {
    const cacheKey = typeof keyGenerator === 'function' 
      ? keyGenerator(req) 
      : keyGenerator;

    const cached = await cacheManager.get(cacheKey);
    if (cached !== null) {
      logger.debug(`Serving cached response for: ${cacheKey}`);
      return res.json(cached);
    }

    // Override res.json to cache the response
    const originalJson = res.json;
    res.json = function(body) {
      if (res.statusCode === 200 && body) {
        cacheManager.set(cacheKey, body, ttl);
      }
      return originalJson.call(this, body);
    };

    next();
  };
};

module.exports = {
  cache: cacheManager,
  CACHE_KEYS,
  CACHE_TTL,
  withCache,
  cacheMiddleware,
};
