function StaffTable({
    users,
    onUserClick,
    onToggleStatus
}) {

    return (
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

                    {users.map((user) => (

                        <tr
                            key={user.id}
                            className="staff-row"
                        >

                            <td
                                onClick={() =>
                                    onUserClick(user.id)
                                }
                            >
                                <strong>
                                    {user.name}
                                </strong>
                            </td>


                            <td
                                onClick={() =>
                                    onUserClick(user.id)
                                }
                            >
                                {user.username}
                            </td>


                            <td
                                onClick={() =>
                                    onUserClick(user.id)
                                }
                            >
                                {user.email}
                            </td>


                            <td
                                onClick={() =>
                                    onUserClick(user.id)
                                }
                            >

                                <div className="staff-role-list">

                                    {user.roles.map((role) => (

                                        <span
                                            key={role}
                                            className="staff-role-badge"
                                        >
                                            {role}
                                        </span>

                                    ))}

                                </div>

                            </td>


                            <td
                                onClick={() =>
                                    onUserClick(user.id)
                                }
                            >

                                <span
                                    className={
                                        `staff-status-badge ${
                                            user.status === "ACTIVE"
                                                ? "active"
                                                : "inactive"
                                        }`
                                    }
                                >
                                    {user.status === "ACTIVE"
                                        ? "Active"
                                        : "Inactive"
                                    }
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
                                    onClick={() =>
                                        onToggleStatus(
                                            user.id
                                        )
                                    }
                                >
                                    {user.status === "ACTIVE"
                                        ? "Deactivate"
                                        : "Activate"
                                    }
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