import type {
  ApiErrorBody,
  ApiUser,
  AuthSession,
  LoginResponse,
  UserProfile,
  UserProfileResponse,
  UpdateProfilePayload,
  UpdateProfileResponse,
  StorageQuotaResponse,
  UserStorageInfo,
  ChangePasswordPayload,
  ChangePasswordResponse,
  RegisterPayload,
  RegisterResponse,
  VerifyEmailPayload,
  ResetPasswordPayload,
} from "../types/auth";
import { getAuthHeaders, handleUnauthorized } from "../lib/authStorage";

/** Dev: để trống → Vite proxy `/account`. Production: set VITE_API_URL trong .env */
const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

function apiUrl(path: string): string {
  return API_BASE ? `${API_BASE}${path}` : path;
}

function mapApiUser(user: ApiUser): AuthSession["user"] {
  return {
    id: user._id,
    fullName: user.fullName,
    email: user.email,
    username: user.username,
    avatarUrl: user.avatarUrl,
    role: user.role,
  };
}

export function resolveAvatarUrl(avatarUrl: string, fullName: string): string {
  if (avatarUrl?.trim()) {
    if (avatarUrl.startsWith("http")) return avatarUrl;
    const base =
      API_BASE || "http://103.140.249.210:5285";
    return `${base}${avatarUrl.startsWith("/") ? "" : "/"}${avatarUrl}`;
  }
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=8083ff&color=fff`;
}

export async function loginAccount(
  email: string,
  password: string,
): Promise<AuthSession> {
  const response = await fetch(apiUrl("/account/login"), {
    method: "POST",
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const body = (await response.json().catch(() => ({}))) as
    | LoginResponse
    | ApiErrorBody;

  if (!response.ok) {
    const err = body as ApiErrorBody;
    if (response.status === 401) {
      throw new Error(
        err.message ?? "Tài khoản chưa xác thực email hoặc đã bị khóa.",
      );
    }
    if (response.status === 422) {
      throw new Error(
        err.message ?? "Email hoặc mật khẩu không đúng. Vui lòng thử lại.",
      );
    }
    throw new Error(err.message ?? "Đăng nhập thất bại. Vui lòng thử lại.");
  }

  const success = body as LoginResponse;
  const user = mapApiUser(success.data.user);

  return {
    user: {
      ...user,
      avatarUrl: resolveAvatarUrl(user.avatarUrl, user.fullName),
    },
    accessToken: success.data.accessToken,
    tokenType: success.data.tokenType,
    expiresIn: success.data.expiresIn,
  };
}

export async function getCurrentUserProfile(): Promise<UserProfile> {
  const headers = getAuthHeaders();
  const response = await fetch(apiUrl("/users/me"), {
    method: "GET",
    headers: {
      accept: "application/json",
      ...headers,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      handleUnauthorized();
    }
    const errBody = (await response.json().catch(() => ({}))) as ApiErrorBody;
    throw new Error(errBody.message ?? "Không thể lấy thông tin hồ sơ cá nhân.");
  }

  const success = (await response.json()) as UserProfileResponse;
  return {
    ...success.data,
    avatarUrl: resolveAvatarUrl(success.data.avatarUrl, success.data.fullName),
  };
}

export async function updateUserProfile(
  payload: { fullName: string; username: string; avatarFile?: File }
): Promise<UpdateProfileResponse["data"]> {
  const headers = getAuthHeaders();
  const { "Content-Type": _, ...authHeaders } = headers as any;

  let body: any;
  let requestHeaders: any = {
    accept: "application/json",
    ...authHeaders,
  };

  if (payload.avatarFile) {
    const formData = new FormData();
    formData.append("fullName", payload.fullName);
    formData.append("username", payload.username);
    formData.append("avatar", payload.avatarFile);
    body = formData;
  } else {
    body = JSON.stringify({
      fullName: payload.fullName,
      username: payload.username,
    });
    requestHeaders["Content-Type"] = "application/json";
  }

  const response = await fetch(apiUrl("/users/me"), {
    method: "PUT",
    headers: requestHeaders,
    body: body,
  });

  if (!response.ok) {
    if (response.status === 401) {
      handleUnauthorized();
    }
    const errBody = (await response.json().catch(() => ({}))) as ApiErrorBody;
    throw new Error(errBody.message ?? "Không thể cập nhật hồ sơ cá nhân.");
  }

  const success = (await response.json()) as UpdateProfileResponse;
  return {
    ...success.data,
    avatarUrl: resolveAvatarUrl(success.data.avatarUrl, success.data.fullName),
  };
}

export async function getCurrentUserStorageQuota(): Promise<UserStorageInfo> {
  const headers = getAuthHeaders();
  const response = await fetch(apiUrl("/users/me/storage"), {
    method: "GET",
    headers: {
      accept: "application/json",
      ...headers,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      handleUnauthorized();
    }
    const errBody = (await response.json().catch(() => ({}))) as ApiErrorBody;
    throw new Error(errBody.message ?? "Không thể lấy thông tin hạn mức bộ nhớ.");
  }

  const success = (await response.json()) as StorageQuotaResponse;
  return success.data;
}

export async function changeUserPassword(
  payload: ChangePasswordPayload
): Promise<void> {
  const headers = getAuthHeaders();
  const response = await fetch(apiUrl("/users/me/password"), {
    method: "PUT",
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    if (response.status === 401) {
      handleUnauthorized();
    }
    const errBody = (await response.json().catch(() => ({}))) as ApiErrorBody;
    throw new Error(errBody.message ?? "Không thể thay đổi mật khẩu.");
  }
}

export async function registerAccount(
  payload: RegisterPayload
): Promise<RegisterResponse> {
  const response = await fetch(apiUrl("/account/register"), {
    method: "POST",
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const body = (await response.json().catch(() => ({}))) as
    | RegisterResponse
    | ApiErrorBody;

  if (!response.ok) {
    const err = body as ApiErrorBody;
    throw new Error(err.message ?? "Đăng ký tài khoản thất bại.");
  }

  return body as RegisterResponse;
}

export async function verifyEmail(
  payload: VerifyEmailPayload
): Promise<void> {
  const response = await fetch(apiUrl("/account/verify-email"), {
    method: "POST",
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const err = (await response.json().catch(() => ({}))) as ApiErrorBody;
    throw new Error(err.message ?? "Xác thực mã OTP thất bại.");
  }
}

export async function resendVerificationEmail(
  email: string
): Promise<void> {
  const response = await fetch(apiUrl("/account/resend-verification"), {
    method: "POST",
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const err = (await response.json().catch(() => ({}))) as ApiErrorBody;
    throw new Error(err.message ?? "Không thể gửi lại mã xác thực.");
  }
}

export async function forgotPassword(
  email: string
): Promise<void> {
  const response = await fetch(apiUrl("/account/forgot-password"), {
    method: "POST",
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const err = (await response.json().catch(() => ({}))) as ApiErrorBody;
    throw new Error(err.message ?? "Yêu cầu đặt lại mật khẩu thất bại.");
  }
}

export async function resetPassword(
  payload: ResetPasswordPayload
): Promise<void> {
  const response = await fetch(apiUrl("/account/reset-password"), {
    method: "POST",
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const err = (await response.json().catch(() => ({}))) as ApiErrorBody;
    throw new Error(err.message ?? "Đặt lại mật khẩu thất bại.");
  }
}

