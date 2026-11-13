import StaffAvatar from "./StaffAvatar.jsx";

export default function DashboardPersonalActivity({ user, workload, activity, activityDate }) {
  return (
    <section className="page-content dashboard-workload-section dashboard-personal-section">
      <div className="dashboard-panel-header"><h3>Your Workload &amp; Activity</h3></div>
      <div className="dashboard-workload-item">
        <div className="dashboard-technician-identity">
          <StaffAvatar name={workload?.name ?? activity?.name ?? user.name} profileImageUrl={workload?.profileImageUrl ?? activity?.profileImageUrl} />
          <strong>{workload?.name ?? activity?.name ?? user.name}</strong>
        </div>
        <h4 className="dashboard-personal-label">Repair workload</h4>
        {workload ? <div className="dashboard-workload-values">
          <div><span>Active</span><strong>{workload.activeRepairs}</strong></div>
          <div><span>Total assigned</span><strong>{workload.totalRepairs}</strong></div>
        </div> : <p className="dashboard-table-description">Workload unavailable.</p>}
        <h4 className="dashboard-personal-label">Front Desk activity</h4>
        <p className="dashboard-table-description">{activityDate ? `${activityDate} (Philippine time)` : "Activity date unavailable."}</p>
        {activity ? <div className="dashboard-workload-values">
          <div><span>Repairs registered</span><strong>{activity.repairsRegistered}</strong></div>
          <div><span>Payments recorded</span><strong>{activity.paymentsRecorded}</strong></div>
          <div><span>Repairs released</span><strong>{activity.repairsReleased}</strong></div>
        </div> : <p className="dashboard-table-description">Activity unavailable.</p>}
      </div>
    </section>
  );
}
