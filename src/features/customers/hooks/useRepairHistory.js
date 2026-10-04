import { useEffect, useState } from "react";

import {
  getCustomerRepairHistory,
  getDeviceRepairHistory,
} from "../../../api/repairApi.js";

export default function useRepairHistory(customerId, deviceId = null) {
  const [state, setState] = useState({
    key: null,
    repairs: [],
    loading: false,
    loaded: false,
    error: "",
  });

  const [retryVersion, setRetryVersion] = useState(0);

  const enabled = customerId != null;
  const key = enabled ? `${customerId}:${deviceId ?? "all"}` : null;

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const controller = new AbortController();
    let active = true;

    async function loadHistory() {
      setState((current) => ({
        key,
        repairs: current.key === key ? current.repairs : [],
        loaded: current.key === key && current.loaded,
        loading: true,
        error: "",
      }));

      try {
        const options = { signal: controller.signal };

        const result =
          deviceId == null
            ? await getCustomerRepairHistory(customerId, options)
            : await getDeviceRepairHistory(customerId, deviceId, options);

        if (!Array.isArray(result)) {
          throw new Error("The server returned invalid repair history.");
        }

        if (active) {
          setState({
            key,
            repairs: result,
            loading: false,
            loaded: true,
            error: "",
          });
        }
      } catch (error) {
        if (active && error.code !== "CANCELLED") {
          setState((current) => ({
            ...current,
            loading: false,
            error:
              error.status === 403
                ? "You do not have permission to view repair history."
                : error.message || "Unable to load repair history.",
          }));
        }
      }
    }

    void loadHistory();

    return () => {
      active = false;
      controller.abort();
    };
  }, [customerId, deviceId, enabled, key, retryVersion]);

  const current = enabled && state.key === key;

  return {
    repairs: current ? state.repairs : [],
    loading: enabled && (!current || state.loading),
    loaded: current && state.loaded,
    error: current ? state.error : "",
    retry: () => setRetryVersion((value) => value + 1),
  };
}
