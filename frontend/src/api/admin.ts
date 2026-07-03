import { request } from "./client";
import type { StatsResponse } from "../types/api";

export const getStats = (params?: URLSearchParams) => {
  const query = params?.toString();
  return request<StatsResponse>(`/api/admin/stats${query ? `?${query}` : ""}`);
};
