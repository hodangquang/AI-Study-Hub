import type { AuthSession, AuthUser } from "../types/auth";

const SESSION_KEY = "ai_study_hub_session";

export function saveAuthSession(session: AuthSession): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  localStorage.setItem("ai_study_hub_user", JSON.stringify(session.user));
}

export function loadAuthSession(): AuthSession | null {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) {
    const legacyUser = localStorage.getItem("ai_study_hub_user");
    if (!legacyUser) return null;
    try {
      const user = JSON.parse(legacyUser) as AuthUser;
      return user.id
        ? { user, accessToken: "", tokenType: "Bearer", expiresIn: 0 }
        : null;
    } catch {
      return null;
    }
  }
  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

export function clearAuthSession(): void {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem("ai_study_hub_user");
}

export function getAccessToken(): string | null {
  return loadAuthSession()?.accessToken ?? null;
}

/** Decode JWT payload (without verification) to read `exp` field */
function decodeJwtExp(token: string): number | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const data = JSON.parse(json);
    return typeof data.exp === "number" ? data.exp : null;
  } catch {
    return null;
  }
}

/** Returns true if the stored token is missing or has expired */
export function isTokenExpired(): boolean {
  const token = loadAuthSession()?.accessToken;
  if (!token) return true;
  const exp = decodeJwtExp(token);
  if (exp === null) return false; // no exp claim → assume valid
  return Date.now() / 1000 >= exp; // compare epoch seconds
}

export function getAuthHeaders(): HeadersInit {
  const session = loadAuthSession();
  if (!session?.accessToken) return {};
  return {
    Authorization: `${session.tokenType} ${session.accessToken}`,
  };
}

/**
 * Global callback — set by App.tsx so that expired-token errors
 * anywhere in the app can trigger a clean logout.
 */
let _onSessionExpired: (() => void) | null = null;
export function registerSessionExpiredHandler(fn: () => void) {
  _onSessionExpired = fn;
}

/** Call this whenever a 401 is received from the backend */
export function handleUnauthorized() {
  clearAuthSession();
  _onSessionExpired?.();
}
