import type {
  ApiErrorBody,
  ApiUser,
  AuthSession,
  LoginResponse,
} from "../types/auth";

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
      API_BASE || "https://ai-study-hub-zk1m.onrender.com";
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
