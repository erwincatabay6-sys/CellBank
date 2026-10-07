import StatusBadge from "../../../components/StatusBadge.jsx";

import {
  getProblemCategoryLabel,
  getRepeatedDeviceProblems,
} from "../../repairs/problemCategories.js";

const serviceLabels = {
  DIAGNOSTIC: "Diagnostic",
  HARDWARE_REPAIR: "Hardware Repair",
  SOFTWARE_REPAIR: "Software Repair",
  MAINTENANCE: "Maintenance / Cleaning",
  OTHER: "Other",
};

function CustomerRepairHistory({
  repairs = [],
  devices = [],
  loading = false,
  loaded = false,
  error = "",
  onRetry,
  onRepairClick,
  deviceView = false,
  disabled = false,
}) {
  const devicesById = new Map(devices.map((device) => [device.id, device]));

  const historyClassName = deviceView
    ? "device-repair-history"
    : "customer-repair-history";

  const itemClassName = deviceView
    ? "device-repair-item"
    : "customer-repair-item";

  const canShowPatterns = deviceView && loaded && !loading && !error;

  const repeatedProblems = canShowPatterns
    ? getRepeatedDeviceProblems(repairs)
    : [];

  const uncategorizedCount = new Set(
    repairs
      .filter(
        (repair) =>
          repair.status !== "CANCELLED" && repair.problemCategory == null,
      )
      .map((repair) => repair.id),
  ).size;

  function deviceLabel(deviceId) {
    const device = devicesById.get(deviceId);

    return device ? `${device.brand} ${device.model}` : `Device #${deviceId}`;
  }

  return (
    <section className="customer-repair-history-section" aria-busy={loading}>
      <div className="workspace-section-header">
        <div>
          <h3>Repair History</h3>

          <p className="workspace-section-description">
            {deviceView
              ? "Previous and current repair records for this device."
              : "Current and previous repairs for this customer's devices."}
          </p>
        </div>
      </div>

      {error && (
        <div className="customer-form-error" role="alert">
          <p>{error}</p>

          {loaded && (
            <p>Previously loaded history is shown and may be out of date.</p>
          )}

          <button
            className="secondary-repair-button"
            type="button"
            onClick={onRetry}
            disabled={loading || disabled}
          >
            Try Again
          </button>
        </div>
      )}

      {!loaded && loading && (
        <div role="status" aria-label="Loading repair history">
          <div className={historyClassName} aria-hidden="true">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className={itemClassName}>
                {Array.from({ length: 4 }, (_, field) => (
                  <div key={field}>
                    <span className="customer-skeleton-line" />
                    <span className="customer-skeleton-line" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {canShowPatterns && repeatedProblems.length > 0 && (
        <div className="customer-repeated-problem-alert">
          <strong>Repeated Problem Detected</strong>

          {repeatedProblems.map((group) => (
            <p key={`${group.deviceId}:${group.category}`}>
              {getProblemCategoryLabel(group.category)} issue recorded in{" "}
              {group.count} repair visits.
            </p>
          ))}
        </div>
      )}

      {loaded && repairs.length > 0 && (
        <div className={historyClassName}>
          {repairs.map((repair) => (
            <button
              key={repair.id}
              className={itemClassName}
              type="button"
              onClick={() => onRepairClick(repair.id)}
              disabled={disabled}
              aria-label={`Open repair ${repair.repairReference}`}
            >
              <div>
                <span>Repair Reference</span>
                <strong>{repair.repairReference}</strong>
              </div>

              {deviceView ? (
                <>
                  <div>
                    <span>Reported Problem</span>
                    <strong>{repair.reportedProblem}</strong>
                  </div>

                  <div>
                    <span>Service Type</span>
                    <strong>
                      {serviceLabels[repair.serviceType] ?? repair.serviceType}
                    </strong>

                    <span>Problem Category</span>
                    <strong>
                      {getProblemCategoryLabel(repair.problemCategory)}
                    </strong>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <span>Device</span>
                    <strong>{deviceLabel(repair.deviceId)}</strong>
                  </div>

                  <div>
                    <span>Reported Problem</span>
                    <strong>{repair.reportedProblem}</strong>
                  </div>
                </>
              )}

              <div>
                <span>Status</span>
                <StatusBadge status={repair.status} />
              </div>
            </button>
          ))}
        </div>
      )}

      {loaded && !loading && !error && repairs.length === 0 && (
        <div className="workspace-empty-state">
          <strong>No repair history</strong>

          <p>
            {deviceView
              ? "Repair jobs created for this device will appear here."
              : "Repair jobs for this customer's devices will appear here."}
          </p>
        </div>
      )}
    </section>
  );
}

export default CustomerRepairHistory;
