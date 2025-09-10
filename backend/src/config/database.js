const { Sequelize } = require('sequelize');
const config = require('./environment');
const logger = require('../../logger/logger');

/**
 * Database configuration options
 */
// Use SQLite for development if MySQL is not available
const usesSQLite = config.database.name.endsWith('.db') || !config.database.host || config.database.host === 'localhost';

const sequelizeOptions = {
  ...(usesSQLite ? {
    dialect: 'sqlite',
    storage: config.database.name,
  } : {
    host: config.database.host,
    port: config.database.port,
    dialect: 'mysql',
  }),
  
  // Connection pooling
  pool: {
    max: 20,        // Maximum connections
    min: 0,         // Minimum connections
    acquire: 60000, // Maximum time (ms) to get connection
    idle: 10000,    // Maximum time (ms) connection can be idle
    evict: 10000,   // Time (ms) to check for idle connections
  },
  
  // Logging configuration
  logging: config.isDevelopment() 
    ? (msg) => logger.debug(`[Sequelize] ${msg}`)
    : false,
    
  // Performance optimizations
  dialectOptions: {
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
    connectTimeout: 30000,
    acquireTimeout: 30000,
    timeout: 30000,
    // Enable SSL in production
    ...(config.isProduction() && {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    }),
  },
  
  // Query options
  define: {
    timestamps: false,
    underscored: true,
    freezeTableName: true,
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
  },
  
  // Benchmark queries in development
  benchmark: config.isDevelopment(),
  
  // Retry configuration
  retry: {
    match: [
      /ETIMEDOUT/,
      /EHOSTUNREACH/,
      /ECONNRESET/,
      /ECONNREFUSED/,
      /TIMEOUT/,
      /ESOCKETTIMEDOUT/,
      /ENOTFOUND/,
      /EAI_AGAIN/
    ],
    max: 5,
    backoffBase: 1000,
    backoffExponent: 1.5,
  },
};

/**
 * Create Sequelize instance
 */
const sequelize = new Sequelize(
  config.database.name,
  config.database.user,
  config.database.password,
  sequelizeOptions
);

/**
 * Database connection health check
 */
const healthCheck = async () => {
  try {
    await sequelize.authenticate();
    return {
      status: 'healthy',
      message: 'Database connection is healthy',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('Database health check failed:', error);
    return {
      status: 'unhealthy',
      message: error.message,
      timestamp: new Date().toISOString(),
    };
  }
};

/**
 * Initialize database connection
 */
const initializeDatabase = async () => {
  try {
    // Test connection
    await sequelize.authenticate();
    logger.info('Database connection established successfully');
    
    // Sync models based on environment
    if (config.app.createTables) {
      await sequelize.sync({ force: true });
      logger.info('Database tables created (force: true)');
    } else if (config.isDevelopment()) {
      await sequelize.sync({ alter: true });
      logger.info('Database tables synchronized (alter: true)');
    } else {
      await sequelize.sync({ alter: false });
      logger.info('Database tables synchronized (alter: false)');
    }
    
    return true;
  } catch (error) {
    logger.error('Failed to initialize database:', error);
    throw error;
  }
};

/**
 * Graceful database shutdown
 */
const closeDatabase = async () => {
  try {
    await sequelize.close();
    logger.info('Database connection closed gracefully');
  } catch (error) {
    logger.error('Error closing database connection:', error);
    throw error;
  }
};

/**
 * Database transaction wrapper
 */
const withTransaction = async (callback) => {
  const transaction = await sequelize.transaction();
  try {
    const result = await callback(transaction);
    await transaction.commit();
    return result;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/**
 * Batch operation helper
 */
const bulkCreate = async (model, data, options = {}) => {
  const defaultOptions = {
    validate: true,
    ignoreDuplicates: false,
    updateOnDuplicate: Object.keys(data[0] || {}),
    ...options,
  };
  
  try {
    return await model.bulkCreate(data, defaultOptions);
  } catch (error) {
    logger.error('Bulk create operation failed:', error);
    throw error;
  }
};

/**
 * Connection event handlers
 */
sequelize.afterConnect((connection) => {
  logger.debug('New database connection established');
});

sequelize.beforeDisconnect((connection) => {
  logger.debug('Database connection closing');
});

// Graceful shutdown handling
process.on('SIGINT', closeDatabase);
process.on('SIGTERM', closeDatabase);

module.exports = {
  sequelize,
  initializeDatabase,
  closeDatabase,
  healthCheck,
  withTransaction,
  bulkCreate,
};
