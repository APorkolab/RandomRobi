#!/usr/bin/env node

/**
 * Random Robi Server
 * Enterprise-grade Node.js server with proper initialization,
 * database setup, and admin user creation
 */

require('dotenv').config();

const app = require('./app');
const logger = require('./logger/logger');
const { initializeDatabase, closeDatabase } = require('./config/database');
const User = require('./models/user');
const { initCronJob } = require('./services/cronService');

// Server configuration
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * Create admin user on server start
 */
const createAdminUser = async () => {
  const username = process.env.ADMIN_USERNAME || 'admin';
  const email = process.env.ADMIN_EMAIL || 'admin@randomrobi.com';
  const password = process.env.ADMIN_PASSWORD || 'AdminPass123!';

  logger.info('Attempting to create admin user...', { username, email });

  try {
    // Use findOrCreate to avoid duplicates
    const [user, created] = await User.findOrCreate({
      where: { username },
      defaults: {
        username,
        password,
        email,
        role: 'admin',
        isActive: true,
      },
    });

    if (created) {
      logger.info('Admin user created successfully', { 
        id: user.id, 
        username: user.username,
        email: user.email 
      });
    } else {
      logger.info('Admin user already exists', { 
        id: user.id, 
        username: user.username 
      });
      
      // Update password if it's the default and we're in development
      if (NODE_ENV === 'development' && password !== 'AdminPass123!') {
        await user.update({ password });
        logger.info('Admin user password updated');
      }
    }
    
    return user;
  } catch (error) {
    logger.error('Failed to create admin user:', error);
    throw error;
  }
};

/**
 * Initialize the application
 */
const initializeApp = async () => {
  try {
    logger.info('Starting Random Robi API server...');
    logger.info(`Environment: ${NODE_ENV}`);
    logger.info(`Port: ${PORT}`);

    // Initialize database connection and sync models
    logger.info('Initializing database...');
    await initializeDatabase();

    // Create admin user
    logger.info('Setting up admin user...');
    await createAdminUser();

    // Start cron jobs
    logger.info('Initializing cron jobs...');
    initCronJob();

    // Start the HTTP server
    const server = app.listen(PORT, '0.0.0.0', () => {
      logger.info(`🚀 Server running successfully!`);
      logger.info(`📍 Local: http://localhost:${PORT}`);
      logger.info(`📚 API Docs: http://localhost:${PORT}/api-docs`);
      logger.info(`🏥 Health Check: http://localhost:${PORT}/health`);
      logger.info('Ready to accept connections');
    });

    // Graceful shutdown handlers
    const gracefulShutdown = (signal) => {
      logger.info(`${signal} received. Starting graceful shutdown...`);
      
      server.close(async (err) => {
        if (err) {
          logger.error('Error during server shutdown:', err);
          process.exit(1);
        }
        
        logger.info('HTTP server closed');
        
        try {
          await closeDatabase();
          logger.info('Database connections closed');
          logger.info('Graceful shutdown completed');
          process.exit(0);
        } catch (dbError) {
          logger.error('Error closing database:', dbError);
          process.exit(1);
        }
      });
      
      // Force exit after 30 seconds
      setTimeout(() => {
        logger.error('Graceful shutdown timed out, forcing exit');
        process.exit(1);
      }, 30000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions and unhandled rejections
    process.on('uncaughtException', (err) => {
      logger.error('Uncaught Exception:', err);
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('UNHANDLED_REJECTION');
    });

    return server;
  } catch (error) {
    logger.error('Failed to initialize application:', error);
    process.exit(1);
  }
};

// Start the application
if (require.main === module) {
  initializeApp().catch((error) => {
    logger.error('Startup error:', error);
    process.exit(1);
  });
}

module.exports = { initializeApp };
