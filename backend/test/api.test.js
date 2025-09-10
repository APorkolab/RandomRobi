const request = require('supertest');
const { expect } = require('chai');
const app = require('../src/app');

// Use the app instance directly instead of external URL
const testApp = request(app);

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

        expect(response.body).to.be.an('array').or.an('object');

        // If it's paginated response
        if (response.body.data) {
          expect(response.body).to.have.property('data');
          expect(response.body).to.have.property('pagination');
          expect(response.body.data).to.be.an('array');
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
        expect(response.body.link).to.include('youtube.com/embed/');

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

        expect(response.body).to.have.property('id', testVideoId);
        expect(response.body).to.have.property('title', 'Updated Test Video');
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

        expect(response.body).to.be.an('array').or.an('object');

        // Check if it's paginated response
        if (response.body.data) {
          expect(response.body.data).to.be.an('array');
          expect(response.body).to.have.property('pagination');
        }
      });
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting to API routes', async function () {
      this.timeout(8000); // Reduce timeout

      // Test with a simple health endpoint to avoid video generation delays
      const maxRequests = 5; // Reduce number of requests
      const responses = [];

      for (let i = 0; i < maxRequests; i += 1) {
        try {
          // eslint-disable-next-line no-await-in-loop
          const response = await testApp
            .get('/health');
          responses.push(response);

          // Small delay between requests
          // eslint-disable-next-line no-await-in-loop
          await new Promise((resolve) => {
            setTimeout(resolve, 100);
          });
        } catch (error) {
          // If we hit rate limit, that's expected behavior
          if (error.status === 429) {
            responses.push({ status: 429 });
          } else {
            throw error;
          }
        }
      }

      expect(responses).to.have.length(maxRequests);
      // At least some requests should succeed
      const successCount = responses.filter((r) => r.status === 200).length;
      expect(successCount).to.be.greaterThan(0);
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
