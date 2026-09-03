import { useNavigate } from "react-router-dom";

import StatusBadge from "../../../components/StatusBadge.jsx";
import { mockRepairs } from "../data/mockRepairs.js";


function RepairTable() {

    const navigate = useNavigate();


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

                    {mockRepairs.map((repair) => (

                        <tr
                            key={repair.id}
                            className="repair-row"
                            onClick={() =>
                                navigate(`/repairs/${repair.id}`)
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
                                {repair.technician}
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