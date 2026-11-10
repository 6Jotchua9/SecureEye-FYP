import { createContext, useCallback, useContext, useMemo, useState } from "react";
import {
  apiLogin,
  clearExpiredSession,
  clearSession,
  getStoredUser,
  getToken,
  setSession,
} from "../api";

const AuthContext = createContext(null);

function readInitialSession() {
  clearExpiredSession();
  const token = getToken();
  return {
    token,
    user: token ? getStoredUser() : null,
  };
}

export function AuthProvider({ children }) {
  const initial = readInitialSession();
  const [token, setToken] = useState(initial.token);
  const [user, setUser] = useState(initial.user);

  const logout = useCallback(() => {
    clearSession();
    setToken(null);
    setUser(null);
  }, []);

  const login = useCallback(async (username, password) => {
    const data = await apiLogin(username, password);
    if (!data.user || data.user.role !== "admin") {
      throw new Error("This dashboard is restricted to admin accounts.");
    }
    setSession(data.access_token, data.user);
    setToken(data.access_token);
    setUser(data.user);
    return data.user;
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token),
      isAdmin: Boolean(token) && user?.role === "admin",
      login,
      logout,
    }),
    [token, user, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
