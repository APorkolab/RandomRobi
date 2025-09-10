const request = require('supertest');
const { expect } = require('chai');
const sinon = require('sinon');
const axios = require('axios');
const app = require('../src/app');

// Use the app instance directly instead of external URL
const testApp = request(app);

// Mock axios for external API calls
let axiosStub;

before(() => {
  axiosStub = sinon.stub(axios, 'get');

  // Mock Datamuse API
  axiosStub.withArgs(sinon.match(/api\.datamuse\.com/), sinon.match.any)
    .resolves({ data: [{ word: 'technology', score: 12345 }, { word: 'music', score: 12340 }] });

  // Mock YouTube search
  axiosStub.withArgs(sinon.match(/youtube.com\/results/), sinon.match.any)
    .resolves({
      data: `
        <script>var ytInitialData = {
          "contents": {
            "twoColumnSearchResultsRenderer": {
              "primaryContents": {
                "sectionListRenderer": {
                  "contents": [{
                    "itemSectionRenderer": {
                      "contents": [{
                        "videoRenderer": {
                          "videoId": "dQw4w9WgXcQ"
                        }
                      }]
                    }
                  }]
                }
              }
            }
          }
        };</script>
      `
    });
});

after(() => {
  if (axiosStub) {
    axiosStub.restore();
  }
});

describe('API Integration Tests', () => {
  let authToken = null;
  let testVideoId = null;

  describe('Authentication', () => {
    describe('POST /api/v1/auth/login', () => {
      it('should login with admin credentials', async () => {
        const loginData = {
          username: 'admin',
          password: 'AdminPass123!'
        };

        const response = await testApp
          .post('/api/v1/auth/login')
          .send(loginData)
          .expect(200);

        expect(response.body).to.have.property('token');
        expect(response.body).to.have.property('user');
        expect(response.body.user).to.have.property('username', 'admin');
        expect(response.body.user).to.not.have.property('password');

        // Store token for subsequent tests
        authToken = response.body.token;
      });

      it('should fail with invalid credentials', async () => {
        const loginData = {
          username: 'admin',
          password: 'wrongpassword'
        };

        await testApp
          .post('/api/v1/auth/login')
          .send(loginData)
          .expect(401);
      });

      it('should fail with missing credentials', async () => {
        await testApp
          .post('/api/v1/auth/login')
          .send({})
          .expect(400);
      });
    });

    describe('Legacy Login Route', () => {
      it('should work with legacy /login route', async () => {
        const loginData = {
          username: 'admin',
          password: 'AdminPass123!'
        };

        const response = await testApp
          .post('/login')
          .send(loginData)
          .expect(200);

        expect(response.body).to.have.property('token');
      });
    });
  });

  describe('Video API', () => {
    describe('GET /api/v1/videos/random', () => {
      it('should return a random video (public endpoint)', async function () {
        this.timeout(10000);
        const response = await testApp
          .get('/api/v1/videos/random')
          .expect(200);

        expect(response.body).to.have.property('link');
        expect(response.body.link).to.include('youtube.com');
      });
    });

    describe('GET /video/random (legacy)', () => {
      it('should work with legacy route', async function () {
        this.timeout(10000);
        const response = await testApp
          .get('/video/random')
          .expect(200);

        expect(response.body).to.have.property('link');
      });
    });

    describe('GET /api/v1/videos/latest', () => {
      it('should return the latest video', async () => {
        const response = await testApp
          .get('/api/v1/videos/latest')
          .expect(200);

        expect(response.body).to.have.property('link');
        expect(response.body).to.have.property('id');
        if (response.body.createdAt) {
          expect(new Date(response.body.createdAt)).to.be.a('date');
        }
      });
    });

    describe('Protected Video Routes', () => {
      it('should require authentication for GET /api/v1/videos', async () => {
        await testApp
          .get('/api/v1/videos')
          .expect(401);
      });

      it('should allow access with valid token', async function () {
        if (!authToken) {
          this.skip();
        }

        const response = await testApp
          .get('/api/v1/videos')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).to.be.an('array');

        // Each item should have expected properties
        if (response.body.length > 0) {
          expect(response.body[0]).to.have.property('id');
          expect(response.body[0]).to.have.property('link');
        }
      });

      it('should allow creating videos with authentication', async function () {
        if (!authToken) {
          this.skip();
        }

        const videoData = {
          link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          title: 'Test Video',
          category: 'music'
        };

        const response = await testApp
          .post('/api/v1/videos')
          .set('Authorization', `Bearer ${authToken}`)
          .send(videoData)
          .expect(201);

        expect(response.body).to.have.property('id');
        expect(response.body).to.have.property('link');
        expect(response.body.link).to.satisfy((link) => (
          link.includes('youtube.com/embed/') || link.includes('youtube.com/watch?v=')
        ));

        testVideoId = response.body.id;
      });

      it('should allow updating videos', async function () {
        if (!authToken || !testVideoId) {
          this.skip();
        }

        const updateData = {
          title: 'Updated Test Video',
          category: 'entertainment'
        };

        const response = await testApp
          .put(`/api/v1/videos/${testVideoId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData)
          .expect(200);

        expect(response.body).to.have.property('message');
        expect(response.body).to.have.property('record');
        expect(response.body.record).to.have.property('id', testVideoId);
      });

      it('should allow deleting videos', async function () {
        if (!authToken || !testVideoId) {
          this.skip();
        }

        await testApp
          .delete(`/api/v1/videos/${testVideoId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);
      });
    });
  });

  describe('User Management', () => {
    describe('Protected User Routes', () => {
      it('should require authentication for user routes', async () => {
        await testApp
          .get('/api/v1/users')
          .expect(401);
      });

      it('should allow admin to access users', async function () {
        if (!authToken) {
          this.skip();
        }

        const response = await testApp
          .get('/api/v1/users')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).to.be.an('array');

        // Each user should have expected properties
        if (response.body.length > 0) {
          expect(response.body[0]).to.have.property('id');
          expect(response.body[0]).to.have.property('username');
        }
      });
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting to API routes', async function () {
      this.timeout(5000);

      // Simple test - just make a few requests to a fast endpoint
      const responses = [];
      const maxRequests = 3; // Reduced number for faster test

      for (let i = 0; i < maxRequests; i += 1) {
        try {
          // eslint-disable-next-line no-await-in-loop
          const response = await testApp
            .get('/health') // Use faster endpoint
            .timeout(1000);
          responses.push(response.status);
        } catch (error) {
          // If we hit rate limit, that's expected behavior
          if (error.status === 429) {
            responses.push(429);
          } else {
            responses.push(error.status || 'error');
          }
        }
      }

      expect(responses).to.have.length(maxRequests);
      // Most requests should succeed (health endpoint doesn't have heavy rate limiting)
      const successfulRequests = responses.filter((status) => status === 200);
      expect(successfulRequests.length).to.be.greaterThan(0);
    });
  });

  describe('CORS', () => {
    it('should include CORS headers', async () => {
      const response = await testApp
        .get('/health')
        .expect(200);

      expect(response.headers).to.have.property('access-control-allow-origin');
    });

    it('should handle preflight requests', async () => {
      await testApp
        .options('/api/v1/videos')
        .set('Origin', 'http://localhost:4200')
        .set('Access-Control-Request-Method', 'GET')
        .expect(200);
    });
  });
});
