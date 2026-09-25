import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { authApi } from "../api/auth.js";
import { getToken, setToken } from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      setBooting(false);
      return;
    }
    authApi
      .me()
      .then((data) => setUser(data.user ?? data))
      .catch(() => {
        setToken(null);
        setUser(null);
      })
      .finally(() => setBooting(false));
  }, []);

  const login = useCallback(async ({ email, password }) => {
    const data = await authApi.login({ email, password });
    setToken(data.token);
    setUser(data.user);
    return data;
  }, []);

  const register = useCallback(async ({ email, password }) => {
    const data = await authApi.register({ email, password });
    setToken(data.token);
    setUser(data.user);
    return data;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    queryClient.clear();
  }, [queryClient]);

  const value = useMemo(
    () => ({ user, booting, isAuthed: !!user, login, register, logout }),
    [user, booting, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
