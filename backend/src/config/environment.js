const Joi = require('joi');

// Environment validation schema
const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3000),
  
  // Database
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(3306),
  DB_NAME: Joi.string().required(),
  DB_USER: Joi.string().required(),
  DB_PASSWORD: Joi.string().allow('').optional(),
  
  // JWT
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default('7d'),
  
  // Admin User
  ADMIN_USERNAME: Joi.string().default('admin'),
  ADMIN_EMAIL: Joi.string().email().default('admin@randomrobi.com'),
  ADMIN_PASSWORD: Joi.string().min(8).required(),
  
  // External APIs
  RANDOM_WORD_API_URL: Joi.string().uri().default('https://random-word-api.herokuapp.com'),
  YOUTUBE_BASE_URL: Joi.string().uri().default('https://www.youtube.com'),
  
  // Rate limiting
  RATE_LIMIT_WINDOW_MS: Joi.number().default(15 * 60 * 1000), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: Joi.number().default(100),
  
  // CORS
  CORS_ORIGIN: Joi.string().default('http://localhost:4200'),
  
  // App settings
  CREATE_TABLES: Joi.boolean().default(false),
  MAX_TRIES: Joi.number().default(5),
  RETRY_DELAY: Joi.number().default(2000),
  
  // Monitoring
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
  ENABLE_REQUEST_LOGGING: Joi.boolean().default(true),
  
  // Security
  BCRYPT_ROUNDS: Joi.number().min(10).max(15).default(12),
  HELMET_ENABLED: Joi.boolean().default(true)
}).unknown(true);

// Validate environment variables
const { error, value: envVars } = envSchema.validate(process.env);

if (error) {
  throw new Error(`Environment validation error: ${error.message}`);
}

// Export validated configuration
module.exports = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  
  database: {
    host: envVars.DB_HOST,
    port: envVars.DB_PORT,
    name: envVars.DB_NAME,
    user: envVars.DB_USER,
    password: envVars.DB_PASSWORD,
  },
  
  jwt: {
    secret: envVars.JWT_SECRET,
    expiresIn: envVars.JWT_EXPIRES_IN,
  },
  
  admin: {
    username: envVars.ADMIN_USERNAME,
    email: envVars.ADMIN_EMAIL,
    password: envVars.ADMIN_PASSWORD,
  },
  
  externalApis: {
    randomWordApiUrl: envVars.RANDOM_WORD_API_URL,
    youtubeBaseUrl: envVars.YOUTUBE_BASE_URL,
  },
  
  rateLimit: {
    windowMs: envVars.RATE_LIMIT_WINDOW_MS,
    maxRequests: envVars.RATE_LIMIT_MAX_REQUESTS,
  },
  
  cors: {
    origin: envVars.CORS_ORIGIN,
  },
  
  app: {
    createTables: envVars.CREATE_TABLES,
    maxTries: envVars.MAX_TRIES,
    retryDelay: envVars.RETRY_DELAY,
  },
  
  monitoring: {
    logLevel: envVars.LOG_LEVEL,
    enableRequestLogging: envVars.ENABLE_REQUEST_LOGGING,
  },
  
  security: {
    bcryptRounds: envVars.BCRYPT_ROUNDS,
    helmetEnabled: envVars.HELMET_ENABLED,
  },
  
  // Helper methods
  isDevelopment: () => envVars.NODE_ENV === 'development',
  isProduction: () => envVars.NODE_ENV === 'production',
  isTest: () => envVars.NODE_ENV === 'test',
};
