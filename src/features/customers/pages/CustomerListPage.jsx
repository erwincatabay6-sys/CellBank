import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { hasRole } from "../../../config/accessControl.js";
import { useAuth } from "../../auth/context/AuthContext.jsx";
import { useCustomers } from "../context/CustomersContext.jsx";

import CustomerTable from "../components/CustomerTable.jsx";
import CustomerRegistrationModal from "../components/CustomerRegistrationModal.jsx";

import "../customers.css";

function CustomerListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const {
    customers,
    loading,
    loaded,
    loadError,
    reloadCustomers,
    addCustomer,
  } = useCustomers();

  const [searchTerm, setSearchTerm] = useState("");
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const canManage =
    hasRole(user?.roles, "ADMIN") || hasRole(user?.roles, "FRONT_DESK");

  const search = searchTerm.trim().toLowerCase();

  const filteredCustomers = customers.filter((customer) =>
    [customer.name, customer.phone, customer.email].some((value) =>
      (value ?? "").toLowerCase().includes(search),
    ),
  );

  async function handleCustomerSave(data) {
    await addCustomer(data);
    setSuccessMessage("Customer registered successfully.");
  }

  return (
    <>
      <section className="page-header">
        <h2>Customers</h2>
        <p>Manage customer records, devices, and repair history.</p>
      </section>

      <section className="page-content" aria-busy={loading}>
        <div className="customer-toolbar">
          <div className="customer-search">
            <Search size={18} aria-hidden="true" />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search customers..."
              aria-label="Search customers"
            />
          </div>

          {canManage && (
            <button
              className="create-repair-button customer-new-button"
              type="button"
              disabled={loading || !loaded || Boolean(loadError)}
              onClick={() => {
                setSuccessMessage("");
                setCustomerModalOpen(true);
              }}
            >
              <Plus size={18} />
              <span>New Customer</span>
            </button>
          )}
        </div>

        {successMessage && <p role="status">{successMessage}</p>}

        {loadError && (
          <div className="customer-form-error" role="alert">
            <p>{loadError}</p>

            {loaded && (
              <p>Previously loaded records are shown and may be out of date.</p>
            )}

            <button
              className="secondary-repair-button"
              type="button"
              onClick={() => void reloadCustomers()}
              disabled={loading || customerModalOpen}
            >
              Try Again
            </button>
          </div>
        )}

        {!loaded && loading ? (
          <div role="status" aria-label="Loading customers">
            <div className="customer-table-wrapper" aria-hidden="true">
              <table className="customer-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th>Devices</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 5 }, (_, row) => (
                    <tr key={row}>
                      {Array.from({ length: 4 }, (_, column) => (
                        <td key={column}>
                          <span className="customer-skeleton-line" />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : loaded ? (
          filteredCustomers.length > 0 ? (
            <CustomerTable
              customers={filteredCustomers}
              onCustomerClick={(customerId) =>
                navigate(`/customers/${customerId}`)
              }
            />
          ) : (
            <div className="workspace-empty-state">
              <strong>
                {customers.length === 0
                  ? "No customers registered yet"
                  : "No matching customers"}
              </strong>
              <p>
                {customers.length === 0
                  ? canManage
                    ? "Select New Customer to register the first customer."
                    : "Registered customers will appear here."
                  : "Try a different name, phone number, or email."}
              </p>
            </div>
          )
        ) : null}
      </section>

      {customerModalOpen && (
        <CustomerRegistrationModal
          onClose={() => setCustomerModalOpen(false)}
          onSave={handleCustomerSave}
        />
      )}
    </>
  );
}

export default CustomerListPage;
