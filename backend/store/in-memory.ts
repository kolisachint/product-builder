import { UserProfile } from '../../shared/shared_types';

// In-memory storage for profiles
const profiles = new Map<string, UserProfile>();

// Track which profiles have submitted KYC documents
const kycSubmitted = new Set<string>();

export const profileStore = {
  /**
   * Create a new profile
   */
  create(profile: UserProfile): UserProfile {
    profiles.set(profile.id, profile);
    return profile;
  },

  /**
   * Get a profile by ID
   */
  getById(id: string): UserProfile | undefined {
    return profiles.get(id);
  },

  /**
   * Get a profile by email
   */
  getByEmail(email: string): UserProfile | undefined {
    for (const profile of profiles.values()) {
      if (profile.email === email) {
        return profile;
      }
    }
    return undefined;
  },

  /**
   * Update a profile
   */
  update(id: string, data: Partial<UserProfile>): UserProfile | undefined {
    const existing = profiles.get(id);
    if (!existing) {
      return undefined;
    }
    // Only allow updating known UserProfile fields — strip out any rogue keys
    const allowedKeys: (keyof UserProfile)[] = [
      'firstName', 'lastName', 'email', 'phone', 'kycStatus',
    ];
    const safeData: Partial<UserProfile> = {};
    for (const key of allowedKeys) {
      if (key in data) {
        (safeData as any)[key] = (data as any)[key];
      }
    }
    const updated = { ...existing, ...safeData, id, createdAt: existing.createdAt, updatedAt: new Date().toISOString() };
    profiles.set(id, updated);
    return updated;
  },

  /**
   * Mark a profile as having submitted KYC documents
   */
  markKycSubmitted(id: string): void {
    kycSubmitted.add(id);
  },

  /**
   * Check if a profile has already submitted KYC documents
   */
  hasKycSubmitted(id: string): boolean {
    return kycSubmitted.has(id);
  },

  /**
   * Clear submitted KYC tracking for a profile (e.g., on resubmit after rejection)
   */
  clearKycSubmitted(id: string): void {
    kycSubmitted.delete(id);
  },

  /**
   * List all profiles
   */
  list(): UserProfile[] {
    return Array.from(profiles.values());
  },

  /**
   * Clear all profiles and KYC tracking (for testing)
   */
  clear(): void {
    profiles.clear();
    kycSubmitted.clear();
  }
};
