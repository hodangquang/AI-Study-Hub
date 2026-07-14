export interface ApiUser {
  _id: string;
  email: string;
  fullName: string;
  username: string;
  role: string;
  avatarUrl: string;
  isEmailVerified: boolean;
  isActive: boolean;
}

export interface LoginResponse {
  message: string;
  data: {
    accessToken: string;
    tokenType: string;
    expiresIn: number;
    user: ApiUser;
  };
}

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  username: string;
  avatarUrl: string;
  role: string;
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface ApiErrorBody {
  message?: string;
  errors?: Record<string, string>;
}

export interface UserStorageInfo {
  plan: string;
  usedBytes: number;
  totalBytes: number;
  maxFileSizeBytes: number;
  maxFilesCount: number;
  aiQueriesUsed: number;
  aiQueriesLimit: number;
  usagePercent: number;
  quotaResetDate: string;
  updatedAt: string;
}

export interface UserProfile {
  _id: string;
  email: string;
  fullName: string;
  username: string;
  role: string;
  avatarUrl: string;
  isEmailVerified: boolean;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string;
  storage: UserStorageInfo;
}

export interface UserProfileResponse {
  message: string;
  data: UserProfile;
}

export interface UpdateProfilePayload {
  fullName: string;
  username: string;
}

export interface UpdateProfileResponse {
  message: string;
  data: {
    _id: string;
    fullName: string;
    username: string;
    avatarUrl: string;
    updatedAt: string;
  };
}

export interface StorageQuotaResponse {
  message: string;
  data: UserStorageInfo;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordResponse {
  message: string;
  data: null;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  fullName: string;
}

export interface RegisterResponse {
  message: string;
  account?: {
    acknowledged: boolean;
    insertedId: string;
  };
}

export interface VerifyEmailPayload {
  email: string;
  otp: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  email: string;
  otp: string;
  newPassword: string;
  confirmPassword: string;
}





