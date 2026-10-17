import { ChevronRight } from "lucide-react";
import StatusBadge from "../../../components/StatusBadge.jsx";

const descriptions = {
  AWAITING_APPROVAL: "Repairs awaiting customer approval.",
  AWAITING_PARTS: "Repairs awaiting parts.",
  READY_FOR_RELEASE: "Repairs ready for release.",
};

function DashboardAttentionRepairs({ repairs, onRepairClick }) {
  if (repairs.length === 0) {
    return (
      <div className="workspace-empty-state">
        <strong>No repairs need attention</strong>
        <p>There are currently no repair jobs requiring immediate follow-up.</p>
      </div>
    );
  }

  const groups = new Map();

  for (const repair of repairs) {
    if (!groups.has(repair.status)) {
      groups.set(repair.status, []);
    }
    groups.get(repair.status).push(repair);
  }

  return (
    <div
      className={`dashboard-attention-list ${
        repairs.length > 5 ? "dashboard-scroll-list" : ""
      }`}
      role="region"
      aria-label="Repairs needing attention"
      tabIndex={repairs.length > 5 ? 0 : undefined}
    >
      {Array.from(groups, ([status, records]) => (
        <details className="dashboard-attention-group" key={status}>
          <summary className="dashboard-attention-summary">
            <span className="dashboard-attention-copy">
              <StatusBadge status={status} />
              <span>
                {descriptions[status] ?? "Review the repairs in this group."}
              </span>
            </span>
            <span
              className={`dashboard-attention-count status-${status.toLowerCase().replaceAll("_", "-")}`}
              aria-label={`${records.length} ${records.length === 1 ? "repair" : "repairs"} in this group`}
            >
              {records.length}
            </span>
            <ChevronRight
              size={16}
              className="dashboard-attention-chevron"
              aria-hidden="true"
            />
          </summary>
          <div className="dashboard-attention-records">
            {records.map((repair) => (
              <button
                key={repair.id}
                className="dashboard-attention-item"
                type="button"
                onClick={() => onRepairClick(repair.id)}
              >
                <span className="dashboard-attention-main">
                  <strong>{repair.reference}</strong>
                  <span>{repair.customer}</span>
                  <span>{repair.device}</span>
                </span>
                <span className="dashboard-attention-technician">
                  {repair.technician}
                </span>
              </button>
            ))}
          </div>
        </details>
      ))}
    </div>
  );
}

export default DashboardAttentionRepairs;
