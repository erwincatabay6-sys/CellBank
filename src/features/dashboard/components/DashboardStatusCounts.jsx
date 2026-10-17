import StatusBadge from "../../../components/StatusBadge.jsx";

const statuses = [
  "RECEIVED",
  "AWAITING_APPROVAL",
  "IN_PROGRESS",
  "AWAITING_PARTS",
  "READY_FOR_RELEASE",
  "COMPLETED",
  "CANCELLED",
];

function DashboardStatusCounts({ statusCounts }) {
  return (
    <div className="dashboard-status-grid">
      {statuses.map((status) => (
        <div key={status} className="dashboard-status-card">
          <StatusBadge status={status} />
          <strong>{statusCounts[status] ?? 0}</strong>
        </div>
      ))}
    </div>
  );
}

export default DashboardStatusCounts;
