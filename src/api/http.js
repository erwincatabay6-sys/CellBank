const DEFAULT_TIMEOUT_MS = 30_000;

export class ApiError extends Error {
  constructor(status, data, retryAfterHeader = null) {
    super(data?.detail || data?.message || `Request failed (${status}).`);

    this.name = "ApiError";
    this.status = status;
    this.errors = data?.errors || {};

    const retryAfter = Number(
      retryAfterHeader ?? data?.retryAfterSeconds,
    );

    this.retryAfterSeconds =
      Number.isFinite(retryAfter) && retryAfter > 0
        ? Math.ceil(retryAfter)
        : null;
  }
}

export class RequestError extends Error {
  constructor(code, message, outcomeUncertain = false) {
    super(message);

    this.name = "RequestError";
    this.code = code;
    this.outcomeUncertain = outcomeUncertain;
  }
}

export async function apiRequest(path, options = {}) {
  const {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    signal: callerSignal,
    ...requestOptions
  } = options;

  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new Error("Request timeout must be a positive number.");
  }

  const method = (requestOptions.method || "GET").toUpperCase();
  const headers = new Headers(requestOptions.headers);
  const requiresCsrf = !["GET", "HEAD", "OPTIONS"].includes(method);

  const controller = new AbortController();

  let timedOut = false;
  let actionStarted = false;

  function cancelRequest() {
    controller.abort();
  }

  if (callerSignal?.aborted) {
    cancelRequest();
  } else {
    callerSignal?.addEventListener("abort", cancelRequest, {
      once: true,
    });
  }

  const timeoutId = window.setTimeout(() => {
    if (!controller.signal.aborted) {
      timedOut = true;
      controller.abort();
    }
  }, timeoutMs);

  async function sendRequest(requestPath, fetchOptions) {
    const response = await fetch(requestPath, {
      ...fetchOptions,
      credentials: "same-origin",
      signal: controller.signal,
    });

    if (response.status === 401 && requestPath !== "/api/auth/login") {
      window.dispatchEvent(new Event("cellbank:session-expired"));
    }

    if (response.status === 204) {
      return null;
    }

    const contentType = response.headers.get("content-type") || "";
    const isJson =
      contentType.includes("application/json") ||
      contentType.includes("+json");

    let data = null;

    if (isJson) {
      try {
        data = await response.json();
      } catch (error) {
        // Preserve cancellation and connection errors.
        if (!(error instanceof SyntaxError)) {
          throw error;
        }

        if (response.ok) {
          throw new RequestError(
            "INVALID_RESPONSE",
            "The server returned an unreadable response." +
              (actionStarted
                ? " The action may have completed. Check its result before trying again."
                : " Please try again."),
            actionStarted,
          );
        }
      }
    }

    if (!response.ok) {
      throw new ApiError(
        response.status,
        data,
        response.headers.get("Retry-After"),
      );
    }

    if (!isJson) {
      throw new RequestError(
        "INVALID_RESPONSE",
        "The server returned an unexpected response." +
          (actionStarted
            ? " The action may have completed. Check its result before trying again."
            : " Please try again."),
        actionStarted,
      );
    }

    return data;
  }

  try {
    headers.set("Accept", "application/json");

    if (requiresCsrf) {
      const csrf = await sendRequest("/api/auth/csrf", {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      if (!csrf?.headerName || !csrf?.token) {
        throw new RequestError(
          "CSRF_UNAVAILABLE",
          "Could not prepare a secure request. Please try again.",
        );
      }

      headers.set(csrf.headerName, csrf.token);
    }

    // Avoid starting the action if cancellation occurred during setup.
    controller.signal.throwIfAborted();

    actionStarted = requiresCsrf;

    return await sendRequest(path, {
      ...requestOptions,
      method,
      headers,
    });
  } catch (error) {
    if (error instanceof ApiError || error instanceof RequestError) {
      throw error;
    }

    const guidance = actionStarted
      ? " The action may have completed. Check its result before trying again."
      : " Please check your connection and try again.";

    if (timedOut) {
      throw new RequestError(
        "TIMEOUT",
        "The server took too long to respond." + guidance,
        actionStarted,
      );
    }

    if (controller.signal.aborted) {
      throw new RequestError(
        "CANCELLED",
        "The request was cancelled." +
          (actionStarted
            ? " The action may have completed. Check its result before trying again."
            : ""),
        actionStarted,
      );
    }

    if (error instanceof TypeError) {
      throw new RequestError(
        "NETWORK_ERROR",
        "Unable to reach the server or receive its response." + guidance,
        actionStarted,
      );
    }

    throw error;
  } finally {
    window.clearTimeout(timeoutId);
    callerSignal?.removeEventListener("abort", cancelRequest);
  }
}