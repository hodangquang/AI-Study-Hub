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
