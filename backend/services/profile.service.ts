import { v4 as uuidv4 } from 'uuid';
import {
  UserProfile,
  CreateProfileRequest,
  UpdateProfileRequest,
  KycSubmitRequest,
  KycReviewRequest,
} from '../../shared/shared_types';
import { profileStore } from '../store/in-memory';

export class ProfileService {
  /**
   * Create a new profile
   */
  createProfile(data: CreateProfileRequest): UserProfile {
    // Validate required fields
    if (!data.firstName || data.firstName.length < 1 || data.firstName.length > 100) {
      throw new ServiceError('firstName must be between 1 and 100 characters', 400);
    }
    if (!data.lastName || data.lastName.length < 1 || data.lastName.length > 100) {
      throw new ServiceError('lastName must be between 1 and 100 characters', 400);
    }
    if (!data.email || !this.isValidEmail(data.email)) {
      throw new ServiceError('Invalid email format', 400);
    }
    if (data.phone !== undefined && data.phone.length > 20) {
      throw new ServiceError('phone must not exceed 20 characters', 400);
    }

    // Check for duplicate email
    const existing = profileStore.getByEmail(data.email);
    if (existing) {
      throw new ServiceError('Email already in use', 409);
    }

    const now = new Date().toISOString();
    const profile: UserProfile = {
      id: uuidv4(),
      userId: uuidv4(),
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      kycStatus: 'pending',
      createdAt: now,
      updatedAt: now,
    };

    return profileStore.create(profile);
  }

  /**
   * Get a profile by ID
   */
  getProfile(id: string): UserProfile {
    const profile = profileStore.getById(id);
    if (!profile) {
      throw new ServiceError('Profile not found', 404);
    }
    return profile;
  }

  /**
   * Update a profile
   */
  updateProfile(id: string, data: UpdateProfileRequest): UserProfile {
    // Check if profile exists
    const existing = profileStore.getById(id);
    if (!existing) {
      throw new ServiceError('Profile not found', 404);
    }

    // Validate fields if provided
    if (data.firstName !== undefined && (data.firstName.length < 1 || data.firstName.length > 100)) {
      throw new ServiceError('firstName must be between 1 and 100 characters', 400);
    }
    if (data.lastName !== undefined && (data.lastName.length < 1 || data.lastName.length > 100)) {
      throw new ServiceError('lastName must be between 1 and 100 characters', 400);
    }
    if (data.email !== undefined && !this.isValidEmail(data.email)) {
      throw new ServiceError('Invalid email format', 400);
    }
    if (data.phone !== undefined && data.phone.length > 20) {
      throw new ServiceError('phone must not exceed 20 characters', 400);
    }

    // Check for duplicate email if changing
    if (data.email && data.email !== existing.email) {
      const duplicate = profileStore.getByEmail(data.email);
      if (duplicate) {
        throw new ServiceError('Email already in use', 409);
      }
    }

    // Only pass allowed fields — strip out rogue keys
    const safeData: UpdateProfileRequest = {};
    if (data.firstName !== undefined) safeData.firstName = data.firstName;
    if (data.lastName !== undefined) safeData.lastName = data.lastName;
    if (data.email !== undefined) safeData.email = data.email;
    if (data.phone !== undefined) safeData.phone = data.phone;

    const updated = profileStore.update(id, safeData);
    if (!updated) {
      throw new ServiceError('Profile not found', 404);
    }
    return updated;
  }

  /**
   * Submit KYC documents
   */
  submitKyc(id: string, data: KycSubmitRequest): UserProfile {
    const profile = this.getProfile(id);

    // Validate request
    if (!data.documentType) {
      throw new ServiceError('documentType is required', 400);
    }
    if (!data.documentUrl) {
      throw new ServiceError('documentUrl is required', 400);
    }

    // Check state machine rules
    // verified → final state, no further changes
    if (profile.kycStatus === 'verified') {
      throw new ServiceError('KYC already verified', 409);
    }

    // If pending and docs already submitted → 409 Conflict
    if (profile.kycStatus === 'pending' && profileStore.hasKycSubmitted(id)) {
      throw new ServiceError('KYC already pending', 409);
    }

    // Mark docs as submitted
    profileStore.markKycSubmitted(id);

    // rejected → pending (resubmit), or first-time pending
    if (profile.kycStatus !== 'pending') {
      const updated = profileStore.update(id, { kycStatus: 'pending' });
      if (!updated) {
        throw new ServiceError('Profile not found', 404);
      }
      return updated;
    }

    // Already pending (first-time submission) — just return the profile
    return profile;
  }

  /**
   * Review KYC submission (admin action)
   */
  reviewKyc(id: string, data: KycReviewRequest): UserProfile {
    const profile = this.getProfile(id);

    // Validate request
    if (!data.status) {
      throw new ServiceError('status is required', 400);
    }
    if (data.status === 'rejected' && !data.reason) {
      throw new ServiceError('reason is required when rejecting', 400);
    }

    // Check state machine rules
    if (profile.kycStatus === 'verified') {
      throw new ServiceError('KYC already verified', 409);
    }
    if (profile.kycStatus === 'rejected') {
      throw new ServiceError('KYC already rejected', 409);
    }

    // If not yet submitted docs, cannot review
    if (!profileStore.hasKycSubmitted(id)) {
      throw new ServiceError('No KYC documents submitted yet', 400);
    }

    // pending → verified or pending → rejected
    const updated = profileStore.update(id, { kycStatus: data.status });
    if (!updated) {
      throw new ServiceError('Profile not found', 404);
    }

    // If rejected, clear the submitted flag so they can resubmit
    if (data.status === 'rejected') {
      profileStore.clearKycSubmitted(id);
    }

    return updated;
  }

  /**
   * List all profiles
   */
  listProfiles(): UserProfile[] {
    return profileStore.list();
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

/**
 * Custom error class for service errors
 */
export class ServiceError extends Error {
  code: number;

  constructor(message: string, code: number) {
    super(message);
    this.name = 'ServiceError';
    this.code = code;
  }
}
