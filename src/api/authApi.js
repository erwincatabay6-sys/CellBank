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
export function updateProfile(name) {
  return apiRequest("/api/auth/me", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name }),
  });
}
export function changePassword(currentPassword, newPassword) {
  return apiRequest("/api/auth/change-password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      currentPassword,
      newPassword,
    }),
  });
}
export function uploadProfileImage(file) {
  const formData = new FormData();
  formData.append("file", file);

  return apiRequest("/api/auth/me/profile-image", {
    method: "POST",
    body: formData,
  });
}
