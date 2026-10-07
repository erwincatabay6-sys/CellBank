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

export function updateRepairStatus(repairId, data) {
  return apiRequest(
    `/api/repairs/${encodeURIComponent(repairId)}/status`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    },
  );
}

export function getRepairFindings(repairId, { signal } = {}) {
  return apiRequest(
    `/api/repairs/${encodeURIComponent(repairId)}/findings`,
    { signal },
  );
}

export function createRepairFinding(repairId, data) {
  return apiRequest(
    `/api/repairs/${encodeURIComponent(repairId)}/findings`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    },
  );
}

export function getRepairParts(repairId, { signal } = {}) {
  return apiRequest(
    `/api/repairs/${encodeURIComponent(repairId)}/parts`,
    { signal },
  );
}

export function createRepairPart(repairId, data) {
  return apiRequest(
    `/api/repairs/${encodeURIComponent(repairId)}/parts`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    },
  );
}

export function updateRepairEstimate(repairId, data) {
  return apiRequest(
    `/api/repairs/${encodeURIComponent(repairId)}/estimate`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    },
  );
}

export function updateRepairAgreedPrice(repairId, data) {
  return apiRequest(
    `/api/repairs/${encodeURIComponent(repairId)}/agreed-price`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    },
  );
}

export function getRepairPayments(repairId, { signal } = {}) {
  return apiRequest(
    `/api/repairs/${encodeURIComponent(repairId)}/payments`,
    { signal },
  );
}

export function createRepairPayment(repairId, data) {
  return apiRequest(
    `/api/repairs/${encodeURIComponent(repairId)}/payments`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    },
  );
}

export function updateRepairProblemCategory(repairId, data) {
  return apiRequest(
    `/api/repairs/${encodeURIComponent(repairId)}/problem-category`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    },
  );
}
