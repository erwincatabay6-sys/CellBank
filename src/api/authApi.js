import { apiRequest } from "./http.js";

export function login(identifier, password) {
  const body = new URLSearchParams({
    identifier: identifier.trim(),
    password,
  });

  return apiRequest("/api/auth/login", {
    method: "POST",
    body,
  });
}

export function getCurrentUser() {
  return apiRequest("/api/auth/me");
}

export function logout() {
  return apiRequest("/api/auth/logout", {
    method: "POST",
  });
}
