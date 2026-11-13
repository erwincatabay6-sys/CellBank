import StaffList from "./StaffList.jsx";
import StaffAvatar from "./StaffAvatar.jsx";

function DashboardTechnicianWorkload({ technicians }) {
  if (technicians.length === 0) {
    return (
      <div className="workspace-empty-state">
        <strong>No technician workload available</strong>

        <p>Technician assignment information will appear here.</p>
      </div>
    );
  }

  return (
    <StaffList count={technicians.length} label="Technician workload">
      {technicians.map((technician) => (
        <div key={technician.id} className="dashboard-workload-item">
          <div className="dashboard-technician-identity">
            <StaffAvatar name={technician.name} profileImageUrl={technician.profileImageUrl} />
            <strong>{technician.name}</strong>
          </div>

          <div className="dashboard-workload-values">
            <div>
              <span>Active</span>

              <strong>{technician.activeRepairs}</strong>
            </div>

            <div>
              <span>Total Assigned</span>

              <strong>{technician.totalRepairs}</strong>
            </div>
          </div>
        </div>
      ))}
    </StaffList>
  );
}

export default DashboardTechnicianWorkload;
