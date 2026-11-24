import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Mail, MapPin, Phone } from "lucide-react";

import useFeedbackState from "../../../hooks/useFeedbackState.js";
import { hasRole } from "../../../config/accessControl.js";
import { useAuth } from "../../auth/context/AuthContext.jsx";
import { useCustomers } from "../context/CustomersContext.jsx";
import useRepairHistory from "../hooks/useRepairHistory.js";

import CustomerRecordLayout from "../components/CustomerRecordLayout.jsx";
import CustomerDeviceList, { DEVICE_PAGE_SIZE } from "../components/CustomerDeviceList.jsx";
import CustomerRepairHistory from "../components/CustomerRepairHistory.jsx";
import CustomerRegistrationModal from "../components/CustomerRegistrationModal.jsx";
import DeviceRegistrationModal from "../components/DeviceRegistrationModal.jsx";

import "../customerDetails.css";

function CustomerDetailsPage() {
  const { customerId } = useParams();

  return <CustomerDetails key={customerId} customerId={customerId} />;
}

function CustomerDetails({ customerId }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { customers, loading, loadError, addDevice, updateCustomer } =
    useCustomers();

  const [activeTab, setActiveTab] = useState("devices");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [customerEditOpen, setCustomerEditOpen] = useState(false);
  const [deviceModalOpen, setDeviceModalOpen] = useState(false);
  const [, setSuccessMessage] = useFeedbackState("", {
    toast: { variant: "success", title: "Record saved" },
  });

  const customer = customers.find((item) => String(item.id) === customerId);
  const history = useRepairHistory(customer?.id);
  const canManage =
    hasRole(user?.roles, "ADMIN") || hasRole(user?.roles, "FRONT_DESK");
  const canEditNow = canManage && !loading && !loadError;
  const modalOpen = customerEditOpen || deviceModalOpen;

  async function handleCustomerUpdate(data) {
    await updateCustomer(customer.id, data);
    setSuccessMessage("Customer information updated.");
  }

  async function handleDeviceSave(data) {
    const saved = await addDevice(customer.id, data);
    // The store orders devices by ID after a save.
    const index = customer.devices.filter((device) => device.id < saved.id).length;
    setSearch("");
    setPage(Math.floor(index / DEVICE_PAGE_SIZE) + 1);
    setSuccessMessage("Device registered successfully.");
  }

  function handleTabKeyDown(event, index) {
    let next;
    switch (event.key) {
      case "ArrowLeft":
      case "ArrowRight": next = 1 - index; break;
      case "Home": next = 0; break;
      case "End": next = 1; break;
      default: return;
    }
    event.preventDefault();
    event.currentTarget.parentElement.querySelectorAll('[role="tab"]')[next].focus();
    setActiveTab(next === 0 ? "devices" : "history");
  }

  const header = customer && (
    <section className="page-header customer-detail-header">
      <nav aria-label="Breadcrumb" className="customer-detail-breadcrumb">
        <Link to="/customers">Customers</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Customer details</span>
      </nav>
      <div className="customer-detail-title">
        <h2>{customer.name}</h2>
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
      <dl className="customer-detail-contact">
        {[
          ["Phone", Phone, customer.phone],
          ["Email", Mail, customer.email],
          ["Address", MapPin, customer.address],
        ].map(([label, Icon, value]) => (
          <div key={label}>
            <dt>
              <Icon size={16} aria-hidden="true" />
              <span className="loading-announcement">{label}</span>
            </dt>
            <dd>{value || "Not recorded"}</dd>
          </div>
        ))}
      </dl>
    </section>
  );

  const repairCount = history.loaded ? history.repairs.length :
    history.error ? "unavailable" : "loading";

  return (
    <CustomerRecordLayout
      title="Customer Details"
      description="View customer information, registered devices, and repair history."
      header={header}
      found={Boolean(customer)}
      busy={modalOpen}
    >
      {customer && (
        <>
          <section className="page-content customer-detail-panel">
            <div className="customer-detail-tabs" role="tablist" aria-label="Customer records">
              {[
                ["devices", `Registered devices (${customer.devices.length})`],
                ["history", `Repair history (${repairCount})`],
              ].map(([id, label], index) => (
                <button
                  key={id}
                  type="button"
                  id={`customer-tab-${id}`}
                  role="tab"
                  aria-controls={`customer-panel-${id}`}
                  aria-selected={activeTab === id}
                  tabIndex={activeTab === id ? 0 : -1}
                  onClick={() => setActiveTab(id)}
                  onKeyDown={(event) => handleTabKeyDown(event, index)}
                >
                  {label}
                </button>
              ))}
            </div>

            <div
              id="customer-panel-devices"
              role="tabpanel"
              aria-labelledby="customer-tab-devices"
              hidden={activeTab !== "devices"}
            >
              <CustomerDeviceList
                devices={customer.devices}
                customerId={customer.id}
                search={search}
                page={page}
                onSearch={(value) => {
                  setSearch(value);
                  setPage(1);
                }}
                onPageChange={setPage}
                canManage={canManage}
                disabled={!canEditNow}
                onNewDevice={() => {
                  setSuccessMessage("");
                  setDeviceModalOpen(true);
                }}
              />
            </div>

            <div
              id="customer-panel-history"
              role="tabpanel"
              aria-labelledby="customer-tab-history"
              hidden={activeTab !== "history"}
              tabIndex={0}
            >
              <CustomerRepairHistory
                repairs={history.repairs}
                devices={customer.devices}
                loading={history.loading}
                loaded={history.loaded}
                error={history.error}
                restricted={history.restricted}
                onRetry={history.retry}
                onRepairClick={(repairId) => navigate(`/repairs/${repairId}`)}
                disabled={modalOpen}
              />
            </div>
          </section>

          {customerEditOpen && canManage && (
            <CustomerRegistrationModal
              initialCustomer={customer}
              onClose={() => setCustomerEditOpen(false)}
              onSave={handleCustomerUpdate}
            />
          )}

          {deviceModalOpen && canManage && (
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
