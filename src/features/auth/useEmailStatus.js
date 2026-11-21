import { useCallback, useEffect, useRef, useState } from "react";

export function deadlineFromServer(timestamp, serverTime) {
  const delta = Date.parse(timestamp) - Date.parse(serverTime);
  return Number.isFinite(delta) ? Date.now() + delta : 0;
}

export default function useEmailStatus(fetchStatus) {
  const sequence = useRef(0);
  const [status, setStatus] = useState(null);
  const [statusError, setStatusError] = useState("");

  const refreshStatus = useCallback(async () => {
    const request = ++sequence.current;
    try {
      const result = await fetchStatus();
      if (request !== sequence.current) return;
      setStatus({
        ...result,
        resendDeadline: deadlineFromServer(result.resendAvailableAt, result.serverTime),
        expiryDeadline: deadlineFromServer(result.expiresAt, result.serverTime),
      });
      setStatusError("");
    } catch (error) {
      if (request === sequence.current) setStatusError(error.message);
    }
  }, [fetchStatus]);

  useEffect(() => {
    void refreshStatus();
    function onVisible() {
      if (document.visibilityState === "visible") void refreshStatus();
    }
    window.addEventListener("focus", refreshStatus);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      sequence.current++;
      window.removeEventListener("focus", refreshStatus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refreshStatus]);

  return { status, statusError, refreshStatus };
}
