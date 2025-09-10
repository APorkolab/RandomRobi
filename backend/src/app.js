require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
const morgan = require('morgan');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const expressInner = require('express');
const logger = require('../logger/logger');
const { AppError } = require('./utils/errors');
const rateLimiter = require('../middlewares/rateLimiting');
const authenticate = require('../middlewares/authenticate');

// Import routers
const videoRouter = require('../controllers/video/router');
const cronRouter = require('../controllers/cron/router');
const userRouter = require('../controllers/user/router');
const loginRouter = require('../controllers/login/router');

const app = express();

// Security middleware - Helmet sets various HTTP headers to help protect your app
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'fonts.googleapis.com'],
      fontSrc: ["'self'", 'fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:'],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'"],
      mediaSrc: ["'self'"],
      objectSrc: ["'none'"],
      childSrc: ["'self'"],
    },
  },
}));

// Compression middleware
app.use(compression({
  level: 6, // Compression level (0-9)
  threshold: 1024, // Only compress responses larger than 1KB
  filter: (req, res) => {
    // Don't compress responses with this request header
    if (req.headers['x-no-compression']) {
      return false;
    }
    // Use compression filter function
    return compression.filter(req, res);
  },
}));

// Trust proxy for accurate client IP addresses
app.set('trust proxy', 1);

// Rate limiting
app.use('/api/', rateLimiter);

// CORS configuration
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
  : ['http://localhost:4200', 'http://localhost:3000'];

const corsOptions = {
  origin(origin, callback) {
    // Always allow requests with no origin (like mobile apps, tests, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      // For development and testing, be more permissive
      callback(null, true);
    } else {
      logger.warn(`CORS blocked origin: ${origin}`);
      callback(new AppError('Not allowed by CORS', 403));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 'Authorization', 'X-Requested-With',
    'Access-Control-Request-Method', 'Access-Control-Request-Headers'
  ],
  exposedHeaders: [
    'Access-Control-Allow-Origin', 'Access-Control-Allow-Methods',
    'Access-Control-Allow-Headers'
  ],
  credentials: true,
  optionsSuccessStatus: 200,
  maxAge: 86400, // 24 hours
};

app.use(cors(corsOptions));
// Manually set Access-Control-Allow-Origin when origin is allowed
app.use((req, res, next) => {
  const { origin } = req.headers;
  const isDev = process.env.NODE_ENV === 'development'
    || process.env.NODE_ENV === 'test';
  if (!origin || allowedOrigins.includes(origin) || isDev) {
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  next();
});
logger.info(`CORS enabled for origins: ${allowedOrigins.join(', ')}`);

// Request logging
const logFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(morgan(logFormat, {
  stream: { write: (message) => logger.info(message.trim()) },
  skip: (req) => req.url === '/health' || req.url.startsWith('/static/')

}));

// Body parsing middleware
app.use(express.json({
  limit: '10mb',
  strict: true,
}));
app.use(express.urlencoded({
  extended: false,
  limit: '10mb',
}));

// Swagger API documentation
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Random Robi API',
      version: '2.0.0',
      description: 'Advanced YouTube video generator API with enterprise features',
      contact: {
        name: 'Adam Dr. Porkolab',
        email: 'adam@porkolab.hu',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://api.randomrobi.porkolab.hu',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: [`${__dirname}/../controllers/**/*.js`, `${__dirname}/../models/**/*.js`],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Random Robi API Documentation',
}));

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const sequelize = require('../config/database');
    await sequelize.authenticate();
    const dbHealth = {
      status: 'healthy',
      message: 'Database connection is healthy',
      timestamp: new Date().toISOString(),
    };

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      database: dbHealth,
      memory: process.memoryUsage(),
    };

    res.status(200).json(health);
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

// API routes with versioning
app.use('/api/v1/videos', videoRouter); // Video routes have their own auth logic
app.use('/api/v1/cron', authenticate, cronRouter);
app.use('/api/v1/users', authenticate, userRouter);
app.use('/api/v1/auth', loginRouter);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Random Robi API',
    version: '2.0.0',
    description: 'Enterprise-grade YouTube video generator API',
    documentation: '/api-docs',
    health: '/health',
    timestamp: new Date().toISOString(),
  });
});

// Legacy routes for backward compatibility
app.use('/video', videoRouter);
app.use('/cron', cronRouter);
app.use('/user', authenticate, userRouter);
// Mount login router for legacy paths
const loginRouterLegacy = expressInner.Router();

// Import the actual login logic from the login controller
const loginController = require('../controllers/login/router');

loginRouterLegacy.use('/', loginController);

app.use('/', loginRouterLegacy);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    method: req.method,
    url: req.originalUrl,
    timestamp: new Date().toISOString(),
  });
});

// Global error handler
app.use((err, req, res, next) => {
  // Handle operational errors
  if (err.isOperational) {
    logger.error(`Operational error: ${err.message}`, {
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    return res.status(err.statusCode).json({
      error: {
        message: err.message,
        status: err.statusCode,
        timestamp: err.timestamp,
      },
    });
  }

  // Handle programming errors
  logger.error('Programming error:', {
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
  });

  // Don't leak error details in production
  const message = process.env.NODE_ENV === 'production'
    ? 'Something went wrong!'
    : err.message;

  res.status(500).json({
    error: {
      message,
      status: 500,
      timestamp: new Date().toISOString(),
    },
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

module.exports = app;
