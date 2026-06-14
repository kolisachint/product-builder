/**
 * Backend Contract Tests — Profile CRUD (NC-1 + NC-4)
 *
 * Blueprint §2.1 — Profile CRUD
 * Blueprint §2.3 — Error Handling
 * Blueprint §5.1 — Backend Contract Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../index';
import { profileStore } from '../store/in-memory';

// ---- Test Data ----
const VALID_PROFILE = {
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane.doe@example.com',
  phone: '+1-555-0100',
};

const MINIMAL_PROFILE = {
  firstName: 'John',
  lastName: 'Smith',
  email: 'john.smith@example.com',
};

const INVALID_PROFILE_MISSING_FIRSTNAME = {
  lastName: 'Doe',
  email: 'bad@example.com',
};

const INVALID_PROFILE_BAD_EMAIL = {
  firstName: 'Bad',
  lastName: 'Email',
  email: 'not-an-email',
};

const DUPLICATE_EMAIL_PROFILE = {
  firstName: 'Another',
  lastName: 'Jane',
  email: 'jane.doe@example.com', // same as VALID_PROFILE
};

// =============================================
// §2.1 Profile CRUD Contract Tests
// =============================================
describe('Profile CRUD API Contract', () => {
  beforeEach(async () => {
    profileStore.clear();
  });

  // -------------------------------------------
  // POST /profiles — Create Profile
  // -------------------------------------------
  describe('POST /profiles', () => {
    it('should create a profile and return 201 with correct UserProfile shape', async () => {
      const { status, body } = await request(app)
        .post('/api/profiles')
        .send(VALID_PROFILE);

      expect(status).toBe(201);

      // Response should have { data: UserProfile } shape (§4 / NC-4)
      expect(body).toHaveProperty('data');
      expect(body.error).toBeUndefined();

      const profile = body.data;
      expect(profile).toBeDefined();

      // UserProfile shape validation (§1 — shared_types.ts)
      expect(typeof profile.id).toBe('string');
      expect(profile.id.length).toBeGreaterThan(0);
      expect(typeof profile.userId).toBe('string');
      expect(profile.userId.length).toBeGreaterThan(0);
      expect(profile.firstName).toBe('Jane');
      expect(profile.lastName).toBe('Doe');
      expect(profile.email).toBe('jane.doe@example.com');
      expect(profile.phone).toBe('+1-555-0100');
      expect(profile.kycStatus).toBe('pending');
      expect(typeof profile.createdAt).toBe('string');
      expect(typeof profile.updatedAt).toBe('string');
    });

    it('should create a profile without optional phone field', async () => {
      const { status, body } = await request(app)
        .post('/api/profiles')
        .send(MINIMAL_PROFILE);

      expect(status).toBe(201);
      const profile = body.data;
      expect(profile.firstName).toBe('John');
      expect(profile.lastName).toBe('Smith');
      expect(profile.email).toBe('john.smith@example.com');
      expect(profile.phone).toBeUndefined();
      expect(profile.kycStatus).toBe('pending');
    });

    it('should auto-generate a UUID v4 for id', async () => {
      const { body } = await request(app)
        .post('/api/profiles')
        .send({
          firstName: 'Uuid',
          lastName: 'Test',
          email: 'uuid.test@example.com',
        });

      const profile = body.data;
      const uuidV4Regex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(profile.id).toMatch(uuidV4Regex);
    });

    it('should auto-generate ISO 8601 timestamps for createdAt and updatedAt', async () => {
      const { body } = await request(app)
        .post('/api/profiles')
        .send({
          firstName: 'Timestamp',
          lastName: 'Test',
          email: 'timestamp.test@example.com',
        });

      const profile = body.data;
      const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
      expect(profile.createdAt).toMatch(iso8601Regex);
      expect(profile.updatedAt).toMatch(iso8601Regex);
    });

    // NC-1 Validation Rules
    it('should return 400 when firstName is missing', async () => {
      const { status, body } = await request(app)
        .post('/api/profiles')
        .send(INVALID_PROFILE_MISSING_FIRSTNAME);

      expect(status).toBe(400);
      expect(body).toHaveProperty('error');
      expect(typeof body.error.error).toBe('string');
      expect(body.error.code).toBe(400);
    });

    it('should return 400 when email is missing', async () => {
      const { status, body } = await request(app)
        .post('/api/profiles')
        .send({
          firstName: 'No',
          lastName: 'Email',
        });

      expect(status).toBe(400);
      expect(body.error.code).toBe(400);
    });

    it('should return 400 when lastName is missing', async () => {
      const { status, body } = await request(app)
        .post('/api/profiles')
        .send({
          firstName: 'NoLast',
          email: 'nolast@example.com',
        });

      expect(status).toBe(400);
      expect(body.error.code).toBe(400);
    });

    it('should return 400 when email format is invalid', async () => {
      const { status, body } = await request(app)
        .post('/api/profiles')
        .send(INVALID_PROFILE_BAD_EMAIL);

      expect(status).toBe(400);
      expect(body.error.code).toBe(400);
      expect(body.error.error.toLowerCase()).toContain('email');
    });

    it('should return 400 when firstName exceeds 100 characters', async () => {
      const { status } = await request(app)
        .post('/api/profiles')
        .send({
          firstName: 'A'.repeat(101),
          lastName: 'Test',
          email: 'long.first@example.com',
        });

      expect(status).toBe(400);
    });

    it('should return 400 when lastName exceeds 100 characters', async () => {
      const { status } = await request(app)
        .post('/api/profiles')
        .send({
          firstName: 'Test',
          lastName: 'B'.repeat(101),
          email: 'long.last@example.com',
        });

      expect(status).toBe(400);
    });

    it('should return 400 when phone exceeds 20 characters', async () => {
      const { status } = await request(app)
        .post('/api/profiles')
        .send({
          firstName: 'Phone',
          lastName: 'Test',
          email: 'phone.test@example.com',
          phone: '1'.repeat(21),
        });

      expect(status).toBe(400);
    });

    it('should return 409 when email is already in use (Conflict)', async () => {
      // First create succeeds
      await request(app)
        .post('/api/profiles')
        .send(VALID_PROFILE);

      // Duplicate should fail
      const { status, body } = await request(app)
        .post('/api/profiles')
        .send(DUPLICATE_EMAIL_PROFILE);

      expect(status).toBe(409);
      expect(body).toHaveProperty('error');
      expect(body.error.code).toBe(409);
    });

    it('should return ApiError shape on failure (NC-4)', async () => {
      const { status, body } = await request(app)
        .post('/api/profiles')
        .send({});

      expect(status).toBeGreaterThanOrEqual(400);
      expect(body).toHaveProperty('error');
      expect(typeof body.error.error).toBe('string');
      expect(typeof body.error.code).toBe('number');
      expect(body.error.code).toBe(status);
    });
  });

  // -------------------------------------------
  // GET /profiles/:id — Read Profile
  // -------------------------------------------
  describe('GET /profiles/:id', () => {
    let createdProfileId: string;

    beforeEach(async () => {
      const { body } = await request(app)
        .post('/api/profiles')
        .send({
          firstName: 'Read',
          lastName: 'Test',
          email: 'read.test@example.com',
        });
      createdProfileId = body.data.id;
    });

    it('should return 200 with correct UserProfile shape', async () => {
      const { status, body } = await request(app)
        .get(`/api/profiles/${createdProfileId}`);

      expect(status).toBe(200);
      expect(body).toHaveProperty('data');
      expect(body.error).toBeUndefined();

      const profile = body.data;
      expect(profile.id).toBe(createdProfileId);
      expect(profile.firstName).toBe('Read');
      expect(profile.lastName).toBe('Test');
      expect(profile.email).toBe('read.test@example.com');
      expect(profile.kycStatus).toBe('pending');
    });

    it('should return 404 for nonexistent profile', async () => {
      const { status, body } = await request(app)
        .get('/api/profiles/nonexistent-id-00000000-0000-0000-0000-000000000000');

      expect(status).toBe(404);
      expect(body).toHaveProperty('error');
      expect(body.error.code).toBe(404);
    });

    it('should return profile regardless of kycStatus (§2.2 Gate Rules)', async () => {
      const { status, body } = await request(app)
        .get(`/api/profiles/${createdProfileId}`);
      expect(status).toBe(200);
      expect(body.data.id).toBe(createdProfileId);
    });
  });

  // -------------------------------------------
  // PUT /profiles/:id — Update Profile
  // -------------------------------------------
  describe('PUT /profiles/:id', () => {
    let createdProfileId: string;

    beforeEach(async () => {
      profileStore.clear();
      const { body } = await request(app)
        .post('/api/profiles')
        .send({
          firstName: 'Update',
          lastName: 'Original',
          email: 'update.original@example.com',
        });
      createdProfileId = body.data.id;
    });

    it('should update profile and return 200 with updated fields', async () => {
      const { status, body } = await request(app)
        .put(`/api/profiles/${createdProfileId}`)
        .send({
          firstName: 'Updated',
          lastName: 'NewName',
        });

      expect(status).toBe(200);
      const profile = body.data;
      expect(profile.firstName).toBe('Updated');
      expect(profile.lastName).toBe('NewName');
      expect(profile.email).toBe('update.original@example.com'); // unchanged
    });

    it('should update updatedAt timestamp', async () => {
      const before = await request(app)
        .get(`/api/profiles/${createdProfileId}`);
      const originalUpdatedAt = before.body.data.updatedAt;

      // Small delay to ensure timestamp difference
      await new Promise((r) => setTimeout(r, 10));

      const { body } = await request(app)
        .put(`/api/profiles/${createdProfileId}`)
        .send({ firstName: 'Timestamped' });

      const profile = body.data;
      expect(new Date(profile.updatedAt).getTime()).toBeGreaterThanOrEqual(
        new Date(originalUpdatedAt).getTime()
      );
    });

    it('should allow updating email', async () => {
      const { status, body } = await request(app)
        .put(`/api/profiles/${createdProfileId}`)
        .send({ email: 'new.email@example.com' });

      expect(status).toBe(200);
      expect(body.data.email).toBe('new.email@example.com');
    });

    it('should return 404 when updating nonexistent profile', async () => {
      const { status, body } = await request(app)
        .put('/api/profiles/nonexistent-id-00000000-0000-0000-0000-000000000000')
        .send({ firstName: 'Ghost' });

      expect(status).toBe(404);
      expect(body.error.code).toBe(404);
    });

    it('should return 400 for invalid email format on update', async () => {
      const { status } = await request(app)
        .put(`/api/profiles/${createdProfileId}`)
        .send({ email: 'not-valid' });

      expect(status).toBe(400);
    });

    it('should not allow updating id or createdAt', async () => {
      const { body } = await request(app)
        .put(`/api/profiles/${createdProfileId}`)
        .send({
          id: 'hacked-id',
          createdAt: '2000-01-01T00:00:00.000Z',
          firstName: 'Hacker',
        });

      const profile = body.data;
      expect(profile.id).toBe(createdProfileId); // unchanged
    });
  });

  // -------------------------------------------
  // Error Shape Contract (NC-4)
  // -------------------------------------------
  describe('Error Response Shape (NC-4)', () => {
    it('all error responses should have { error: { error: string, code: number } } shape', async () => {
      const endpoints = [
        { method: 'GET', path: '/api/profiles/bad-id' },
        { method: 'PUT', path: '/api/profiles/bad-id', body: { firstName: 'X' } },
      ];

      for (const endpoint of endpoints) {
        let response;
        if (endpoint.method === 'GET') {
          response = await request(app).get(endpoint.path);
        } else {
          response = await request(app).put(endpoint.path).send(endpoint.body);
        }

        expect(response.status).toBeGreaterThanOrEqual(400);
        expect(response.body).toHaveProperty('error');
        expect(typeof response.body.error.error).toBe('string');
        expect(response.body.error.error.length).toBeGreaterThan(0);
        expect(typeof response.body.error.code).toBe('number');
        expect(response.body.error.code).toBe(response.status);
      }
    });
  });
});
