import { apiRequest } from "./http.js";

export function getStaffAccounts() {
  return apiRequest("/api/users");
}

export function createStaffAccount(data) {
  return apiRequest("/api/users", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}

export function updateStaffAccount(userId, data) {
  return apiRequest(`/api/users/${userId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}

export function updateStaffAccess(userId, active) {
  return apiRequest(`/api/users/${userId}/access`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ active }),
  });
}
