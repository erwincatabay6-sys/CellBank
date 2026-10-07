import { useEffect, useRef, useState } from "react";
import { UserPlus, Smartphone } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { createRepair, getRepairTechnicians } from "../../../api/repairApi.js";
import { hasRole } from "../../../config/accessControl.js";
import LoadingSpinner from "../../../components/LoadingSpinner.jsx";

import {
  problemCategoryOptions,
  isValidProblemCategory,
} from "../problemCategories.js";

import { useAuth } from "../../auth/context/AuthContext.jsx";
import { useCustomers } from "../../customers/context/CustomersContext.jsx";
import CustomerRegistrationModal from "../../customers/components/CustomerRegistrationModal.jsx";
import DeviceRegistrationModal from "../../customers/components/DeviceRegistrationModal.jsx";

import "../../customers/customers.css";
import "../repairs.css";

const serviceTypes = [
  ["DIAGNOSTIC", "Diagnostic"],
  ["HARDWARE_REPAIR", "Hardware Repair"],
  ["SOFTWARE_REPAIR", "Software Repair"],
  ["MAINTENANCE", "Maintenance / Cleaning"],
  ["OTHER", "Other"],
];

function getDeviceLabel(device) {
  const name = `${device.brand} ${device.model}`;

  if (device.imei) {
    return `${name} — IMEI ••••${device.imei.slice(-4)}`;
  }

  if (device.serialNumber) {
    return `${name} — S/N ••••${device.serialNumber.slice(-4)}`;
  }

  return name;
}

function NewRepairPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const {
    customers,
    loading,
    loaded,
    loadError,
    reloadCustomers,
    addCustomer,
    addDevice,
  } = useCustomers();

  const canCreate =
    hasRole(user?.roles, "ADMIN") || hasRole(user?.roles, "FRONT_DESK");

  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [deviceModalOpen, setDeviceModalOpen] = useState(false);

  const [values, setValues] = useState({
    customerId: "",
    deviceId: "",
    reportedProblem: "",
    problemCategory: "",
    serviceType: "",
    accessoriesReceived: "",
    intakeNotes: "",
    assignedTechnicianId: "",
    estimatedCost: "",
  });

  const [technicians, setTechnicians] = useState([]);
  const [techniciansLoading, setTechniciansLoading] = useState(true);
  const [technicianError, setTechnicianError] = useState("");
  const [technicianReload, setTechnicianReload] = useState(0);

  const [saving, setSaving] = useState(false);
  const [savedRepair, setSavedRepair] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState("");
  const [outcomeUncertain, setOutcomeUncertain] = useState(false);

  const submitting = useRef(false);

  useEffect(() => {
    if (!canCreate) {
      return;
    }

    const controller = new AbortController();
    let active = true;

    async function loadTechnicians() {
      setTechniciansLoading(true);
      setTechnicianError("");

      try {
        const result = await getRepairTechnicians({
          signal: controller.signal,
        });

        if (!Array.isArray(result)) {
          throw new Error("The server returned an invalid technician list.");
        }

        if (active) {
          setTechnicians(result);
        }
      } catch (error) {
        if (active && error.code !== "CANCELLED") {
          setTechnicianError(error.message || "Unable to load technicians.");
        }
      } finally {
        if (active) {
          setTechniciansLoading(false);
        }
      }
    }

    void loadTechnicians();

    return () => {
      active = false;
      controller.abort();
    };
  }, [canCreate, technicianReload]);

  const selectedCustomer = customers.find(
    (customer) => String(customer.id) === values.customerId,
  );

  const selectedDevice = selectedCustomer?.devices.find(
    (device) => String(device.id) === values.deviceId,
  );

  const modalOpen = customerModalOpen || deviceModalOpen;

  const formDisabled =
    !loaded ||
    loading ||
    Boolean(loadError) ||
    saving ||
    Boolean(savedRepair) ||
    outcomeUncertain ||
    modalOpen;

  function handleChange(event) {
    const { name, value } = event.target;

    setValues((current) => ({
      ...current,
      [name]: value,
      ...(name === "customerId" ? { deviceId: "" } : {}),
    }));

    setFieldErrors((current) => ({
      ...current,
      [name]: "",
      ...(name === "customerId" ? { deviceId: "" } : {}),
    }));
  }

  async function handleNewCustomer(data) {
    const customer = await addCustomer(data);

    setValues((current) => ({
      ...current,
      customerId: String(customer.id),
      deviceId: "",
    }));

    setFieldErrors((current) => ({
      ...current,
      customerId: "",
      deviceId: "",
    }));
  }

  async function handleNewDevice(data) {
    if (!selectedCustomer) {
      throw new Error("Select a customer before registering a device.");
    }

    const device = await addDevice(selectedCustomer.id, data);

    setValues((current) => ({
      ...current,
      deviceId: String(device.id),
    }));

    setFieldErrors((current) => ({
      ...current,
      deviceId: "",
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (submitting.current || formDisabled || !canCreate) {
      return;
    }

    const data = {
      customerId: selectedCustomer?.id,
      deviceId: selectedDevice?.id,
      reportedProblem: values.reportedProblem.trim(),
      problemCategory: values.problemCategory,
      serviceType: values.serviceType,
      accessoriesReceived: values.accessoriesReceived.trim() || null,
      intakeNotes: values.intakeNotes.trim() || null,
      assignedTechnicianId: values.assignedTechnicianId
        ? Number(values.assignedTechnicianId)
        : null,
      estimatedCost: values.estimatedCost.trim() || null,
    };

    const errors = {};

    if (!selectedCustomer) {
      errors.customerId = "Select a customer.";
    }

    if (!selectedDevice) {
      errors.deviceId = "Select a device belonging to this customer.";
    }

    if (!isValidProblemCategory(data.problemCategory)) {
      errors.problemCategory = "Select a problem category.";
    }

    if (!data.reportedProblem) {
      errors.reportedProblem = "Reported problem is required.";
    } else if (data.reportedProblem.length > 5000) {
      errors.reportedProblem =
        "Reported problem must not exceed 5000 characters.";
    }

    if (!serviceTypes.some(([value]) => value === data.serviceType)) {
      errors.serviceType = "Select a supported service type.";
    }

    if ((data.accessoriesReceived?.length ?? 0) > 2000) {
      errors.accessoriesReceived =
        "Accessories received must not exceed 2000 characters.";
    }

    if ((data.intakeNotes?.length ?? 0) > 5000) {
      errors.intakeNotes = "Intake notes must not exceed 5000 characters.";
    }

    if (
      data.estimatedCost !== null &&
      !/^\d{1,10}(\.\d{1,2})?$/.test(data.estimatedCost)
    ) {
      errors.estimatedCost =
        "Enter a nonnegative amount with up to 10 whole digits and 2 decimal places.";
    }

    if (
      data.assignedTechnicianId !== null &&
      (techniciansLoading ||
        technicianError ||
        !technicians.some(
          (technician) => technician.id === data.assignedTechnicianId,
        ))
    ) {
      errors.assignedTechnicianId =
        "Reload technicians and select an available account, or choose Assign later.";
    }

    setFieldErrors(errors);
    setErrorMessage("");

    if (Object.keys(errors).length > 0) {
      return;
    }

    submitting.current = true;
    setSaving(true);

    try {
      const result = await createRepair(data);

      if (
        !result?.id ||
        !result?.repairReference ||
        result.problemCategory !== data.problemCategory
      ) {
        setOutcomeUncertain(true);
        setErrorMessage(
          "The server response did not confirm the repair and its category. " +
            "Check saved repairs before submitting again.",
        );
        return;
      }

      setSavedRepair(result);
    } catch (error) {
      setFieldErrors(error.errors || {});

      if (error.outcomeUncertain || !error.status || error.status >= 500) {
        setOutcomeUncertain(true);
        setErrorMessage(
          "The save could not be confirmed. The repair may have been saved. " +
            "Check saved repairs before submitting again.",
        );
      } else if (error.status === 403) {
        setErrorMessage(
          "You do not have permission to create a repair, or your " +
            "security token has expired. Refresh the page and try again.",
        );
      } else {
        setErrorMessage(
          error.message || "Unable to create the repair. Please try again.",
        );
      }
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  }

  function fieldProps(name) {
    return {
      id: `repair-${name}`,
      name,
      value: values[name],
      onChange: handleChange,
      "aria-invalid": Boolean(fieldErrors[name]),
      "aria-describedby": fieldErrors[name]
        ? `repair-${name}-error`
        : undefined,
    };
  }

  function fieldError(name) {
    return fieldErrors[name] ? (
      <p id={`repair-${name}-error`} className="customer-field-error">
        {fieldErrors[name]}
      </p>
    ) : null;
  }

  if (!canCreate) {
    return (
      <section className="page-content">
        <h2>Access denied</h2>
        <p>You do not have permission to create repairs.</p>
      </section>
    );
  }

  return (
    <>
      <section className="page-header">
        <h2>New Repair</h2>
        <p>Create a Cellbank repair job.</p>
      </section>

      {loading && (
        <section className="page-content" role="status">
          <LoadingSpinner size={18} /> Loading customers and devices...
        </section>
      )}

      {loadError && (
        <section className="page-content">
          <div className="customer-form-error" role="alert">
            <p>{loadError}</p>
            <button
              className="secondary-repair-button"
              type="button"
              onClick={() => void reloadCustomers()}
              disabled={loading || saving || modalOpen}
            >
              Try Again
            </button>
          </div>
        </section>
      )}

      {savedRepair && (
        <section className="page-content">
          <div className="repair-success-message" role="status">
            <strong>Repair created successfully</strong>
            <div>
              Reference: <strong>{savedRepair.repairReference}</strong>
            </div>
            <div>Status: Received</div>
            <div>
              The repair and its initial status history have been saved.
            </div>
          </div>
        </section>
      )}

      <form className="repair-form" onSubmit={handleSubmit} aria-busy={saving}>
        <fieldset
          disabled={formDisabled}
          style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}
        >
          <section className="repair-form-section">
            <div className="repair-form-section-header">
              <div>
                <h3>Customer</h3>
                <p>Select an existing customer or register a new one.</p>
              </div>

              <button
                className="secondary-repair-button"
                type="button"
                onClick={() => setCustomerModalOpen(true)}
              >
                <UserPlus size={18} />
                <span>New Customer</span>
              </button>
            </div>

            <div className="repair-form-grid">
              <div className="repair-form-group">
                <label htmlFor="repair-customerId">Customer</label>
                <select {...fieldProps("customerId")} required>
                  <option value="">Select customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
                {fieldError("customerId")}

                {loaded && customers.length === 0 && (
                  <p>No customers yet. Register a customer to continue.</p>
                )}
              </div>
            </div>
          </section>

          <section className="repair-form-section">
            <div className="repair-form-section-header">
              <div>
                <h3>Problem Category</h3>
                <p>
                  Select the primary reported problem. A technician can update
                  this after diagnosis.
                </p>
              </div>
            </div>

            <div className="repair-form-grid">
              <div className="repair-form-group">
                <label htmlFor="repair-problemCategory">Problem Category</label>

                <select {...fieldProps("problemCategory")} required>
                  <option value="">Select problem category</option>

                  {problemCategoryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                {fieldError("problemCategory")}
              </div>
            </div>
          </section>

          <section className="repair-form-section">
            <div className="repair-form-section-header">
              <div>
                <h3>Device</h3>
                <p>Select or register a device for this customer.</p>
              </div>

              <button
                className="secondary-repair-button"
                type="button"
                disabled={!selectedCustomer}
                onClick={() => setDeviceModalOpen(true)}
              >
                <Smartphone size={18} />
                <span>New Device</span>
              </button>
            </div>

            <div className="repair-form-grid">
              <div className="repair-form-group">
                <label htmlFor="repair-deviceId">Device</label>
                <select
                  {...fieldProps("deviceId")}
                  disabled={!selectedCustomer}
                  required
                >
                  <option value="">
                    {!selectedCustomer
                      ? "Select customer first"
                      : selectedCustomer.devices.length === 0
                        ? "No registered devices"
                        : "Select device"}
                  </option>

                  {selectedCustomer?.devices.map((device) => (
                    <option key={device.id} value={device.id}>
                      {getDeviceLabel(device)}
                    </option>
                  ))}
                </select>
                {fieldError("deviceId")}
              </div>
            </div>

            {selectedDevice && (
              <div className="selected-device-summary">
                <h4>Selected Device</h4>
                <div className="selected-device-grid">
                  {[
                    ["Device Type", selectedDevice.type],
                    [
                      "Device",
                      `${selectedDevice.brand} ${selectedDevice.model}`,
                    ],
                    [
                      "Serial Number",
                      selectedDevice.serialNumber || "Not recorded",
                    ],
                    ["IMEI", selectedDevice.imei || "Not recorded"],
                    ["Previous Repairs", "History connection pending"],
                    ["Notes", selectedDevice.notes || "Not recorded"],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <span>{label}</span>
                      <strong>{value}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="repair-form-section">
            <div className="repair-form-section-header">
              <div>
                <h3>Repair Information</h3>
                <p>Record the reported issue and intake details.</p>
              </div>
            </div>

            <div className="repair-form-grid">
              <div className="repair-form-group repair-form-full">
                <label htmlFor="repair-reportedProblem">Reported Problem</label>
                <textarea
                  {...fieldProps("reportedProblem")}
                  rows={4}
                  maxLength={5000}
                  required
                />
                {fieldError("reportedProblem")}
              </div>

              <div className="repair-form-group">
                <label htmlFor="repair-serviceType">Service Type</label>
                <select {...fieldProps("serviceType")} required>
                  <option value="">Select service type</option>
                  {serviceTypes.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                {fieldError("serviceType")}
              </div>

              <div className="repair-form-group">
                <label htmlFor="repair-accessoriesReceived">
                  Accessories Received
                </label>
                <input
                  {...fieldProps("accessoriesReceived")}
                  type="text"
                  maxLength={2000}
                  placeholder="Optional, e.g. charger or laptop bag"
                />
                {fieldError("accessoriesReceived")}
              </div>

              <div className="repair-form-group repair-form-full">
                <label htmlFor="repair-intakeNotes">Intake Notes</label>
                <textarea
                  {...fieldProps("intakeNotes")}
                  rows={3}
                  maxLength={5000}
                  placeholder="Optional"
                />
                {fieldError("intakeNotes")}
              </div>
            </div>
          </section>

          <section className="repair-form-section">
            <div className="repair-form-section-header">
              <div>
                <h3>Assignment &amp; Estimate</h3>
                <p>Optionally assign a technician and record an estimate.</p>
              </div>
            </div>

            <div className="repair-form-grid">
              <div className="repair-form-group">
                <label htmlFor="repair-assignedTechnicianId">
                  Assigned Technician
                </label>
                <select {...fieldProps("assignedTechnicianId")}>
                  <option value="">Assign later</option>
                  {technicians.map((technician) => (
                    <option
                      key={technician.id}
                      value={technician.id}
                      disabled={techniciansLoading || Boolean(technicianError)}
                    >
                      {technician.name}
                    </option>
                  ))}
                </select>
                {fieldError("assignedTechnicianId")}

                {techniciansLoading && (
                  <p role="status">Loading technicians...</p>
                )}

                {technicianError && (
                  <div className="customer-form-error" role="alert">
                    <p>{technicianError}</p>
                    <p>You can still create the repair using Assign later.</p>
                    <button
                      className="secondary-repair-button"
                      type="button"
                      onClick={() => setTechnicianReload((value) => value + 1)}
                    >
                      Retry Technicians
                    </button>
                  </div>
                )}

                {!techniciansLoading &&
                  !technicianError &&
                  technicians.length === 0 && (
                    <p>No active technicians. Leave this as Assign later.</p>
                  )}
              </div>

              <div className="repair-form-group">
                <label htmlFor="repair-estimatedCost">Estimated Cost</label>
                <input
                  {...fieldProps("estimatedCost")}
                  type="number"
                  min="0"
                  max="9999999999.99"
                  step="0.01"
                  placeholder="Optional"
                />
                {fieldError("estimatedCost")}
              </div>
            </div>
          </section>
        </fieldset>

        {errorMessage && (
          <div className="customer-form-error" role="alert">
            <p>{errorMessage}</p>
            {outcomeUncertain && (
              <a href="/api/repairs" target="_blank" rel="noreferrer">
                Check saved repairs in a new tab
              </a>
            )}
          </div>
        )}

        <div className="repair-form-actions">
          <button
            className="cancel-repair-button"
            type="button"
            onClick={() => navigate("/customers")}
            disabled={saving || modalOpen}
          >
            {savedRepair ? "Back to Customers" : "Cancel"}
          </button>

          <button
            className="create-repair-button"
            type="submit"
            disabled={formDisabled}
          >
            {saving && <LoadingSpinner size={16} />}
            <span>
              {saving
                ? "Creating Repair..."
                : savedRepair
                  ? "Repair Created"
                  : "Create Repair"}
            </span>
          </button>
        </div>
      </form>

      {customerModalOpen && (
        <CustomerRegistrationModal
          onClose={() => setCustomerModalOpen(false)}
          onSave={handleNewCustomer}
        />
      )}

      {deviceModalOpen && selectedCustomer && (
        <DeviceRegistrationModal
          customerName={selectedCustomer.name}
          onClose={() => setDeviceModalOpen(false)}
          onSave={handleNewDevice}
        />
      )}
    </>
  );
}

export default NewRepairPage;
