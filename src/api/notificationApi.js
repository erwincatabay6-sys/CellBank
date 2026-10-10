import { apiRequest } from "./http.js";

export function getNotifications({ signal } = {}) {
  return apiRequest("/api/notifications", {
    signal,
    cache: "no-store",
  });
}

export function markNotificationAsRead(
  notificationId,
  { signal } = {},
) {
  return apiRequest(
    `/api/notifications/${encodeURIComponent(notificationId)}/read`,
    {
      method: "PATCH",
      signal,
    },
  );
}

export function markAllNotificationsAsRead({ signal } = {}) {
  return apiRequest("/api/notifications/read-all", {
    method: "PATCH",
    signal,
  });
}