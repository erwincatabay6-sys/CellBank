import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { hasRole } from "../../../config/accessControl.js";
import { useAuth } from "../../auth/context/AuthContext.jsx";
import { useCustomers } from "../context/CustomersContext.jsx";

import CustomerRecordLayout from "../components/CustomerRecordLayout.jsx";
import CustomerDeviceList from "../components/CustomerDeviceList.jsx";
import CustomerRegistrationModal from "../components/CustomerRegistrationModal.jsx";
import DeviceRegistrationModal from "../components/DeviceRegistrationModal.jsx";

function CustomerDetailsPage() {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { customers, loading, loadError, addDevice, updateCustomer } =
    useCustomers();

  const [customerEditOpen, setCustomerEditOpen] = useState(false);
  const [deviceModalOpen, setDeviceModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const customer = customers.find((item) => String(item.id) === customerId);

  const canManage =
    hasRole(user?.roles, "ADMIN") || hasRole(user?.roles, "FRONT_DESK");

  const canEditNow = canManage && !loading && !loadError;
  const modalOpen = customerEditOpen || deviceModalOpen;

  async function handleCustomerUpdate(data) {
    await updateCustomer(customer.id, data);
    setSuccessMessage("Customer information updated.");
  }

  async function handleDeviceSave(data) {
    await addDevice(customer.id, data);
    setSuccessMessage("Device registered successfully.");
  }

  return (
    <CustomerRecordLayout
      title={customer?.name ?? "Customer Details"}
      description="View customer information and registered devices."
      found={Boolean(customer)}
      backPath="/customers"
      backLabel="Back to Customers"
      busy={modalOpen}
    >
      {customer && (
        <>
          {successMessage && (
            <section className="page-content">
              <p role="status">{successMessage}</p>
            </section>
          )}

          <section className="page-content">
            <div className="workspace-section-header">
              <div>
                <h3>Customer Information</h3>
                <p className="workspace-section-description">
                  Contact information for this customer.
                </p>
              </div>

              {canManage && (
                <button
                  className="secondary-repair-button"
                  type="button"
                  disabled={!canEditNow}
                  onClick={() => {
                    setSuccessMessage("");
                    setCustomerEditOpen(true);
                  }}
                >
                  Edit Customer
                </button>
              )}
            </div>

            <div className="customer-info-grid">
              <div>
                <span>Full Name</span>
                <strong>{customer.name}</strong>
              </div>

              <div>
                <span>Phone</span>
                <strong>{customer.phone}</strong>
              </div>

              <div>
                <span>Email</span>
                <strong>{customer.email || "Not recorded"}</strong>
              </div>

              <div>
                <span>Address</span>
                <strong>{customer.address || "Not recorded"}</strong>
              </div>

              <div>
                <span>Registered Devices</span>
                <strong>{customer.devices.length}</strong>
              </div>
            </div>
          </section>

          <section className="page-content">
            <CustomerDeviceList
              devices={customer.devices}
              canManage={canManage}
              disabled={!canEditNow}
              onDeviceClick={(deviceId) =>
                navigate(`/customers/${customer.id}/devices/${deviceId}`)
              }
              onNewDevice={() => {
                setSuccessMessage("");
                setDeviceModalOpen(true);
              }}
            />
          </section>

          {customerEditOpen && (
            <CustomerRegistrationModal
              initialCustomer={customer}
              onClose={() => setCustomerEditOpen(false)}
              onSave={handleCustomerUpdate}
            />
          )}

          {deviceModalOpen && (
            <DeviceRegistrationModal
              customerName={customer.name}
              onClose={() => setDeviceModalOpen(false)}
              onSave={handleDeviceSave}
            />
          )}
        </>
      )}
    </CustomerRecordLayout>
  );
}

export default CustomerDetailsPage;
