import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { useAuth } from "../../auth/context/AuthContext.jsx";

import {
  getCustomers,
  createCustomer,
  updateCustomer as updateCustomerRequest,
} from "../../../api/customerApi.js";

import {
  createDevice,
  updateDevice as updateDeviceRequest,
} from "../../../api/deviceApi.js";

const CustomersContext = createContext(null);

function normalizeCustomer(customer) {
  if (!Array.isArray(customer.devices)) {
    throw new Error("The server returned invalid customer device data.");
  }

  return {
    ...customer,
    email: customer.email ?? "",
    address: customer.address ?? "",
  };
}

function sortCustomers(customers) {
  return [...customers].sort(
    (a, b) => a.name.localeCompare(b.name) || a.id - b.id,
  );
}

export function CustomersProvider({ children }) {
  const { user } = useAuth();

  const sessionKey = user
    ? `${user.id}:${[...user.roles].sort().join(",")}`
    : "signed-out";

  return (
    <CustomerStore key={sessionKey} enabled={Boolean(user)}>
      {children}
    </CustomerStore>
  );
}

function CustomerStore({ children, enabled }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(enabled);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState("");

  const mounted = useRef(false);
  const controllerRef = useRef(null);
  const requestVersion = useRef(0);

  const reloadCustomers = useCallback(async () => {
    if (!enabled || !mounted.current) {
      return;
    }

    controllerRef.current?.abort();

    const controller = new AbortController();
    controllerRef.current = controller;

    const version = ++requestVersion.current;

    setLoading(true);
    setLoadError("");

    try {
      const result = await getCustomers({
        signal: controller.signal,
      });

      if (!Array.isArray(result)) {
        throw new Error("The server returned an invalid customer list.");
      }

      const nextCustomers = result.map(normalizeCustomer);

      if (mounted.current && version === requestVersion.current) {
        setCustomers(sortCustomers(nextCustomers));
        setLoaded(true);
      }
    } catch (error) {
      if (
        mounted.current &&
        version === requestVersion.current &&
        error.code !== "CANCELLED"
      ) {
        setLoadError(
          error.status === 403
            ? "You do not have permission to view customers."
            : error.message || "Unable to load customers.",
        );
      }
    } finally {
      if (mounted.current && version === requestVersion.current) {
        setLoading(false);
      }
    }
  }, [enabled]);

  useEffect(() => {
    mounted.current = true;

    void reloadCustomers();

    return () => {
      mounted.current = false;
      requestVersion.current += 1;
      controllerRef.current?.abort();
    };
  }, [reloadCustomers]);

  function cancelOlderRead() {
    requestVersion.current += 1;
    controllerRef.current?.abort();
    setLoading(false);
  }

  function storeCustomer(customer) {
    if (!mounted.current) {
      return;
    }

    cancelOlderRead();

    setCustomers((current) =>
      sortCustomers([
        ...current.filter((item) => item.id !== customer.id),
        customer,
      ]),
    );
  }

  async function addCustomer(data) {
    const saved = normalizeCustomer(await createCustomer(data));
    storeCustomer(saved);
    return saved;
  }

  async function updateCustomer(customerId, data) {
    const saved = normalizeCustomer(
      await updateCustomerRequest(customerId, data),
    );

    storeCustomer(saved);
    return saved;
  }

  function storeDevice(customerId, device) {
    if (!mounted.current) {
      return;
    }

    cancelOlderRead();

    setCustomers((current) =>
      current.map((customer) =>
        customer.id === customerId
          ? {
              ...customer,
              devices: [
                ...customer.devices.filter((item) => item.id !== device.id),
                device,
              ].sort((a, b) => a.id - b.id),
            }
          : customer,
      ),
    );
  }

  async function addDevice(customerId, data) {
    const saved = await createDevice(customerId, data);
    storeDevice(customerId, saved);
    return saved;
  }

  async function updateDevice(customerId, deviceId, data) {
    const saved = await updateDeviceRequest(customerId, deviceId, data);

    storeDevice(customerId, saved);
    return saved;
  }

  return (
    <CustomersContext.Provider
      value={{
        customers,
        loading,
        loaded,
        loadError,
        reloadCustomers,
        addCustomer,
        updateCustomer,
        addDevice,
        updateDevice,
      }}
    >
      {children}
    </CustomersContext.Provider>
  );
}

export function useCustomers() {
  const context = useContext(CustomersContext);

  if (!context) {
    throw new Error("useCustomers must be used inside CustomersProvider.");
  }

  return context;
}
