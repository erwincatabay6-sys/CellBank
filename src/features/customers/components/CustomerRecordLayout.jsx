import { useCustomers } from "../context/CustomersContext.jsx";

import "../customers.css";

function CustomerRecordLayout({
  title,
  description,
  found,
  busy = false,
  children,
}) {
  const { loading, loaded, loadError, reloadCustomers } = useCustomers();

  const initialLoading = !loaded && loading;
  const recordMissing = loaded && !found && !loadError && !loading;
  const showStatusPanel =
    Boolean(loadError) || initialLoading || recordMissing;

  return (
    <>
      <section className="page-header">
        <h2>{title}</h2>
        <p>{description}</p>
      </section>

      {showStatusPanel && (
        <section className="page-content" aria-busy={loading}>
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

          {initialLoading && (
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

          {recordMissing && (
            <div className="workspace-empty-state">
              <strong>Record not found</strong>
              <p>The requested record is not available.</p>
            </div>
          )}
        </section>
      )}

      {loaded && found ? children : null}
    </>
  );
}

export default CustomerRecordLayout;