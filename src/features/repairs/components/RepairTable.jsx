import { useNavigate }
    from "react-router-dom";

import StatusBadge
    from "../../../components/StatusBadge.jsx";


function RepairTable({
    repairs = []
}) {

    const navigate =
        useNavigate();


    if (repairs.length === 0) {

        return (
            <div className="workspace-empty-state">

                <strong>
                    No repair records found
                </strong>

                <p>
                    Try changing the search term
                    or repair filters.
                </p>

            </div>
        );
    }


    return (
        <div className="repair-table-wrapper">

            <table className="repair-table">

                <thead>
                    <tr>
                        <th>Reference</th>
                        <th>Customer</th>
                        <th>Device</th>
                        <th>Technician</th>
                        <th>Status</th>
                    </tr>
                </thead>


                <tbody>

                    {repairs.map((repair) => (

                        <tr
                            key={repair.id}
                            className="repair-row"
                            onClick={() =>
                                navigate(
                                    `/repairs/${repair.id}`
                                )
                            }
                        >

                            <td>
                                {repair.reference}
                            </td>

                            <td>
                                {repair.customer}
                            </td>

                            <td>
                                {repair.device}
                            </td>

                            <td>
                                {repair.technician ?? "Unassigned"}
                            </td>

                            <td>
                                <StatusBadge
                                    status={repair.status}
                                />
                            </td>

                        </tr>

                    ))}

                </tbody>

            </table>

        </div>
    );
}


export default RepairTable;
