function TechnicianTable({
    technicians,
    onTechnicianClick
}) {

    return (
        <div className="technician-table-wrapper">

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

                    {technicians.map((technician) => (

                        <tr
                            key={technician.id}
                            className="technician-row"
                            onClick={() =>
                                onTechnicianClick(
                                    technician.id
                                )
                            }
                        >

                            <td>
                                {technician.name}
                            </td>

                            <td>
                                <span
                                    className={
                                        `technician-status ${
                                            technician.status === "ACTIVE"
                                                ? "active"
                                                : "inactive"
                                        }`
                                    }
                                >
                                    {technician.status === "ACTIVE"
                                        ? "Active"
                                        : "Inactive"
                                    }
                                </span>
                            </td>

                            <td>
                                {technician.activeRepairs}
                            </td>

                            <td>
                                {technician.totalRepairs}
                            </td>

                        </tr>

                    ))}

                </tbody>

            </table>

        </div>
    );
}


export default TechnicianTable;