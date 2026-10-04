import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { hasRole } from "../../../config/accessControl.js";
import { useAuth } from "../../auth/context/AuthContext.jsx";
import { useCustomers } from "../context/CustomersContext.jsx";
import useRepairHistory from "../hooks/useRepairHistory.js";

import CustomerRecordLayout from "../components/CustomerRecordLayout.jsx";
import CustomerRepairHistory from "../components/CustomerRepairHistory.jsx";
import DeviceRegistrationModal from "../components/DeviceRegistrationModal.jsx";

function DeviceDetailsPage() {
  const { customerId, deviceId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { customers, loading, loadError, updateDevice } = useCustomers();

  const [deviceEditOpen, setDeviceEditOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const customer = customers.find((item) => String(item.id) === customerId);

  const device = customer?.devices.find((item) => String(item.id) === deviceId);

  const history = useRepairHistory(
    device ? customer.id : null,
    device?.id ?? null,
  );

  const canManage =
    hasRole(user?.roles, "ADMIN") || hasRole(user?.roles, "FRONT_DESK");

  async function handleDeviceUpdate(data) {
    await updateDevice(customer.id, device.id, data);
    setSuccessMessage("Device information updated.");
  }

  const fields = device
    ? [
        ["Device Type", device.type],
        ["Brand", device.brand],
        ["Model", device.model],
        ["IMEI", device.imei || "Not recorded"],
        ["Serial Number", device.serialNumber || "Not recorded"],
        ["Notes", device.notes || "None recorded"],
      ]
    : [];

  return (
    <CustomerRecordLayout
      title={device ? `${device.brand} ${device.model}` : "Device Details"}
      description={
        customer
          ? `Device registered under ${customer.name}.`
          : "View registered device information."
      }
      found={Boolean(customer && device)}
      busy={deviceEditOpen}
    >
      {customer && device && (
        <>
          {successMessage && (
            <section className="page-content">
              <p role="status">{successMessage}</p>
            </section>
          )}

          <section className="page-content">
            <div className="workspace-section-header">
              <div>
                <h3>Device Information</h3>
                <p className="workspace-section-description">
                  Identification and device information for this record.
                </p>
              </div>

              {canManage && (
                <button
                  className="secondary-repair-button"
                  type="button"
                  disabled={loading || Boolean(loadError)}
                  onClick={() => {
                    setSuccessMessage("");
                    setDeviceEditOpen(true);
                  }}
                >
                  Edit Device
                </button>
              )}
            </div>

            <div className="device-info-grid">
              {fields.map(([label, value]) => (
                <div key={label}>
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
          </section>

          <section className="page-content">
            <CustomerRepairHistory
              repairs={history.repairs}
              loading={history.loading}
              loaded={history.loaded}
              error={history.error}
              onRetry={history.retry}
              onRepairClick={(repairId) => navigate(`/repairs/${repairId}`)}
              deviceView
              disabled={deviceEditOpen}
            />
          </section>

          {deviceEditOpen && (
            <DeviceRegistrationModal
              customerName={customer.name}
              initialDevice={device}
              onClose={() => setDeviceEditOpen(false)}
              onSave={handleDeviceUpdate}
            />
          )}
        </>
      )}
    </CustomerRecordLayout>
  );
}

export default DeviceDetailsPage;
