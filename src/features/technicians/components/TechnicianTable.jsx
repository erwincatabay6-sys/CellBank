function TechnicianTable({ technicians, onTechnicianClick, canOpen = () => true }) {
  return (
    <div className="technician-table-wrapper" role="region" aria-label="Technician records" tabIndex={0}>
      <table className="technician-table">
        <thead>
          <tr>
            <th scope="col">Technician</th>
            <th scope="col">Status</th>
            <th scope="col">Active Repairs</th>
            <th scope="col">Total Assigned</th>
          </tr>
        </thead>

        <tbody>
          {technicians.map((technician) => (
            <tr
              key={technician.id}
              className={canOpen(technician.id) ? "technician-row" : undefined}
              onClick={canOpen(technician.id) ? () => onTechnicianClick(technician.id) : undefined}
            >
              <td>
                {canOpen(technician.id) ? <button
                  type="button"
                  className="record-link"
                  aria-label={`Open technician ${technician.name}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    onTechnicianClick(technician.id);
                  }}
                >
                  {technician.name}
                </button> : <span>{technician.name}</span>}
              </td>

              <td>
                <span
                  className={`technician-status ${
                    technician.status === "ACTIVE" ? "active" : "inactive"
                  }`}
                >
                  {technician.status === "ACTIVE" ? "Active" : "Inactive"}
                </span>
              </td>

              <td>{technician.activeRepairs}</td>

              <td>{technician.totalRepairs}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default TechnicianTable;
