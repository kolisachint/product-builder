/**
 * Blueprint Contract Conformance Tests — API Edge Cases (NC-1, NC-2, NC-4)
 *
 * These tests verify specific contract requirements from the blueprint
 * that are NOT covered by the existing test suite. Tests that fail
 * expose gaps between the implementation and the blueprint specification.
 *
 * Blueprint §1   — Shared Types (KycStatus enum, field types)
 * Blueprint §2.1 — Profile CRUD validation rules
 * Blueprint §2.2 — KYC Gating state machine rules
 * Blueprint §2.3 — Backend Architecture (health endpoint)
 * Blueprint §6   — Constraints & Conventions
 */

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../index';
import { profileStore } from '../store/in-memory';

// =============================================
// §2.3 — Health Endpoint Contract
// =============================================
describe('Health Endpoint (§2.3)', () => {
  it('should return 200 with { status: "ok" } at GET /health', async () => {
    const { status, body } = await request(app).get('/health');
    expect(status).toBe(200);
    expect(body).toEqual({ status: 'ok' });
  });
});

// =============================================
// §2.1 — Profile CRUD: Type-Safety Validation
// =============================================
describe('Profile CRUD — Type Safety Contract (§2.1, §1)', () => {
  beforeEach(async () => {
    profileStore.clear();
  });

  /**
   * Blueprint §1.1: `firstName: string` — required, 1–100 chars
   * The validation MUST reject non-string types at runtime,
   * not just empty strings.
   */
  it('should reject non-string firstName with 400', async () => {
    const { status, body } = await request(app)
      .post('/api/profiles')
      .send({ firstName: 123, lastName: 'Test', email: 'type.test@example.com' });

    expect(status).toBe(400);
    expect(body.error).toBeDefined();
    expect(body.error.code).toBe(400);
  });

  it('should reject non-string lastName with 400', async () => {
    const { status, body } = await request(app)
      .post('/api/profiles')
      .send({ firstName: 'Test', lastName: true, email: 'type.test2@example.com' });

    expect(status).toBe(400);
    expect(body.error).toBeDefined();
    expect(body.error.code).toBe(400);
  });

  it('should reject non-string email with 400', async () => {
    const { status, body } = await request(app)
      .post('/api/profiles')
      .send({ firstName: 'Test', lastName: 'User', email: null });

    expect(status).toBe(400);
    expect(body.error).toBeDefined();
    expect(body.error.code).toBe(400);
  });

  it('should reject empty string firstName with 400', async () => {
    const { status } = await request(app)
      .post('/api/profiles')
      .send({ firstName: '', lastName: 'Test', email: 'empty.first@example.com' });

    expect(status).toBe(400);
  });

  it('should reject empty string lastName with 400', async () => {
    const { status } = await request(app)
      .post('/api/profiles')
      .send({ firstName: 'Test', lastName: '', email: 'empty.last@example.com' });

    expect(status).toBe(400);
  });

  it('should reject empty string email with 400', async () => {
    const { status } = await request(app)
      .post('/api/profiles')
      .send({ firstName: 'Test', lastName: 'User', email: '' });

    expect(status).toBe(400);
  });

  it('should accept firstName exactly at boundary (1 char)', async () => {
    const { status } = await request(app)
      .post('/api/profiles')
      .send({ firstName: 'A', lastName: 'Test', email: 'boundary1@example.com' });

    expect(status).toBe(201);
  });

  it('should accept firstName exactly at boundary (100 chars)', async () => {
    const { status } = await request(app)
      .post('/api/profiles')
      .send({ firstName: 'A'.repeat(100), lastName: 'Test', email: 'boundary100@example.com' });

    expect(status).toBe(201);
  });
});

