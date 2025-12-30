/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useState } from "react";
import { clearAuthToken, setAuthToken } from "../api/client";
import { deleteAccount as deleteAccountRequest } from "../services/authService";
import { fetchProfile } from "../services/userService";

const STORAGE_KEY = "auth_state";

const DEFAULT_AUTH_STATE = { token: null, user: null, storageType: null };

const parseStoredAuth = (storage) => {
  if (!storage) return null;
  const stored = storage.getItem(STORAGE_KEY);
  if (!stored) return null;
  try {
    const parsed = JSON.parse(stored);
    if (parsed?.token) {
      return { token: parsed.token, user: parsed.user || null };
    }
  } catch (e) {
    if (import.meta.env.DEV) {
      console.warn("Failed to parse saved auth state", e);
    }
  }
  storage.removeItem(STORAGE_KEY);
  return null;
};

const writeAuth = (storage, value) => {
  if (!storage) return;
  storage.setItem(STORAGE_KEY, JSON.stringify(value));
};

const clearAuth = (storage) => {
  if (!storage) return;
  storage.removeItem(STORAGE_KEY);
};

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const loadStored = () => {
    if (typeof window === "undefined") return DEFAULT_AUTH_STATE;
    const persistent = parseStoredAuth(localStorage);
    if (persistent) {
      setAuthToken(persistent.token);
      return { ...persistent, storageType: "local" };
    }
    const sessionAuth = parseStoredAuth(sessionStorage);
    if (sessionAuth) {
      setAuthToken(sessionAuth.token);
      return { ...sessionAuth, storageType: "session" };
    }
    return DEFAULT_AUTH_STATE;
  };

  const [{ token, user, storageType }, setAuthState] = useState(() =>
    loadStored()
  );
  const [ready] = useState(true);

  const persist = useCallback((nextToken, nextUser, remember = false) => {
    if (typeof window === "undefined") {
      return;
    }

    if (nextToken) {
      const payload = { token: nextToken, user: nextUser || null };
      const targetStorage = remember ? localStorage : sessionStorage;
      const otherStorage = remember ? sessionStorage : localStorage;
      setAuthToken(nextToken);
      writeAuth(targetStorage, payload);
      clearAuth(otherStorage);
      setAuthState({
        token: nextToken,
        user: nextUser || null,
        storageType: remember ? "local" : "session",
      });
    } else {
      clearAuthToken();
      clearAuth(localStorage);
      clearAuth(sessionStorage);
      setAuthState(DEFAULT_AUTH_STATE);
    }
  }, []);

  const login = useCallback(
    (nextToken, nextUser, remember) => persist(nextToken, nextUser, remember),
    [persist]
  );
  const logout = useCallback(() => persist(null, null), [persist]);

  const updateUser = useCallback((nextUser) => {
    setAuthState((prev) => {
      if (!prev.token) {
        return DEFAULT_AUTH_STATE;
      }
      const payload = { token: prev.token, user: nextUser || null };
      const targetStorage =
        prev.storageType === "session" ? sessionStorage : localStorage;
      writeAuth(targetStorage, payload);
      return {
        token: prev.token,
        user: nextUser || null,
        storageType: prev.storageType,
      };
    });
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const { user: profile } = await fetchProfile();
      updateUser(profile);
      return profile;
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn("Failed to refresh user profile", err);
      }
      throw err;
    }
  }, [updateUser]);

  const deleteAccount = useCallback(async () => {
    await deleteAccountRequest();
    logout();
  }, [logout]);

  const value = {
    token,
    user,
    storageType,
    ready,
    isAuthenticated: Boolean(token),
    login,
    logout,
    updateUser,
    refreshUser,
    deleteAccount,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
