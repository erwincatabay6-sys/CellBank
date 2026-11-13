import StaffList from "./StaffList.jsx";
import StaffAvatar from "./StaffAvatar.jsx";

export default function DashboardFrontDeskActivity({ staff, activityDate }) {
  return (
    <>
      <p className="dashboard-table-description">{activityDate ? `Activity on ${activityDate} (Philippine time).` : "Activity date unavailable."}</p>
      {!staff.length ? <div className="workspace-empty-state">No staff activity available.</div> : (
        <StaffList count={staff.length} label="Front Desk activity">
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
        </StaffList>
      )}
    </>
  );
}
