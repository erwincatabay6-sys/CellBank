function StaffTable({ users, saving = false, onUserClick, onToggleStatus }) {
  return (
    <div className="staff-table-wrapper" role="region" aria-label="Staff accounts" tabIndex={0}>
      <table className="staff-table">
        <thead>
          <tr>
            <th scope="col">Staff Member</th>
            <th scope="col">Username</th>
            <th scope="col">Email</th>
            <th scope="col">Role</th>
            <th scope="col">Status</th>
            <th scope="col">Access</th>
          </tr>
        </thead>

        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="staff-row">
              <td onClick={() => onUserClick(user.id)}>
                <button
                  type="button"
                  className="record-link"
                  aria-label={`Edit staff member ${user.name}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    onUserClick(user.id);
                  }}
                >
                  {user.name}
                </button>
              </td>

              <td onClick={() => onUserClick(user.id)}>{user.username}</td>

              <td onClick={() => onUserClick(user.id)}>{user.email}</td>

              <td onClick={() => onUserClick(user.id)}>
                <div className="staff-role-list">
                  {user.roles.map((role) => (
                    <span key={role} className="staff-role-badge">
                      {role}
                    </span>
                  ))}
                </div>
              </td>

              <td onClick={() => onUserClick(user.id)}>
                <span
                  className={`staff-status-badge ${
                    user.status === "ACTIVE" ? "active" : "inactive"
                  }`}
                >
                  {user.status === "ACTIVE" ? "Active" : "Inactive"}
                </span>
              </td>

              <td>
                <button
                  className={
                    user.status === "ACTIVE"
                      ? "staff-deactivate-button"
                      : "staff-activate-button"
                  }
                  type="button"
                  disabled={saving || user.roles.includes("ADMIN")}
                  title={
                    user.roles.includes("ADMIN")
                      ? "The Administrator account must remain active."
                      : undefined
                  }
                  onClick={() => onToggleStatus(user.id)}
                >
                  {user.status === "ACTIVE" ? "Deactivate" : "Activate"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default StaffTable;