// =============================================
// §2.1 — PUT /profiles: Immutable Fields Enforcement
// =============================================
describe('Profile Update — Immutable Fields Contract (§2.1)', () => {
  let profileId: string;

  beforeEach(async () => {
    profileStore.clear();
    const { body } = await request(app)
      .post('/api/profiles')
      .send({
        firstName: 'Immutable',
        lastName: 'Test',
        email: 'immutable.test@example.com',
      });
    profileId = body.data.id;
  });

  it('should not allow id to be overwritten via PUT', async () => {
    const originalId = profileId;
    const { body } = await request(app)
      .put(`/api/profiles/${profileId}`)
      .send({ id: 'hacked-id-00000000-0000-0000-0000-000000000000' });

    expect(body.data.id).toBe(originalId);
  });

  it('should not allow createdAt to be overwritten via PUT', async () => {
    const { body: original } = await request(app)
      .get(`/api/profiles/${profileId}`);
    const originalCreatedAt = original.data.createdAt;

    const { body } = await request(app)
      .put(`/api/profiles/${profileId}`)
      .send({ createdAt: '2000-01-01T00:00:00.000Z' });

    expect(body.data.createdAt).toBe(originalCreatedAt);
  });

  it('should not allow userId to be overwritten via PUT', async () => {
    const { body: original } = await request(app)
      .get(`/api/profiles/${profileId}`);
    const originalUserId = original.data.userId;

    const { body } = await request(app)
      .put(`/api/profiles/${profileId}`)
      .send({ userId: 'hacked-user-id' });

    expect(body.data.userId).toBe(originalUserId);
  });

  it('should not allow kycStatus to be overwritten via PUT', async () => {
    const { body } = await request(app)
      .put(`/api/profiles/${profileId}`)
      .send({ kycStatus: 'verified' });

    expect(body.data.kycStatus).toBe('pending');
  });

  it('should return 400 when PUT body contains invalid email', async () => {
    const { status, body } = await request(app)
      .put(`/api/profiles/${profileId}`)
      .send({ email: 'not-valid-at-all' });

    expect(status).toBe(400);
    expect(body.error.code).toBe(400);
  });
});

// =============================================
// §2.2 — KYC Gating: Status Enum Validation
// =============================================
describe('KYC Review — Status Enum Validation (§2.2, §1.1)', () => {
  let profileId: string;

  beforeEach(async () => {
    profileStore.clear();

    // Create profile and submit docs
    const { body } = await request(app)
      .post('/api/profiles')
      .send({
        firstName: 'Enum',
        lastName: 'Test',
        email: 'enum.test@example.com',
      });
    profileId = body.data.id;

    await request(app)
      .post(`/api/profiles/${profileId}/kyc`)
      .send({
        documentType: 'passport',
        documentUrl: 'https://example.com/passport.pdf',
      })
      .expect(201);
  });

  /**
   * Blueprint §1.1: KycReviewRequest.status: "verified" | "rejected"
   * The backend MUST reject any status value not in this union.
   */
  it('should reject PATCH /kyc with status "invalid" (not in enum)', async () => {
    const { status, body } = await request(app)
      .patch(`/api/profiles/${profileId}/kyc`)
      .send({ status: 'invalid' });

    expect(status).toBe(400);
    expect(body.error).toBeDefined();
    expect(body.error.code).toBe(400);
  });

  it('should reject PATCH /kyc with status "pending" (not a valid review action)', async () => {
    const { status, body } = await request(app)
      .patch(`/api/profiles/${profileId}/kyc`)
      .send({ status: 'pending' });

    expect(status).toBe(400);
    expect(body.error).toBeDefined();
    expect(body.error.code).toBe(400);
  });

  it('should reject PATCH /kyc with empty string status', async () => {
    const { status, body } = await request(app)
      .patch(`/api/profiles/${profileId}/kyc`)
      .send({ status: '' });

    expect(status).toBe(400);
    expect(body.error).toBeDefined();
  });

  it('should reject PATCH /kyc with numeric status', async () => {
    const { status, body } = await request(app)
      .patch(`/api/profiles/${profileId}/kyc`)
      .send({ status: 1 });

    expect(status).toBe(400);
    expect(body.error).toBeDefined();
  });

  it('should reject PATCH /kyc with null status', async () => {
    const { status, body } = await request(app)
      .patch(`/api/profiles/${profileId}/kyc`)
      .send({ status: null });

    expect(status).toBe(400);
    expect(body.error).toBeDefined();
  });

  /**
   * Verify that valid statuses still work correctly after rejecting invalid ones.
   */
  it('should still accept valid "verified" status after rejecting invalid', async () => {
    // First reject invalid status
    await request(app)
      .patch(`/api/profiles/${profileId}/kyc`)
      .send({ status: 'invalid' })
      .expect(400);

    // Then valid status should still work
    const { status, body } = await request(app)
      .patch(`/api/profiles/${profileId}/kyc`)
      .send({ status: 'verified' });

    expect(status).toBe(200);
    expect(body.data.kycStatus).toBe('verified');
  });
});

