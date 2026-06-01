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

export function getAuthHeaders(): HeadersInit {
  const session = loadAuthSession();
  if (!session?.accessToken) return {};
  return {
    Authorization: `${session.tokenType} ${session.accessToken}`,
  };
}
