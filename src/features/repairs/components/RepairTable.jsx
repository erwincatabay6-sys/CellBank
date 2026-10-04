import { useNavigate } from "react-router-dom";

import StatusBadge from "../../../components/StatusBadge.jsx";

function RepairTable({ repairs = [], canOpen = true }) {
  const navigate = useNavigate();

  if (repairs.length === 0) {
    return (
      <div className="workspace-empty-state">
        <strong>No matching repairs</strong>
        <p>Try changing the search term or repair filters.</p>
      </div>
    );
  }

  return (
    <div className="repair-table-wrapper">
      <table className="repair-table">
        <thead>
          <tr>
            <th scope="col">Reference</th>
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
              className={canOpen ? "repair-row" : undefined}
              onClick={
                canOpen ? () => navigate(`/repairs/${repair.id}`) : undefined
              }
            >
              <td>
                {canOpen ? (
                  <button
                    className="repair-reference-button"
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      navigate(`/repairs/${repair.id}`);
                    }}
                    aria-label={`Open repair ${repair.reference}`}
                  >
                    {repair.reference}
                  </button>
                ) : (
                  repair.reference
                )}
              </td>

              <td>{repair.customer}</td>
              <td>{repair.device}</td>
              <td>{repair.technician ?? "Unassigned"}</td>

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

export default RepairTable;