// =============================================
// §2.2 — KYC Gating: Review Without Document Submission
// =============================================
describe('KYC Review Without Document Submission (§2.2)', () => {
  let profileId: string;

  beforeEach(async () => {
    profileStore.clear();

    // Create profile but do NOT submit KYC docs
    const { body } = await request(app)
      .post('/api/profiles')
      .send({
        firstName: 'NoDocs',
        lastName: 'Test',
        email: 'no.docs.test@example.com',
      });
    profileId = body.data.id;
  });

  /**
   * Blueprint §2.2: "No KYC documents submitted yet" → 400
   */
  it('should return 400 when reviewing KYC without prior document submission', async () => {
    const { status, body } = await request(app)
      .patch(`/api/profiles/${profileId}/kyc`)
      .send({ status: 'verified' });

    expect(status).toBe(400);
    expect(body.error).toBeDefined();
    expect(body.error.code).toBe(400);
    expect(body.error.error).toContain('No KYC documents submitted');
  });
});

// =============================================
// §2.1 — Profile Creation: Response Envelope (NC-4)
// =============================================
describe('API Response Envelope Contract (§6 Constraint #8, #4)', () => {
  beforeEach(async () => {
    profileStore.clear();
  });

  /**
   * Blueprint §6, #8: All responses wrapped in ApiResponse<T> envelope.
   * Success: { data: T } (no error field)
   * Error: { data: null, error: { error: string, code: number } }
   */
  it('success response should have data field and no error field', async () => {
    const { status, body } = await request(app)
      .post('/api/profiles')
      .send({
        firstName: 'Envelope',
        lastName: 'Test',
        email: 'envelope.test@example.com',
      });

    expect(status).toBe(201);
    expect(body).toHaveProperty('data');
    expect(body.data).not.toBeNull();
    expect(body.error).toBeUndefined();
  });

  it('error response should have data: null and error field', async () => {
    const { status, body } = await request(app)
      .get('/api/profiles/non-existent-id');

    expect(status).toBe(404);
    expect(body.data).toBeNull();
    expect(body.error).toBeDefined();
    expect(typeof body.error.error).toBe('string');
    expect(typeof body.error.code).toBe('number');
  });

  it('409 error should have correct code in error object', async () => {
    // Create a profile first
    await request(app)
      .post('/api/profiles')
      .send({
        firstName: 'Dup',
        lastName: 'Test',
        email: 'dup.envelope@example.com',
      });

    // Duplicate email → 409
    const { status, body } = await request(app)
      .post('/api/profiles')
      .send({
        firstName: 'Dup2',
        lastName: 'Test',
        email: 'dup.envelope@example.com',
      });

    expect(status).toBe(409);
    expect(body.error.code).toBe(409);
    expect(body.error.error).toContain('Email already in use');
  });
});

