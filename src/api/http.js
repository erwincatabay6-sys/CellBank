export class ApiError extends Error {
  constructor(status, data) {
    super(data?.detail || data?.message || `Request failed (${status}).`);

    this.name = "ApiError";
    this.status = status;
    this.errors = data?.errors || {};
  }
}

export async function apiRequest(path, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const headers = new Headers(options.headers);

  headers.set("Accept", "application/json");

  const requiresCsrf = !["GET", "HEAD", "OPTIONS"].includes(method);

  if (requiresCsrf) {
    const csrf = await apiRequest("/api/auth/csrf");

    if (!csrf?.headerName || !csrf?.token) {
      throw new Error("Could not obtain a CSRF token.");
    }

    headers.set(csrf.headerName, csrf.token);
  }

  const response = await fetch(path, {
    ...options,
    method,
    headers,
    credentials: "same-origin",
  });

  if (response.status === 401 && path !== "/api/auth/login") {
    window.dispatchEvent(new Event("cellbank:session-expired"));
  }

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("content-type") || "";
  const isJson =
    contentType.includes("application/json") || contentType.includes("+json");

  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    throw new ApiError(response.status, data);
  }

  if (!isJson) {
    throw new Error("The server returned an unexpected response.");
  }

  return data;
}
