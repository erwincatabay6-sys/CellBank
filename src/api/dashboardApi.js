import { apiRequest } from "./http.js";

export function getDashboard({ signal } = {}) {
  return apiRequest("/api/dashboard", { signal });
}