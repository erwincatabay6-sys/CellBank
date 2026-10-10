import { apiRequest } from "./http.js";

export function trackRepair(trackingCode, { signal } = {}) {
  return apiRequest(
    `/api/tracking/${encodeURIComponent(trackingCode.trim())}`,
    {
      signal,
      credentials: "omit",
      cache: "no-store",
    },
  );
}