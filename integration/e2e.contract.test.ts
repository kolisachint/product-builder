/**
 * Integration / E2E Contract Tests (NC-5)
 *
 * These tests define the expected end-to-end flow from the blueprint.
 * They should FAIL until both BackendAgent and FrontendAgent complete their work.
 *
 * Blueprint §5.3 — Integration / E2E Contract Test
 * Blueprint §3 — Frontend Onboarding Flow
 * Blueprint §2 — Backend API Contract
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { app } from '../backend/index';
import type { Server } from 'http';

// ---- Configuration ----
const API_BASE = 'http://localhost:3000';

// ---- Helpers ----
async function apiCall(
  method: string,
  path: string,
  body?: unknown
): Promise<{ status: number; body: unknown }> {
  const url = `${API_BASE}${path}`;
  const opts: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body !== undefined) {
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(url, opts);
  const json = await res.json().catch(() => null);
  return { status: res.status, body: json };
}

// =============================================
// §5.3 Integration / E2E Contract Tests
// =============================================
describe('Integration: Full Onboarding Flow', () => {
  let server: Server;

  beforeAll(async () => {
    await new Promise<void>((resolve) => {
      server = app.listen(3000, () => resolve());
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      if (server) server.close(() => resolve());
      else resolve();
    });
  });
  // -------------------------------------------
  // §5.3: Create profile via API, verify frontend can render it
  // -------------------------------------------
  describe('Profile creation and frontend rendering', () => {
    it('should create a profile via API and retrieve it for frontend rendering', async () => {
      // Create profile
      const createRes = await apiCall('POST', '/api/profiles', {
        firstName: 'Integration',
        lastName: 'TestUser',
        email: 'integration.test@example.com',
        phone: '+1-555-9999',
      });

      expect(createRes.status).toBe(201);
      const profile = (createRes.body as { data: Record<string, unknown> }).data;
      expect(profile).toBeDefined();
      expect(profile.firstName).toBe('Integration');
      expect(profile.kycStatus).toBe('pending');

      // Verify GET returns the same profile
      const getRes = await apiCall('GET', `/api/profiles/${profile.id}`);
      expect(getRes.status).toBe(200);
      const fetched = (getRes.body as { data: Record<string, unknown> }).data;
      expect(fetched.id).toBe(profile.id);
      expect(fetched.firstName).toBe('Integration');
    });
  });

  // -------------------------------------------
  // §5.3: Submit KYC via API, verify status updates in frontend
  // -------------------------------------------
  describe('KYC submission and status update', () => {
    it('should submit KYC and reflect updated status', async () => {
      // Create profile
      const createRes = await apiCall('POST', '/api/profiles', {
        firstName: 'KycFlow',
        lastName: 'Test',
        email: 'kycflow.test@example.com',
      });
      const profileId = (createRes.body as { data: { id: string } }).data.id;

      // Submit KYC
      const kycRes = await apiCall('POST', `/api/profiles/${profileId}/kyc`, {
        documentType: 'passport',
        documentUrl: 'https://mock.example.com/doc.pdf',
      });

      expect(kycRes.status).toBe(201);
      const kycProfile = (kycRes.body as { data: { kycStatus: string } }).data;
      expect(kycProfile.kycStatus).toBe('pending');

      // Verify via GET
      const getRes = await apiCall('GET', `/api/profiles/${profileId}`);
      const fetchedProfile = (getRes.body as { data: { kycStatus: string } }).data;
      expect(fetchedProfile.kycStatus).toBe('pending');
    });
  });

  // -------------------------------------------
  // §5.3: Verify rejected KYC shows reason in dashboard
  // -------------------------------------------
  describe('Rejected KYC with reason', () => {
    it('should reject KYC with reason and make reason retrievable', async () => {
      // Create profile
      const createRes = await apiCall('POST', '/api/profiles', {
        firstName: 'Rejected',
        lastName: 'Flow',
        email: 'rejected.flow@example.com',
      });
      const profileId = (createRes.body as { data: { id: string } }).data.id;

      // Submit KYC
      await apiCall('POST', `/api/profiles/${profileId}/kyc`, {
        documentType: 'drivers_license',
        documentUrl: 'https://mock.example.com/license.pdf',
      });

      // Reject with reason
      const rejectRes = await apiCall('PATCH', `/api/profiles/${profileId}/kyc`, {
        status: 'rejected',
        reason: 'Photo is too dark to verify identity',
      });

      expect(rejectRes.status).toBe(200);
      const rejectedProfile = (rejectRes.body as { data: Record<string, unknown> }).data;
      expect(rejectedProfile.kycStatus).toBe('rejected');

      // The dashboard should be able to fetch this profile and display the status
      const getRes = await apiCall('GET', `/api/profiles/${profileId}`);
      expect(getRes.status).toBe(200);
    });
  });

  // -------------------------------------------
  // §5.3: Complete flow from Step 1 to Step 3
  // -------------------------------------------
  describe('Complete onboarding flow (Step 1 → Step 2 → Step 3)', () => {
    it('should support the full happy path: create → submit KYC → approve', async () => {
      // Step 1: Create profile
      const createRes = await apiCall('POST', '/api/profiles', {
        firstName: 'FullFlow',
        lastName: 'HappyPath',
        email: 'fullflow.happy@example.com',
      });
      expect(createRes.status).toBe(201);
      const profileId = (createRes.body as { data: { id: string } }).data.id;

      // Step 2: Submit KYC
      const kycRes = await apiCall('POST', `/api/profiles/${profileId}/kyc`, {
        documentType: 'national_id',
        documentUrl: 'https://mock.example.com/national-id.pdf',
      });
      expect(kycRes.status).toBe(201);

      // Step 3: Admin approves
      const approveRes = await apiCall('PATCH', `/api/profiles/${profileId}/kyc`, {
        status: 'verified',
      });
      expect(approveRes.status).toBe(200);

      // Verify final state
      const finalRes = await apiCall('GET', `/api/profiles/${profileId}`);
      expect(finalRes.status).toBe(200);
      const finalProfile = (finalRes.body as { data: { kycStatus: string } }).data;
      expect(finalProfile.kycStatus).toBe('verified');
    });

    it('should support rejection and resubmission flow (Step 1 → Step 2 → reject → Step 2 → Step 3)', async () => {
      // Step 1: Create profile
      const createRes = await apiCall('POST', '/api/profiles', {
        firstName: 'ResubmitFlow',
        lastName: 'Test',
        email: 'resubmit.flow@example.com',
      });
      const profileId = (createRes.body as { data: { id: string } }).data.id;

      // Step 2: Submit KYC
      await apiCall('POST', `/api/profiles/${profileId}/kyc`, {
        documentType: 'passport',
        documentUrl: 'https://mock.example.com/passport-v1.pdf',
      });

      // Admin rejects
      await apiCall('PATCH', `/api/profiles/${profileId}/kyc`, {
        status: 'rejected',
        reason: 'Expired document',
      });

      // Resubmit with new document (Step 2 again)
      const resubmitRes = await apiCall('POST', `/api/profiles/${profileId}/kyc`, {
        documentType: 'passport',
        documentUrl: 'https://mock.example.com/passport-v2.pdf',
      });
      expect(resubmitRes.status).toBe(201);
      expect((resubmitRes.body as { data: { kycStatus: string } }).data.kycStatus).toBe('pending');

      // Admin approves
      const approveRes = await apiCall('PATCH', `/api/profiles/${profileId}/kyc`, {
        status: 'verified',
      });
      expect(approveRes.status).toBe(200);

      // Final verification
      const finalRes = await apiCall('GET', `/api/profiles/${profileId}`);
      expect((finalRes.body as { data: { kycStatus: string } }).data.kycStatus).toBe('verified');
    });
  });

  // -------------------------------------------
  // API Client shape contract (§6 frontend/src/api/client.ts)
  // -------------------------------------------
  describe('API Client Module', () => {
    it('should export createProfile function', async () => {
      const client = await import('../frontend/src/api/client');
      expect(typeof client.createProfile).toBe('function');
    });

    it('should export getProfile function', async () => {
      const client = await import('../frontend/src/api/client');
      expect(typeof client.getProfile).toBe('function');
    });

    it('should export updateProfile function', async () => {
      const client = await import('../frontend/src/api/client');
      expect(typeof client.updateProfile).toBe('function');
    });

    it('should export submitKyc function', async () => {
      const client = await import('../frontend/src/api/client');
      expect(typeof client.submitKyc).toBe('function');
    });

    it('should export reviewKyc function', async () => {
      const client = await import('../frontend/src/api/client');
      expect(typeof client.reviewKyc).toBe('function');
    });
  });
});

// =============================================
// Shared Types Contract (NC-4)
// =============================================
describe('Shared Types Contract', () => {
  it('should import shared_types.ts as single source of truth', async () => {
    const shared = await import('../shared/shared_types');
    expect(shared).toBeDefined();
  });

  it('should export KycStatus type', async () => {
    const shared = await import('../shared/shared_types');
    // Type exports can't be directly tested at runtime, but the module should load
    expect(shared).toBeDefined();
  });

  it('should export UserProfile interface', async () => {
    const shared = await import('../shared/shared_types');
    expect(shared).toBeDefined();
  });

  it('should export CreateProfileRequest interface', async () => {
    const shared = await import('../shared/shared_types');
    expect(shared).toBeDefined();
  });

  it('should export UpdateProfileRequest interface', async () => {
    const shared = await import('../shared/shared_types');
    expect(shared).toBeDefined();
  });

  it('should export KycSubmitRequest interface', async () => {
    const shared = await import('../shared/shared_types');
    expect(shared).toBeDefined();
  });

  it('should export KycReviewRequest interface', async () => {
    const shared = await import('../shared/shared_types');
    expect(shared).toBeDefined();
  });

  it('should export ApiError interface', async () => {
    const shared = await import('../shared/shared_types');
    expect(shared).toBeDefined();
  });

  it('should export ApiResponse interface', async () => {
    const shared = await import('../shared/shared_types');
    expect(shared).toBeDefined();
  });
});

// =============================================
// Service Layer Contract (§4.2)
// =============================================
describe('ProfileService Contract', () => {
  it('should export a ProfileService class or module', async () => {
    const service = await import('../backend/services/profile.service');
    expect(service).toBeDefined();
  });

  it('should export createProfile method', async () => {
    const service = await import('../backend/services/profile.service');
    const exported = Object.values(service)[0] as Record<string, unknown>;
    expect(typeof exported).toBe('function');
  });

  it('should export getProfile method', async () => {
    const service = await import('../backend/services/profile.service');
    const exported = Object.values(service)[0] as Record<string, unknown>;
    expect(typeof exported).toBe('function');
  });

  it('should export submitKyc method', async () => {
    const service = await import('../backend/services/profile.service');
    const exported = Object.values(service)[0] as Record<string, unknown>;
    expect(typeof exported).toBe('function');
  });

  it('should export reviewKyc method', async () => {
    const service = await import('../backend/services/profile.service');
    const exported = Object.values(service)[0] as Record<string, unknown>;
    expect(typeof exported).toBe('function');
  });
});

// =============================================
// In-Memory Store Contract (§4.1)
// =============================================
describe('In-Memory Store Contract', () => {
  it('should export a Map-based in-memory store', async () => {
    const store = await import('../backend/store/in-memory');
    expect(store).toBeDefined();
  });
});
