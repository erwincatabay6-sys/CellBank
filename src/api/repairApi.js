import { apiRequest } from "./http.js";

export function getRepairs({ signal } = {}) {
  return apiRequest("/api/repairs", { signal });
}

export function getRepair(repairId, { signal } = {}) {
  return apiRequest(`/api/repairs/${encodeURIComponent(repairId)}`, { signal });
}

export function getRepairStatusHistory(repairId, { signal } = {}) {
  return apiRequest(
    `/api/repairs/${encodeURIComponent(repairId)}/status-history`,
    { signal },
  );
}

export function createRepair(data) {
  return apiRequest("/api/repairs", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}

export function getRepairTechnicians({ signal } = {}) {
  return apiRequest("/api/repairs/technicians", { signal });
}

export function getCustomerRepairHistory(customerId, { signal } = {}) {
  return apiRequest(
    `/api/customers/${encodeURIComponent(customerId)}/repairs`,
    { signal },
  );
}

export function getDeviceRepairHistory(customerId, deviceId, { signal } = {}) {
  return apiRequest(
    `/api/customers/${encodeURIComponent(customerId)}` +
      `/devices/${encodeURIComponent(deviceId)}/repairs`,
    { signal },
  );
}

export function updateRepairAssignment(repairId, data) {
  return apiRequest(
    `/api/repairs/${encodeURIComponent(repairId)}/assignment`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    },
  );
}
