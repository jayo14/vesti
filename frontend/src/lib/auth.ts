export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

export interface User {
  id: number;
  username: string;
  email: string;
  bio: string;
  avatar: string;
  is_designer: boolean;
  date_joined: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

const ACCESS_KEY = "vesti_access";
const REFRESH_KEY = "vesti_refresh";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(REFRESH_KEY);
}

export function setTokens(tokens: AuthTokens): void {
  window.localStorage.setItem(ACCESS_KEY, tokens.access);
  window.localStorage.setItem(REFRESH_KEY, tokens.refresh);
}

export function clearTokens(): void {
  window.localStorage.removeItem(ACCESS_KEY);
  window.localStorage.removeItem(REFRESH_KEY);
}

export function isAuthenticated(): boolean {
  return getAccessToken() !== null;
}

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      message = extractErrorMessage(data) ?? message;
    } catch {
      /* ignore non-json bodies */
    }
    throw new ApiError(message, res.status);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

function extractErrorMessage(data: unknown): string | undefined {
  if (!data || typeof data !== "object") return undefined;
  const obj = data as Record<string, unknown>;
  const first = Object.values(obj)[0];
  if (Array.isArray(first)) return `${String(Object.keys(obj)[0])}: ${first[0]}`;
  if (typeof first === "string") return first;
  if (typeof obj.detail === "string") return obj.detail;
  return undefined;
}

export async function register(input: {
  username: string;
  email: string;
  password: string;
}): Promise<User> {
  return request<User>("/api/auth/register/", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function login(
  username: string,
  password: string,
): Promise<AuthTokens> {
  const tokens = await request<AuthTokens>("/api/auth/login/", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  setTokens(tokens);
  return tokens;
}

export async function refreshAccessToken(): Promise<string> {
  const refresh = getRefreshToken();
  if (!refresh) throw new ApiError("No refresh token", 401);
  const { access } = await request<{ access: string }>(
    "/api/auth/token/refresh/",
    { method: "POST", body: JSON.stringify({ refresh }) },
  );
  window.localStorage.setItem(ACCESS_KEY, access);
  return access;
}

export async function fetchProfile(): Promise<User> {
  const access = getAccessToken();
  if (!access) throw new ApiError("Not authenticated", 401);

  let res = await fetch(`${API_BASE}/api/auth/me/`, {
    headers: { Authorization: `Bearer ${access}` },
  });

  if (res.status === 401) {
    const refreshed = await refreshAccessToken();
    res = await fetch(`${API_BASE}/api/auth/me/`, {
      headers: { Authorization: `Bearer ${refreshed}` },
    });
  }

  if (!res.ok) {
    clearTokens();
    throw new ApiError("Session expired", res.status);
  }
  return (await res.json()) as User;
}

export async function logout(): Promise<void> {
  clearTokens();
}

export async function requestPasswordReset(email: string): Promise<{
  detail: string;
  uid?: string;
  token?: string;
}> {
  return request("/api/auth/password-reset/", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function confirmPasswordReset(input: {
  uid: string;
  token: string;
  new_password: string;
}): Promise<{ detail: string }> {
  return request("/api/auth/password-reset-confirm/", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
