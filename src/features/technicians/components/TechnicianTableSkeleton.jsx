import Skeleton from "../../../components/Skeleton.jsx";

export default function TechnicianTableSkeleton() {
  return (
    <div role="status" aria-label="Loading technicians">
      <div className="technician-table-wrapper" aria-hidden="true">
        <table className="technician-table">
          <thead>
            <tr>
              <th>Technician</th>
              <th>Status</th>
              <th>Active Repairs</th>
              <th>Total Assigned</th>
            </tr>
          </thead>

          <tbody>
            {Array.from({ length: 5 }, (_, index) => (
              <tr key={index}>
                <td>
                  <Skeleton width={160} height={16} />
                </td>

                <td>
                  <Skeleton width={70} height={26} rounded />
                </td>

                <td>
                  <Skeleton width={35} height={16} />
                </td>

                <td>
                  <Skeleton width={35} height={16} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
