#!/usr/bin/env node

/**
 * Test Database Setup Script
 * Creates database tables and admin user for testing environment
 */

require('dotenv').config();
const sequelize = require('../config/database');
const User = require('../models/user');
const Video = require('../models/video'); // Import Video model
const logger = require('../logger/logger');

async function setupTestDatabase() {
  try {
    logger.info('Setting up test database...');

    // Test database connection
    await sequelize.authenticate();
    logger.info('Database connection established successfully.');

    // Create/update tables
    await sequelize.sync({ force: true });
    logger.info('Database tables created successfully.');

    // Create admin user for tests
    const adminUser = {
      username: process.env.ADMIN_USERNAME || 'admin',
      email: process.env.ADMIN_EMAIL || 'admin@randomrobi.com',
      password: process.env.ADMIN_PASSWORD || 'AdminPass123!'
    };

    const [, created] = await User.findOrCreate({
      where: { username: adminUser.username },
      defaults: adminUser
    });

    if (created) {
      logger.info(`Test admin user created: ${adminUser.username}`);
    } else {
      logger.info(`Test admin user already exists: ${adminUser.username}`);
    }

    logger.info('Test database setup completed successfully.');
    process.exit(0);
  } catch (error) {
    logger.error('Test database setup failed:', error);
    process.exit(1);
  }
}

// Only run if called directly (not imported)
if (require.main === module) {
  setupTestDatabase();
}

module.exports = { setupTestDatabase };
