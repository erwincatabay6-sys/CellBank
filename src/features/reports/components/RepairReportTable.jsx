import StatusBadge from "../../../components/StatusBadge.jsx";

function RepairReportTable({ repairs, onRepairClick }) {
  return (
    <div className="report-table-wrapper" role="region" aria-label="Detailed repair records" tabIndex={0}>
      <table className="report-table">
        <thead>
          <tr>
            <th scope="col">Reference</th>
            <th scope="col">Date Received</th>
            <th scope="col">Customer</th>
            <th scope="col">Device</th>
            <th scope="col">Technician</th>
            <th scope="col">Status</th>
          </tr>
        </thead>

        <tbody>
          {repairs.map((repair) => (
            <tr
              key={repair.id}
              className="report-repair-row"
              onClick={() => onRepairClick(repair.id)}
            >
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
                {new Date(`${repair.createdAt}T00:00:00`).toLocaleDateString(
                  "en-US",
                  {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  },
                )}
              </td>

              <td>{repair.customer}</td>

              <td>{repair.device}</td>

              <td>{repair.technician}</td>

              <td>
                <StatusBadge status={repair.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default RepairReportTable;
