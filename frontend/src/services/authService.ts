import { API_URL } from "../config/api";

const TOKEN_COOKIE = "rtm_auth_token";
const USERNAME_COOKIE = "rtm_auth_username";

export type AuthResponse = {
  token: string;
  username: string;
  expiresAt: string;
};

// Cookie Helpers
export const getCookie = (name: string): string | null => {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${encodeURIComponent(name)}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
};

export const setCookie = (name: string, value: string, days = 7): void => {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
};

export const deleteCookie = (name: string): void => {
  if (typeof document === "undefined") return;
  document.cookie = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
};

export const getToken = (): string | null => {
  return getCookie(TOKEN_COOKIE);
};

export const getStoredUsername = (): string | null => {
  return getCookie(USERNAME_COOKIE);
};

export const setAuthData = (token: string, username: string): void => {
  setCookie(TOKEN_COOKIE, token, 7);
  setCookie(USERNAME_COOKIE, username, 7);

  // Clear any legacy localStorage token
  try {
    localStorage.removeItem(TOKEN_COOKIE);
    localStorage.removeItem(USERNAME_COOKIE);
  } catch {
    // ignore
  }
};

export const clearAuthData = (): void => {
  deleteCookie(TOKEN_COOKIE);
  deleteCookie(USERNAME_COOKIE);

  // Clear backend cookie
  fetch(`${API_URL}/api/auth/logout`, {
    method: "POST",
    credentials: "include",
  }).catch(() => {});

  try {
    localStorage.removeItem(TOKEN_COOKIE);
    localStorage.removeItem(USERNAME_COOKIE);
  } catch {
    // ignore
  }
};

export const registerUser = async (username: string, password: string): Promise<AuthResponse> => {
  const response = await fetch(`${API_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ username, password }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data?.message || (data?.errors ? Object.values(data.errors).flat().join(" ") : `Error ${response.status}`);
    throw new Error(errorMsg);
  }

  setAuthData(data.token, data.username);
  return data as AuthResponse;
};

export const loginUser = async (username: string, password: string): Promise<AuthResponse> => {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ username, password }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data?.message || (data?.errors ? Object.values(data.errors).flat().join(" ") : `Error ${response.status}`);
    throw new Error(errorMsg);
  }

  setAuthData(data.token, data.username);
  return data as AuthResponse;
};

export const getCurrentUser = async (): Promise<{ id: string; username: string } | null> => {
  const token = getToken();
  if (!token) return null;

  try {
    const response = await fetch(`${API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      credentials: "include",
    });
    if (!response.ok) {
      if (response.status === 401) {
        clearAuthData();
      }
      return null;
    }
    return await response.json();
  } catch {
    return null;
  }
};
