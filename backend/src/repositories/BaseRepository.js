const { Op } = require('sequelize');
const { NotFoundError, DatabaseError } = require('../utils/errors');
const { cache, CACHE_TTL } = require('../utils/cache');
// eslint-disable-next-line import/no-unresolved, import/extensions
const logger = require('../logger/logger');

/**
 * Base repository class with common CRUD operations
 */
class BaseRepository {
  constructor(model) {
    this.model = model;
    this.modelName = model.name.toLowerCase();
  }

  /**
   * Create a new record
   */
  async create(data, options = {}) {
    try {
      const record = await this.model.create(data, {
        validate: true,
        ...options,
      });

      logger.info(`${this.modelName} created:`, { id: record.id });

      // Invalidate cache
      await this._invalidateCache('list');

      return record.toJSON();
    } catch (error) {
      logger.error(`Error creating ${this.modelName}:`, error);
      throw new DatabaseError(`Failed to create ${this.modelName}`, error);
    }
  }

  /**
   * Find record by ID
   */
  async findById(id, options = {}) {
    try {
      const cacheKey = `${this.modelName}:${id}`;

      // Try cache first
      const cached = await cache.get(cacheKey);
      if (cached && !options.fresh) {
        return cached;
      }

      const record = await this.model.findByPk(id, {
        ...options,
      });

      if (!record) {
        throw new NotFoundError(`${this.modelName} with ID ${id}`);
      }

      const result = record.toJSON();

      // Cache the result
      await cache.set(cacheKey, result, CACHE_TTL.MEDIUM);

      return result;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error(`Error finding ${this.modelName} by ID ${id}:`, error);
      throw new DatabaseError(`Failed to find ${this.modelName}`, error);
    }
  }

  /**
   * Find all records with pagination and filtering
   */
  async findAll(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'id',
        sortOrder = 'DESC',
        search = '',
        filters = {},
        include = [],
        attributes,
      } = options;

      const offset = (page - 1) * limit;
      const cacheKey = this._generateCacheKey('list', { page, limit, sortBy, sortOrder, search, filters });

      // Try cache first
      const cached = await cache.get(cacheKey);
      if (cached && !options.fresh) {
        return cached;
      }

      const where = this._buildWhereClause(search, filters);

      const { count, rows } = await this.model.findAndCountAll({
        where,
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10),
        order: [[sortBy, sortOrder.toUpperCase()]],
        include,
        attributes,
        distinct: true,
      });

      const result = {
        data: rows.map((row) => row.toJSON()),
        pagination: {
          total: count,
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          totalPages: Math.ceil(count / limit),
          hasNextPage: page * limit < count,
          hasPrevPage: page > 1,
        },
      };

      // Cache the result
      await cache.set(cacheKey, result, CACHE_TTL.SHORT);

      return result;
    } catch (error) {
      logger.error(`Error finding all ${this.modelName}s:`, error);
      throw new DatabaseError(`Failed to fetch ${this.modelName}s`, error);
    }
  }

  /**
   * Find one record by criteria
   */
  async findOne(where, options = {}) {
    try {
      const record = await this.model.findOne({
        where,
        ...options,
      });

      return record ? record.toJSON() : null;
    } catch (error) {
      logger.error(`Error finding ${this.modelName}:`, error);
      throw new DatabaseError(`Failed to find ${this.modelName}`, error);
    }
  }

  /**
   * Update record by ID
   */
  async updateById(id, data, options = {}) {
    try {
      const record = await this.model.findByPk(id);
      if (!record) {
        throw new NotFoundError(`${this.modelName} with ID ${id}`);
      }

      await record.update(data, {
        validate: true,
        ...options,
      });

      logger.info(`${this.modelName} updated:`, { id });

      // Invalidate cache
      await this._invalidateCache('list');
      await this._invalidateCache(id.toString());

      return record.toJSON();
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error(`Error updating ${this.modelName} ${id}:`, error);
      throw new DatabaseError(`Failed to update ${this.modelName}`, error);
    }
  }

  /**
   * Delete record by ID
   */
  async deleteById(id, options = {}) {
    try {
      const record = await this.model.findByPk(id);
      if (!record) {
        throw new NotFoundError(`${this.modelName} with ID ${id}`);
      }

      await record.destroy(options);

      logger.info(`${this.modelName} deleted:`, { id });

      // Invalidate cache
      await this._invalidateCache('list');
      await this._invalidateCache(id.toString());

      return true;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error(`Error deleting ${this.modelName} ${id}:`, error);
      throw new DatabaseError(`Failed to delete ${this.modelName}`, error);
    }
  }

  /**
   * Bulk create records
   */
  async bulkCreate(dataArray, options = {}) {
    try {
      const records = await this.model.bulkCreate(dataArray, {
        validate: true,
        ...options,
      });

      logger.info(`Bulk created ${records.length} ${this.modelName}s`);

      // Invalidate cache
      await this._invalidateCache('list');

      return records.map((record) => record.toJSON());
    } catch (error) {
      logger.error(`Error bulk creating ${this.modelName}s:`, error);
      throw new DatabaseError(`Failed to bulk create ${this.modelName}s`, error);
    }
  }

  /**
   * Count records with optional filtering
   */
  async count(filters = {}) {
    try {
      const where = this._buildWhereClause('', filters);
      return await this.model.count({ where });
    } catch (error) {
      logger.error(`Error counting ${this.modelName}s:`, error);
      throw new DatabaseError(`Failed to count ${this.modelName}s`, error);
    }
  }

  /**
   * Check if record exists
   */
  async exists(where) {
    try {
      const count = await this.model.count({ where });
      return count > 0;
    } catch (error) {
      logger.error(`Error checking if ${this.modelName} exists:`, error);
      throw new DatabaseError(`Failed to check ${this.modelName} existence`, error);
    }
  }

  /**
   * Build WHERE clause for search and filters
   */
  _buildWhereClause(search = '', filters = {}) {
    const where = {};

    // Add filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          where[key] = { [Op.in]: value };
        } else if (typeof value === 'object' && value.operator) {
          where[key] = { [Op[value.operator]]: value.value };
        } else {
          where[key] = value;
        }
      }
    });

    // Add search functionality (override in child classes for specific fields)
    if (search.trim()) {
      const searchFields = this._getSearchFields();
      if (searchFields.length > 0) {
        where[Op.or] = searchFields.map((field) => ({
          [field]: { [Op.like]: `%${search}%` }
        }));
      }
    }

    return where;
  }

  /**
   * Get searchable fields (override in child classes)
   */
  // eslint-disable-next-line class-methods-use-this
  _getSearchFields() {
    return [];
  }

  /**
   * Generate cache key
   */
  _generateCacheKey(operation, params = {}) {
    const paramString = Object.entries(params)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}:${JSON.stringify(value)}`)
      .join('|');

    return `${this.modelName}:${operation}:${paramString}`;
  }

  /**
   * Invalidate cache by pattern
   */
  async _invalidateCache(pattern) {
    try {
      const keys = await cache.cache.keys();
      const keysToDelete = keys.filter((key) => key.startsWith(`${this.modelName}:${pattern}`)
        || key.includes(`${this.modelName}:list`));

      // eslint-disable-next-line no-restricted-syntax
      for (const key of keysToDelete) {
        // eslint-disable-next-line no-await-in-loop
        await cache.del(key);
      }
    } catch (error) {
      logger.warn(`Failed to invalidate cache for ${this.modelName}:`, error);
    }
  }
}

module.exports = BaseRepository;
