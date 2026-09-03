import { Plus, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

import RepairTable from "../components/RepairTable.jsx";
import "../repairs.css";

function RepairListPage() {

    const navigate = useNavigate();

    return (
        <>
            <section className="page-header">
                <h2>Repairs</h2>

                <p>
                    Manage and monitor Cellbank repair jobs.
                </p>
            </section>

            <section className="repair-toolbar">

                <div className="repair-search">

                    <Search size={18} />

                    <input
                        type="text"
                        placeholder="Search repairs..."
                    />

                </div>

                <select defaultValue="">
                    <option value="">
                        All Statuses
                    </option>

                    <option value="RECEIVED">
                        Received
                    </option>

                    <option value="IN_PROGRESS">
                        In Progress
                    </option>

                    <option value="AWAITING_PARTS">
                        Awaiting Parts
                    </option>

                    <option value="READY_FOR_RELEASE">
                        Ready for Release
                    </option>

                    <option value="COMPLETED">
                        Completed
                    </option>

                    <option value="CANCELLED">
                        Cancelled
                    </option>
                </select>

                <select defaultValue="">
                    <option value="">
                        All Technicians
                    </option>

                    <option value="miguel">
                        Miguel Santos
                    </option>

                    <option value="carlo">
                        Carlo Mendoza
                    </option>
                </select>

                <button
                    className="new-repair-button"
                    type="button"
                    onClick={() => navigate("/repairs/new")}
                >
                    <Plus size={18} />
                    <span>New Repair</span>
                </button>

            </section>

            <section className="page-content">
                <RepairTable />
            </section>
        </>
    );
}

export default RepairListPage;