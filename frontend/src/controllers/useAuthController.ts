import { useCallback, useEffect, useState } from "react";
import {
  clearAuthData,
  getCurrentUser,
  getStoredUsername,
  getToken,
  loginUser,
  registerUser,
} from "../services/authService";

export type AuthState = {
  isAuthenticated: boolean;
  username: string | null;
  loading: boolean;
  error: string | null;
};

export function useAuthController() {
  const [authState, setAuthState] = useState<AuthState>(() => {
    const token = getToken();
    return {
      isAuthenticated: !!token,
      username: getStoredUsername(),
      loading: !!token,
      error: null,
    };
  });

  // Validate session on mount
  useEffect(() => {
    const token = getToken();
    if (!token) return;

    let isMounted = true;

    getCurrentUser()
      .then((user) => {
        if (!isMounted) return;
        if (user) {
          setAuthState({
            isAuthenticated: true,
            username: user.username,
            loading: false,
            error: null,
          });
        } else {
          setAuthState({
            isAuthenticated: false,
            username: null,
            loading: false,
            error: null,
          });
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setAuthState({
          isAuthenticated: false,
          username: null,
          loading: false,
          error: null,
        });
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    setAuthState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await loginUser(username, password);
      setAuthState({
        isAuthenticated: true,
        username: data.username,
        loading: false,
        error: null,
      });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      setAuthState((prev) => ({ ...prev, loading: false, error: message }));
      return false;
    }
  }, []);

  const register = useCallback(async (username: string, password: string) => {
    setAuthState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await registerUser(username, password);
      setAuthState({
        isAuthenticated: true,
        username: data.username,
        loading: false,
        error: null,
      });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Registration failed";
      setAuthState((prev) => ({ ...prev, loading: false, error: message }));
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    clearAuthData();
    setAuthState({
      isAuthenticated: false,
      username: null,
      loading: false,
      error: null,
    });
  }, []);

  const clearError = useCallback(() => {
    setAuthState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    ...authState,
    login,
    register,
    logout,
    clearError,
  };
}
