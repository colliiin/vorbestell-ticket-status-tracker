import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { login as apiLogin, logout as apiLogout, me } from "../api/auth";
import type { User } from "../types/api";

type AuthContextValue = { user: User | null; loading: boolean; login: (u: string, p: string) => Promise<void>; logout: () => Promise<void>; refresh: () => Promise<void> };
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  async function refresh() { setLoading(true); try { setUser(await me()); } catch { setUser(null); } finally { setLoading(false); } }
  async function login(username: string, password: string) { const result = await apiLogin(username, password); setUser({ id: result.id, username: result.username, role: result.role }); }
  async function logout() { await apiLogout().catch(() => undefined); setUser(null); }
  useEffect(() => { refresh(); }, []);
  const value = useMemo(() => ({ user, loading, login, logout, refresh }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}