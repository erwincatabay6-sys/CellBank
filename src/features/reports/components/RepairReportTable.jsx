import StatusBadge
    from "../../../components/StatusBadge.jsx";


function RepairReportTable({
    repairs,
    onRepairClick
}) {

    return (
        <div className="report-table-wrapper">

            <table className="report-table">

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
                            className="report-repair-row"
                            onClick={() =>
                                onRepairClick(
                                    repair.id
                                )
                            }
                        >

                            <td>
                                <strong>
                                    {repair.reference}
                                </strong>
                            </td>

                            <td>
                                {repair.customer}
                            </td>

                            <td>
                                {repair.device}
                            </td>

                            <td>
                                {repair.technician}
                            </td>

                            <td>

                                <StatusBadge
                                    status={
                                        repair.status
                                    }
                                />

                            </td>

                        </tr>

                    ))}

                </tbody>

            </table>

        </div>
    );
}


export default RepairReportTable;