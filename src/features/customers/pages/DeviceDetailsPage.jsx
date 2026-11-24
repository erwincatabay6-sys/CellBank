import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import useFeedbackState from "../../../hooks/useFeedbackState.js";

import { hasRole } from "../../../config/accessControl.js";
import { useAuth } from "../../auth/context/AuthContext.jsx";
import { useCustomers } from "../context/CustomersContext.jsx";
import useRepairHistory from "../hooks/useRepairHistory.js";

import CustomerRecordLayout from "../components/CustomerRecordLayout.jsx";
import CustomerRepairHistory from "../components/CustomerRepairHistory.jsx";
import DeviceRegistrationModal from "../components/DeviceRegistrationModal.jsx";

import "../deviceDetails.css";

function DeviceDetailsPage() {
  const { customerId, deviceId } = useParams();

  return <DeviceDetails key={`${customerId}:${deviceId}`} customerId={customerId} deviceId={deviceId} />;
}

function DeviceDetails({ customerId, deviceId }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { customers, loading, loadError, updateDevice } = useCustomers();

  const [deviceEditOpen, setDeviceEditOpen] = useState(false);
  const [, setSuccessMessage] = useFeedbackState("", {
    toast: { variant: "success", title: "Device updated" },
  });

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

  const header = customer && device ? (
    <section className="page-header device-detail-header">
      <div>
        <h2>{device.brand} {device.model}</h2>
        <Link to={`/customers/${customer.id}`}>{customer.name}</Link>
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
    </section>
  ) : undefined;

  return (
    <CustomerRecordLayout
      title="Device Details"
      description="View registered device information."
      header={header}
      found={Boolean(customer && device)}
      busy={deviceEditOpen}
    >
      {customer && device && (
        <>
          <section className="page-content device-detail-information">
            <h3>Device Information</h3>
            <dl className="device-info-grid">
              {fields.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="page-content">
            <CustomerRepairHistory
              repairs={history.repairs}
              loading={history.loading}
              loaded={history.loaded}
              error={history.error}
              restricted={history.restricted}
              onRetry={history.retry}
              onRepairClick={(repairId) => navigate(`/repairs/${repairId}`)}
              deviceView
              disabled={deviceEditOpen}
            />
          </section>

          {deviceEditOpen && canManage && (
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
