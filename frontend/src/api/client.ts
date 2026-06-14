import type {
  UserProfile,
  CreateProfileRequest,
  UpdateProfileRequest,
  KycSubmitRequest,
  KycReviewRequest,
  ApiResponse,
  ApiError,
} from '@shared/shared_types';

const BASE_URL = '/api';

/**
 * Parse a response and extract data or throw an ApiError.
 */
async function handleResponse<T>(response: Response): Promise<T> {
  const body = await response.json();

  if (!response.ok || body.error) {
    const apiError: ApiError = body.error ?? {
      error: 'Unknown error',
      code: response.status,
    };
    throw apiError;
  }

  return (body as ApiResponse<T>).data;
}

/**
 * Create a new user profile.
 * POST /api/profiles
 */
export async function createProfile(
  data: CreateProfileRequest,
): Promise<UserProfile> {
  const response = await fetch(`${BASE_URL}/profiles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  return handleResponse<UserProfile>(response);
}

/**
 * Get a user profile by ID.
 * GET /api/profiles/:id
 */
export async function getProfile(id: string): Promise<UserProfile> {
  const response = await fetch(`${BASE_URL}/profiles/${id}`);
  return handleResponse<UserProfile>(response);
}

/**
 * Update a user profile.
 * PUT /api/profiles/:id
 */
export async function updateProfile(
  id: string,
  data: UpdateProfileRequest,
): Promise<UserProfile> {
  const response = await fetch(`${BASE_URL}/profiles/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  return handleResponse<UserProfile>(response);
}

/**
 * Submit KYC documents for a profile.
 * POST /api/profiles/:id/kyc
 */
export async function submitKyc(
  profileId: string,
  data: KycSubmitRequest,
): Promise<UserProfile> {
  const response = await fetch(`${BASE_URL}/profiles/${profileId}/kyc`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  return handleResponse<UserProfile>(response);
}

/**
 * Review KYC submission (admin action).
 * PATCH /api/profiles/:id/kyc
 */
export async function reviewKyc(
  profileId: string,
  data: KycReviewRequest,
): Promise<UserProfile> {
  const response = await fetch(`${BASE_URL}/profiles/${profileId}/kyc`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  return handleResponse<UserProfile>(response);
}
