import { apiRequest } from "./http.js";

export function getReport(
  { startDate = "", endDate = "" } = {},
  { signal } = {},
) {
  const params = new URLSearchParams();

  if (startDate) {
    params.set("startDate", startDate);
  }

  if (endDate) {
    params.set("endDate", endDate);
  }

  const query = params.toString();

  return apiRequest(
    `/api/reports${query ? `?${query}` : ""}`,
    { signal },
  );
}