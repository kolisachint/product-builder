/**
 * Backend Contract Tests — KYC Gating (NC-2)
 *
 * Blueprint §2.2 — KYC Gating
 * Blueprint §5.1 — Backend Contract Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../index';
import { profileStore } from '../store/in-memory';

describe('KYC Gating API Contract', () => {
  let profileId: string;

  beforeEach(async () => {
    profileStore.clear();

    // Create a profile for KYC tests
    const response = await request(app)
      .post('/api/profiles')
      .send({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      })
      .expect(201);

    profileId = response.body.data.id;
  });

  // -------------------------------------------
  // POST /profiles/:id/kyc — Submit KYC Documents
  // -------------------------------------------
  describe('POST /profiles/:id/kyc', () => {
    it('should submit KYC documents and return 201', async () => {
      const { status, body } = await request(app)
        .post(`/api/profiles/${profileId}/kyc`)
        .send({
          documentType: 'passport',
          documentUrl: 'https://example.com/passport.pdf',
        });

      expect(status).toBe(201);
      expect(body.data).toBeDefined();
      expect(body.data.kycStatus).toBe('pending');
      expect(body.data.id).toBe(profileId);
    });

    it('should return 400 when documentType is missing', async () => {
      const { status, body } = await request(app)
        .post(`/api/profiles/${profileId}/kyc`)
        .send({
          documentUrl: 'https://example.com/passport.pdf',
        });

      expect(status).toBe(400);
      expect(body.error).toBeDefined();
      expect(body.error.code).toBe(400);
    });

    it('should return 400 when documentUrl is missing', async () => {
      const { status, body } = await request(app)
        .post(`/api/profiles/${profileId}/kyc`)
        .send({
          documentType: 'passport',
        });

      expect(status).toBe(400);
      expect(body.error).toBeDefined();
      expect(body.error.code).toBe(400);
    });

    it('should return 409 when KYC is already pending', async () => {
      // First submission succeeds
      await request(app)
        .post(`/api/profiles/${profileId}/kyc`)
        .send({
          documentType: 'passport',
          documentUrl: 'https://example.com/passport.pdf',
        })
        .expect(201);

      // Second submission while pending returns 409
      const { status, body } = await request(app)
        .post(`/api/profiles/${profileId}/kyc`)
        .send({
          documentType: 'drivers_license',
          documentUrl: 'https://example.com/license.pdf',
        });

      expect(status).toBe(409);
      expect(body.error).toBeDefined();
      expect(body.error.code).toBe(409);
    });

    it('should return 409 when KYC is already verified', async () => {
      // Submit then approve
      await request(app)
        .post(`/api/profiles/${profileId}/kyc`)
        .send({
          documentType: 'passport',
          documentUrl: 'https://example.com/passport.pdf',
        });

      await request(app)
        .patch(`/api/profiles/${profileId}/kyc`)
        .send({ status: 'verified' });

      // Try to submit again — should be 409
      const { status, body } = await request(app)
        .post(`/api/profiles/${profileId}/kyc`)
        .send({
          documentType: 'passport',
          documentUrl: 'https://example.com/passport.pdf',
        });

      expect(status).toBe(409);
      expect(body.error.code).toBe(409);
    });

    it('should return 404 for non-existent profile', async () => {
      const { status, body } = await request(app)
        .post('/api/profiles/non-existent-id/kyc')
        .send({
          documentType: 'passport',
          documentUrl: 'https://example.com/passport.pdf',
        });

      expect(status).toBe(404);
      expect(body.error).toBeDefined();
      expect(body.error.code).toBe(404);
    });

    it('should allow resubmission after rejection', async () => {
      // Submit, then reject
      await request(app)
        .post(`/api/profiles/${profileId}/kyc`)
        .send({
          documentType: 'passport',
          documentUrl: 'https://example.com/passport.pdf',
        });

      await request(app)
        .patch(`/api/profiles/${profileId}/kyc`)
        .send({
          status: 'rejected',
          reason: 'Document is blurry',
        });

      // Resubmit — should succeed with 201
      const { status, body } = await request(app)
        .post(`/api/profiles/${profileId}/kyc`)
        .send({
          documentType: 'passport',
          documentUrl: 'https://example.com/new-passport.pdf',
        });

      expect(status).toBe(201);
      expect(body.data.kycStatus).toBe('pending');
    });

    it('should return ApiError shape on failure (NC-4)', async () => {
      const { status, body } = await request(app)
        .post(`/api/profiles/${profileId}/kyc`)
        .send({});

      expect(status).toBeGreaterThanOrEqual(400);
      expect(body).toHaveProperty('error');
      expect(typeof body.error.error).toBe('string');
      expect(typeof body.error.code).toBe('number');
      expect(body.error.code).toBe(status);
    });
  });

  // -------------------------------------------
  // PATCH /profiles/:id/kyc — Admin Review
  // -------------------------------------------
  describe('PATCH /profiles/:id/kyc', () => {
    beforeEach(async () => {
      // Submit KYC first
      await request(app)
        .post(`/api/profiles/${profileId}/kyc`)
        .send({
          documentType: 'passport',
          documentUrl: 'https://example.com/passport.pdf',
        })
        .expect(201);
    });

    it('should approve KYC and return 200', async () => {
      const { status, body } = await request(app)
        .patch(`/api/profiles/${profileId}/kyc`)
        .send({
          status: 'verified',
        });

      expect(status).toBe(200);
      expect(body.data).toBeDefined();
      expect(body.data.kycStatus).toBe('verified');
    });

    it('should reject KYC with reason', async () => {
      const { status, body } = await request(app)
        .patch(`/api/profiles/${profileId}/kyc`)
        .send({
          status: 'rejected',
          reason: 'Document is blurry',
        });

      expect(status).toBe(200);
      expect(body.data).toBeDefined();
      expect(body.data.kycStatus).toBe('rejected');
    });

    it('should return 400 when rejecting without reason', async () => {
      const { status, body } = await request(app)
        .patch(`/api/profiles/${profileId}/kyc`)
        .send({
          status: 'rejected',
        });

      expect(status).toBe(400);
      expect(body.error).toBeDefined();
      expect(body.error.code).toBe(400);
    });

    it('should return 409 when KYC is already verified', async () => {
      await request(app)
        .patch(`/api/profiles/${profileId}/kyc`)
        .send({ status: 'verified' });

      const { status, body } = await request(app)
        .patch(`/api/profiles/${profileId}/kyc`)
        .send({
          status: 'rejected',
          reason: 'Changed mind',
        });

      expect(status).toBe(409);
      expect(body.error).toBeDefined();
      expect(body.error.code).toBe(409);
    });

    it('should return 409 when KYC is already rejected', async () => {
      await request(app)
        .patch(`/api/profiles/${profileId}/kyc`)
        .send({
          status: 'rejected',
          reason: 'Document is blurry',
        });

      const { status, body } = await request(app)
        .patch(`/api/profiles/${profileId}/kyc`)
        .send({
          status: 'verified',
        });

      expect(status).toBe(409);
      expect(body.error).toBeDefined();
      expect(body.error.code).toBe(409);
    });

    it('should return 404 for non-existent profile', async () => {
      const { status, body } = await request(app)
        .patch('/api/profiles/non-existent-id/kyc')
        .send({ status: 'verified' });

      expect(status).toBe(404);
      expect(body.error.code).toBe(404);
    });

    it('should return ApiError shape on failure (NC-4)', async () => {
      const { status, body } = await request(app)
        .patch(`/api/profiles/${profileId}/kyc`)
        .send({});

      expect(status).toBeGreaterThanOrEqual(400);
      expect(body).toHaveProperty('error');
      expect(typeof body.error.error).toBe('string');
      expect(typeof body.error.code).toBe('number');
      expect(body.error.code).toBe(status);
    });
  });

  // -------------------------------------------
  // State Machine Transitions
  // -------------------------------------------
  describe('KYC State Machine', () => {
    it('should follow pending → verified transition', async () => {
      const { body: created } = await request(app)
        .post('/api/profiles')
        .send({
          firstName: 'State',
          lastName: 'Machine',
          email: 'state.machine@example.com',
        });

      const id = created.data.id;

      // Submit
      await request(app)
        .post(`/api/profiles/${id}/kyc`)
        .send({ documentType: 'passport', documentUrl: 'http://example.com/doc' })
        .expect(201);

      // Verify
      const { body } = await request(app)
        .patch(`/api/profiles/${id}/kyc`)
        .send({ status: 'verified' })
        .expect(200);

      expect(body.data.kycStatus).toBe('verified');
    });

    it('should follow pending → rejected transition', async () => {
      const { body: created } = await request(app)
        .post('/api/profiles')
        .send({
          firstName: 'Reject',
          lastName: 'State',
          email: 'reject.state@example.com',
        });

      const id = created.data.id;

      // Submit
      await request(app)
        .post(`/api/profiles/${id}/kyc`)
        .send({ documentType: 'passport', documentUrl: 'http://example.com/doc' })
        .expect(201);

      // Reject
      const { body } = await request(app)
        .patch(`/api/profiles/${id}/kyc`)
        .send({ status: 'rejected', reason: 'Not valid' })
        .expect(200);

      expect(body.data.kycStatus).toBe('rejected');
    });

    it('should follow rejected → pending (resubmit) transition', async () => {
      const { body: created } = await request(app)
        .post('/api/profiles')
        .send({
          firstName: 'Resubmit',
          lastName: 'State',
          email: 'resubmit.state@example.com',
        });

      const id = created.data.id;

      // Submit
      await request(app)
        .post(`/api/profiles/${id}/kyc`)
        .send({ documentType: 'passport', documentUrl: 'http://example.com/doc' })
        .expect(201);

      // Reject
      await request(app)
        .patch(`/api/profiles/${id}/kyc`)
        .send({ status: 'rejected', reason: 'Not valid' })
        .expect(200);

      // Resubmit
      const { body } = await request(app)
        .post(`/api/profiles/${id}/kyc`)
        .send({ documentType: 'passport', documentUrl: 'http://example.com/doc2' })
        .expect(201);

      expect(body.data.kycStatus).toBe('pending');
    });
  });
});
