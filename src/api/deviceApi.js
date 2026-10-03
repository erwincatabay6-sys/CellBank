import { apiRequest } from "./http.js";

function devicePath(customerId, deviceId) {
  const base = `/api/customers/${encodeURIComponent(customerId)}/devices`;

  return deviceId == null ? base : `${base}/${encodeURIComponent(deviceId)}`;
}

export function getDevices(customerId, { signal } = {}) {
  return apiRequest(devicePath(customerId), { signal });
}

export function getDevice(customerId, deviceId, { signal } = {}) {
  return apiRequest(devicePath(customerId, deviceId), { signal });
}

export function createDevice(customerId, data) {
  return apiRequest(devicePath(customerId), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}

export function updateDevice(customerId, deviceId, data) {
  return apiRequest(devicePath(customerId, deviceId), {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}
