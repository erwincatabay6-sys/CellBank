import { useNavigate } from "react-router-dom";

import LoadingSpinner from "../../../components/LoadingSpinner.jsx";
import { useCustomers } from "../context/CustomersContext.jsx";

import "../customers.css";

function CustomerRecordLayout({
  title,
  description,
  found,
  backPath,
  backLabel,
  busy = false,
  children,
}) {
  const navigate = useNavigate();

  const { loading, loaded, loadError, reloadCustomers } = useCustomers();

  return (
    <>
      <section className="page-header">
        <h2>{title}</h2>
        <p>{description}</p>
      </section>

      <section className="page-content">
        <div className="customer-toolbar">
          <button
            className="secondary-repair-button"
            type="button"
            onClick={() => navigate(backPath)}
            disabled={busy}
          >
            {backLabel}
          </button>

          <button
            className="secondary-repair-button"
            type="button"
            onClick={() => void reloadCustomers()}
            disabled={loading || busy}
          >
            {loading && <LoadingSpinner size={16} />}
            <span>{loading ? "Loading..." : "Refresh"}</span>
          </button>
        </div>

        {loadError && (
          <div className="customer-form-error" role="alert">
            <p>{loadError}</p>

            {loaded && found && (
              <p>
                Previously loaded information is shown and may be out of date.
              </p>
            )}

            <button
              className="secondary-repair-button"
              type="button"
              onClick={() => void reloadCustomers()}
              disabled={loading || busy}
            >
              Try Again
            </button>
          </div>
        )}

        {!loaded && loading && (
          <div role="status" aria-label="Loading record">
            <div className="customer-info-grid" aria-hidden="true">
              {Array.from({ length: 6 }, (_, index) => (
                <div key={index}>
                  <span className="customer-skeleton-line" />
                  <span className="customer-skeleton-line" />
                </div>
              ))}
            </div>
          </div>
        )}

        {loaded && !found && !loadError && !loading && (
          <div className="workspace-empty-state">
            <strong>Record not found</strong>
            <p>The requested record is not available.</p>
          </div>
        )}
      </section>

      {loaded && found ? children : null}
    </>
  );
}

export default CustomerRecordLayout;
