import StaffAvatar from "./StaffAvatar.jsx";

export default function DashboardFrontDeskActivity({ staff, activityDate }) {
  return (
    <>
      <p className="dashboard-table-description">{activityDate ? `Activity on ${activityDate} (Philippine time).` : "Activity date unavailable."}</p>
      {!staff.length ? <div className="workspace-empty-state">No staff activity available.</div> : (
        <div className={`dashboard-workload-list ${staff.length > 5 ? "dashboard-scroll-list" : ""}`} role="region" aria-label="Front Desk activity" tabIndex={staff.length > 5 ? 0 : undefined}>
          {staff.map((person) => (
            <div className="dashboard-workload-item" key={person.id}>
              <div className="dashboard-technician-identity"><StaffAvatar name={person.name} profileImageUrl={person.profileImageUrl} /><strong>{person.name}</strong></div>
              <div className="dashboard-workload-values">
                <div><span>Repairs registered</span><strong>{person.repairsRegistered}</strong></div>
                <div><span>Payments recorded</span><strong>{person.paymentsRecorded}</strong></div>
                <div><span>Repairs released</span><strong>{person.repairsReleased}</strong></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
