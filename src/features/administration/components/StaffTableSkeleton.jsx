import Skeleton from "../../../components/Skeleton.jsx";

export default function StaffTableSkeleton() {
  return (
    <div role="status" aria-label="Loading staff accounts">
      <div aria-hidden="true">
        <div className="administration-result-count">
          <Skeleton width={210} height={16} />
        </div>

        <div className="staff-table-wrapper">
          <table className="staff-table">
            <thead>
              <tr>
                <th>Staff Member</th>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Access</th>
              </tr>
            </thead>

            <tbody>
              {Array.from({ length: 5 }, (_, index) => (
                <tr key={index}>
                  <td>
                    <Skeleton width={150} height={16} />
                  </td>
                  <td>
                    <Skeleton width={110} height={16} />
                  </td>
                  <td>
                    <Skeleton width={190} height={16} />
                  </td>
                  <td>
                    <Skeleton width={100} height={24} rounded />
                  </td>
                  <td>
                    <Skeleton width={70} height={24} rounded />
                  </td>
                  <td>
                    <Skeleton width={95} height={32} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}