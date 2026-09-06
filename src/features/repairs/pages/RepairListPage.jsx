import {
    Plus,
    Search
} from "lucide-react";

import { useNavigate }
    from "react-router-dom";

import { hasAccess }
    from "../../../config/accessControl.js";

import RepairTable
    from "../components/RepairTable.jsx";

import "../repairs.css";


function RepairListPage({
    currentRoles
}) {

    const navigate =
        useNavigate();


    // -----------------------------
    // ROLE PERMISSIONS
    // -----------------------------

    const canCreateRepair =
        hasAccess(
            currentRoles,
            "createRepair"
        );


    // -----------------------------
    // NAVIGATION
    // -----------------------------

    function handleNewRepair() {

        if (!canCreateRepair) {
            return;
        }


        navigate(
            "/repairs/new"
        );
    }


    return (
        <>

            {/* =========================
                PAGE HEADER
            ========================== */}
            <section className="page-header">

                <h2>
                    Repairs
                </h2>

                <p>
                    Manage and monitor
                    Cellbank repair jobs.
                </p>

            </section>


            {/* =========================
                REPAIR TOOLBAR
            ========================== */}
            <section className="repair-toolbar">

                {/* SEARCH */}
                <div className="repair-search">

                    <Search size={18} />

                    <input
                        type="text"
                        placeholder="Search repairs..."
                    />

                </div>


                {/* STATUS FILTER */}
                <select
                    defaultValue=""
                    aria-label="Filter by repair status"
                >

                    <option value="">
                        All Statuses
                    </option>

                    <option value="RECEIVED">
                        Received
                    </option>

                    <option value="AWAITING_APPROVAL">
                        Awaiting Approval
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


                {/* TECHNICIAN FILTER */}
                <select
                    defaultValue=""
                    aria-label="Filter by technician"
                >

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


                {/* NEW REPAIR */}
                {canCreateRepair && (

                    <button
                        className="new-repair-button"
                        type="button"
                        onClick={
                            handleNewRepair
                        }
                    >

                        <Plus size={18} />

                        <span>
                            New Repair
                        </span>

                    </button>

                )}

            </section>


            {/* =========================
                REPAIR TABLE
            ========================== */}
            <section className="page-content">

                <RepairTable />

            </section>

        </>
    );
}


export default RepairListPage;