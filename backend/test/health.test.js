const request = require('supertest');
const { expect } = require('chai');
const app = require('../src/app');

// Use the app instance directly instead of external URL
const testApp = request(app);

describe('Health Check Tests', () => {
  describe('GET /health', () => {
    it('should return health status with 200', async () => {
      const response = await testApp
        .get('/health')
        .expect(200);

      expect(response.body).to.have.property('status');
      expect(response.body.status).to.equal('healthy');
      expect(response.body).to.have.property('timestamp');
      expect(response.body).to.have.property('uptime');
      expect(response.body).to.have.property('version');
      expect(response.body).to.have.property('environment');
    });

    it('should include database health information', async () => {
      const response = await testApp
        .get('/health')
        .expect(200);

      expect(response.body).to.have.property('database');
      expect(response.body.database).to.have.property('status');
    });

    it('should include memory usage information', async () => {
      const response = await testApp
        .get('/health')
        .expect(200);

      expect(response.body).to.have.property('memory');
      expect(response.body.memory).to.have.property('rss');
      expect(response.body.memory).to.have.property('heapUsed');
      expect(response.body.memory).to.have.property('heapTotal');
    });
  });

  describe('GET /', () => {
    it('should return API information', async () => {
      const response = await testApp
        .get('/')
        .expect(200);

      expect(response.body).to.have.property('name');
      expect(response.body).to.have.property('version');
      expect(response.body).to.have.property('description');
      expect(response.body).to.have.property('documentation');
      expect(response.body).to.have.property('health');
    });
  });

  describe('GET /api-docs', () => {
    it('should serve Swagger documentation', async () => {
      await testApp
        .get('/api-docs/')
        .expect(200)
        .expect('Content-Type', /text\/html/);
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await testApp
        .get('/nonexistent-route')
        .expect(404);

      expect(response.body).to.have.property('error');
      expect(response.body.error).to.equal('Route not found');
      expect(response.body).to.have.property('method');
      expect(response.body).to.have.property('url');
      expect(response.body).to.have.property('timestamp');
    });
  });
});
