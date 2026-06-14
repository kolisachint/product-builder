// === Domain Types ===

export type KycStatus = "pending" | "verified" | "rejected";

export interface UserProfile {
  id: string;                    // UUID
  userId: string;                // Owning user ID
  firstName: string;
  lastName: string;
  email: string;                 // unique per user
  phone?: string;                // optional
  kycStatus: KycStatus;
  createdAt: string;             // ISO 8601
  updatedAt: string;             // ISO 8601
}

// === Request / Response Shapes ===

export interface CreateProfileRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

export interface KycSubmitRequest {
  documentType: string;          // e.g. "passport", "drivers_license"
  documentUrl: string;           // mock URL or base64 placeholder
}

export interface KycReviewRequest {
  status: "verified" | "rejected";
  reason?: string;               // required if rejected
}

export interface ApiError {
  error: string;                 // human-readable message
  code: number;                  // HTTP status code
}

export interface ApiResponse<T> {
  data: T;
  error?: ApiError;
}

// === Profile List (for admin/dashboard) ===

export interface ProfileListResponse {
  profiles: UserProfile[];
  total: number;
}
