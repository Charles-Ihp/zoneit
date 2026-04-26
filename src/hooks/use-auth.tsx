import { useState, useEffect, useCallback } from "react";
import { api, TOKEN_KEY, type UserResponse } from "@/lib/api";

interface AuthState {
  user: UserResponse | null;
  loading: boolean;
  login: () => void;
  logout: () => void;
  setUser: (user: UserResponse) => void;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Pick up token from OAuth redirect (?token=...)
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("token");
    if (urlToken) {
      localStorage.setItem(TOKEN_KEY, urlToken);
      params.delete("token");
      const newSearch = params.toString();
      const newUrl = newSearch
        ? `${window.location.pathname}?${newSearch}`
        : window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }

    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setLoading(false);
      return;
    }

    api.users
      .me()
      .then(setUser)
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(() => {
    window.location.href = api.auth.googleLoginUrl();
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  return { user, loading, login, logout, setUser };
}