// =============================================
// §2.2 — KYC State Machine: Complete Matrix
// =============================================
describe('KYC State Machine — Complete Transition Matrix (§2.2)', () => {
  beforeEach(async () => {
    profileStore.clear();
  });

  /**
   * Blueprint §2.2 State Machine:
   * pending (no docs) → POST /kyc → pending (docs in) → PATCH /kyc → verified (FINAL)
   */
  it('should not allow resubmission once verified (final state)', async () => {
    const { body: created } = await request(app)
      .post('/api/profiles')
      .send({
        firstName: 'Final',
        lastName: 'State',
        email: 'final.state@example.com',
      });

    const id = created.data.id;

    // Submit docs
    await request(app)
      .post(`/api/profiles/${id}/kyc`)
      .send({ documentType: 'passport', documentUrl: 'https://example.com/doc.pdf' })
      .expect(201);

    // Verify
    await request(app)
      .patch(`/api/profiles/${id}/kyc`)
      .send({ status: 'verified' })
      .expect(200);

    // Attempt resubmission → should fail (409)
    const { status, body } = await request(app)
      .post(`/api/profiles/${id}/kyc`)
      .send({ documentType: 'passport', documentUrl: 'https://example.com/doc2.pdf' });

    expect(status).toBe(409);
    expect(body.error.code).toBe(409);
    expect(body.error.error).toContain('already verified');
  });

  /**
   * Blueprint §2.2: Once rejected, PATCH should return 409 "KYC already rejected"
   * (must resubmit via POST first)
   */
  it('should not allow reviewing again once rejected (must resubmit first)', async () => {
    const { body: created } = await request(app)
      .post('/api/profiles')
      .send({
        firstName: 'RejectDouble',
        lastName: 'Test',
        email: 'reject.double@example.com',
      });

    const id = created.data.id;

    // Submit
    await request(app)
      .post(`/api/profiles/${id}/kyc`)
      .send({ documentType: 'passport', documentUrl: 'https://example.com/doc.pdf' })
      .expect(201);

    // Reject
    await request(app)
      .patch(`/api/profiles/${id}/kyc`)
      .send({ status: 'rejected', reason: 'Blurry' })
      .expect(200);

    // Try to approve without resubmitting → 409
    const { status, body } = await request(app)
      .patch(`/api/profiles/${id}/kyc`)
      .send({ status: 'verified' });

    expect(status).toBe(409);
    expect(body.error.error).toContain('already rejected');
  });

  /**
   * Blueprint §2.2: Rejection clears submitted flag → resubmit → pending (docs in)
   */
  it('should allow full cycle: submit → reject → resubmit → verify', async () => {
    const { body: created } = await request(app)
      .post('/api/profiles')
      .send({
        firstName: 'FullCycle',
        lastName: 'Test',
        email: 'full.cycle@example.com',
      });

    const id = created.data.id;

    // Submit docs (pending → pending with docs)
    await request(app)
      .post(`/api/profiles/${id}/kyc`)
      .send({ documentType: 'passport', documentUrl: 'https://example.com/v1.pdf' })
      .expect(201);

    // Reject (pending → rejected, clears submitted flag)
    await request(app)
      .patch(`/api/profiles/${id}/kyc`)
      .send({ status: 'rejected', reason: 'Bad quality' })
      .expect(200);

    // Resubmit (rejected → pending with docs)
    await request(app)
      .post(`/api/profiles/${id}/kyc`)
      .send({ documentType: 'national_id', documentUrl: 'https://example.com/v2.pdf' })
      .expect(201);

    // Verify (pending → verified)
    const { status, body } = await request(app)
      .patch(`/api/profiles/${id}/kyc`)
      .send({ status: 'verified' });

    expect(status).toBe(200);
    expect(body.data.kycStatus).toBe('verified');
  });
});

// =============================================
// §6 — Constraint #6: shared_types.ts as Single Source of Truth
// =============================================
describe('Shared Types Module Contract (§6 #6)', () => {
  it('should import KycStatus values from shared_types', async () => {
    const shared = await import('../../shared/shared_types');
    // KycStatus is a type alias, not a runtime value.
    // But the module should load without error.
    expect(shared).toBeDefined();
  });

  /**
   * Blueprint §1.1: KycStatus = "pending" | "verified" | "rejected"
   * Verify the three valid status values are the only ones the system produces.
   */
  it('created profile should always start with kycStatus "pending"', async () => {
    const { body } = await request(app)
      .post('/api/profiles')
      .send({
        firstName: 'KycStart',
        lastName: 'Test',
        email: 'kyc.start@test.com',
      });

    expect(body.data.kycStatus).toBe('pending');
  });
});

// =============================================
// §2.1 — Duplicate Email: Error Message Content
// =============================================
describe('Profile CRUD — Duplicate Email Error Detail (§2.1)', () => {
  beforeEach(async () => {
    profileStore.clear();
  });

  it('should return "Email already in use" message on duplicate email', async () => {
    await request(app)
      .post('/api/profiles')
      .send({ firstName: 'First', lastName: 'User', email: 'dupe@test.com' });

    const { status, body } = await request(app)
      .post('/api/profiles')
      .send({ firstName: 'Second', lastName: 'User', email: 'dupe@test.com' });

    expect(status).toBe(409);
    expect(body.error.error).toBe('Email already in use');
  });

  it('should return 409 with proper error code when duplicate email on PUT', async () => {
    // Create two profiles
    const { body: profile1 } = await request(app)
      .post('/api/profiles')
      .send({ firstName: 'P1', lastName: 'Test', email: 'p1@test.com' });

    const { body: profile2 } = await request(app)
      .post('/api/profiles')
      .send({ firstName: 'P2', lastName: 'Test', email: 'p2@test.com' });

    // Try to change profile2's email to profile1's email
    const { status, body } = await request(app)
      .put(`/api/profiles/${profile2.data.id}`)
      .send({ email: 'p1@test.com' });

    expect(status).toBe(409);
    expect(body.error.code).toBe(409);
  });
});
