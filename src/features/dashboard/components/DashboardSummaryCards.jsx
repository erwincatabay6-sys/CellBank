import { ClipboardList, Wrench, CircleCheck, CheckCheck } from "lucide-react";

function DashboardSummaryCards({
  totalRepairs,
  activeRepairs,
  readyForRelease,
  completedRepairs,
}) {
  return (
    <section className="dashboard-summary-grid">
      <div className="dashboard-summary-card">
        <ClipboardList size={20} className="dashboard-summary-icon" aria-hidden="true" />
        <span>Total Repairs</span>

        <strong>{totalRepairs}</strong>
      </div>

      <div className="dashboard-summary-card">
        <Wrench size={20} className="dashboard-summary-icon" aria-hidden="true" />
        <span>Active Repairs</span>

        <strong>{activeRepairs}</strong>
      </div>

      <div className="dashboard-summary-card">
        <CircleCheck size={20} className="dashboard-summary-icon" aria-hidden="true" />
        <span>Ready for Release</span>

        <strong>{readyForRelease}</strong>
      </div>

      <div className="dashboard-summary-card">
        <CheckCheck size={20} className="dashboard-summary-icon" aria-hidden="true" />
        <span>Completed</span>

        <strong>{completedRepairs}</strong>
      </div>
    </section>
  );
}

export default DashboardSummaryCards;
