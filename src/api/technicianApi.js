import { apiRequest } from "./http.js";

export function getTechnicians({ signal } = {}) {
  return apiRequest("/api/technicians", { signal });
}

export function getTechnician(technicianId, { signal } = {}) {
  return apiRequest(
    `/api/technicians/${encodeURIComponent(technicianId)}`,
    { signal },
  );
}