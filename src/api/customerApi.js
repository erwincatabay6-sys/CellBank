import { apiRequest } from "./http.js";

export function getCustomers({ signal } = {}) {
  return apiRequest("/api/customers", { signal });
}

export function getCustomer(customerId, { signal } = {}) {
  return apiRequest(
    `/api/customers/${encodeURIComponent(customerId)}`,
    { signal },
  );
}

export function createCustomer(data) {
  return apiRequest("/api/customers", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}

export function updateCustomer(customerId, data) {
  return apiRequest(
    `/api/customers/${encodeURIComponent(customerId)}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    },
  );
}