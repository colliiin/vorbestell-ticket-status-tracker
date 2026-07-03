import { request } from "./client";
import type { User } from "../types/api";
export type LoginResponse = User & { csrf_token: string };
export const login = (username: string, password: string) => request<LoginResponse>("/api/auth/login", { method: "POST", body: JSON.stringify({ username, password }) });
export const me = () => request<User>("/api/auth/me");
export const logout = () => request<{ ok: boolean }>("/api/auth/logout", { method: "POST", csrf: true });