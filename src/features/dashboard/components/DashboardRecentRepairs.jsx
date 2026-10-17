import StatusBadge from "../../../components/StatusBadge.jsx";

function DashboardRecentRepairs({ repairs, onRepairClick }) {
  if (repairs.length === 0) {
    return (
      <div className="workspace-empty-state">
        <strong>No active repairs</strong>
        <p>Active repair jobs will appear here.</p>
      </div>
    );
  }

  return (
    <div
      className={`dashboard-recent-table-wrapper ${
        repairs.length > 5 ? "dashboard-scroll-list" : ""
      }`}
      role="region"
      aria-label="Recent active repairs"
      tabIndex={0}
    >
      <table className="dashboard-recent-table">
        <thead>
          <tr>
            <th scope="col">Repair</th>
            <th scope="col">Customer / device</th>
            <th scope="col">Status</th>
            <th scope="col">Technician</th>
          </tr>
        </thead>
        <tbody>
          {repairs.map((repair) => (
            <tr key={repair.id} onClick={() => onRepairClick(repair.id)}>
              <td>
                <button
                  type="button"
                  className="record-link"
                  aria-label={`Open repair ${repair.reference}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    onRepairClick(repair.id);
                  }}
                >
                  {repair.reference}
                </button>
              </td>
              <td>
                <div className="dashboard-record-device">
                  <strong>{repair.customer}</strong>
                  <span>{repair.device}</span>
                </div>
              </td>
              <td>
                <StatusBadge status={repair.status} />
              </td>
              <td>{repair.technician}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DashboardRecentRepairs;
