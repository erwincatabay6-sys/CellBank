import {
    useState
} from "react";

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

import { mockRepairs }
    from "../data/mockRepairs.js";

import { mockTechnicians }
    from "../../technicians/data/mockTechnicians.js";

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
    // FILTER STATE
    // -----------------------------

    const [searchTerm, setSearchTerm] =
        useState("");

    const [statusFilter, setStatusFilter] =
        useState("");

    const [technicianFilter, setTechnicianFilter] =
        useState("");


    // -----------------------------
    // FILTERED REPAIRS
    // -----------------------------

    const normalizedSearch =
        searchTerm
            .trim()
            .toLowerCase();


    const filteredRepairs =
        mockRepairs.filter((repair) => {

            const searchableStatus =
                repair.status
                    .replaceAll("_", " ")
                    .toLowerCase();


            const matchesSearch =
                !normalizedSearch ||
                repair.reference
                    .toLowerCase()
                    .includes(normalizedSearch) ||
                repair.customer
                    .toLowerCase()
                    .includes(normalizedSearch) ||
                repair.device
                    .toLowerCase()
                    .includes(normalizedSearch) ||
                (repair.technician ?? "Unassigned")
                    .toLowerCase()
                    .includes(normalizedSearch) ||
                searchableStatus
                    .includes(normalizedSearch);


            const matchesStatus =
                !statusFilter ||
                repair.status === statusFilter;


            const matchesTechnician =
                !technicianFilter ||
                (
                    technicianFilter === "UNASSIGNED"
                        ? repair.technicianId == null
                        : repair.technicianId ===
                            Number(technicianFilter)
                );


            return (
                matchesSearch &&
                matchesStatus &&
                matchesTechnician
            );
        });


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
                        type="search"
                        value={searchTerm}
                        onChange={(event) =>
                            setSearchTerm(
                                event.target.value
                            )
                        }
                        placeholder="Search repairs..."
                        aria-label="Search repair records"
                    />

                </div>


                {/* STATUS FILTER */}
                <select
                    value={statusFilter}
                    onChange={(event) =>
                        setStatusFilter(
                            event.target.value
                        )
                    }
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
                    value={technicianFilter}
                    onChange={(event) =>
                        setTechnicianFilter(
                            event.target.value
                        )
                    }
                    aria-label="Filter by technician"
                >

                    <option value="">
                        All Technicians
                    </option>

                    {mockTechnicians
                        .filter(
                            (technician) =>
                                technician.status ===
                                    "ACTIVE"
                        )
                        .map((technician) => (

                            <option
                                key={technician.id}
                                value={technician.id}
                            >
                                {technician.name}
                            </option>

                        ))}

                    <option value="UNASSIGNED">
                        Unassigned
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
                RESULT COUNT
            ========================== */}
            <div className="repair-result-count">
                Showing {filteredRepairs.length} of {mockRepairs.length} repairs
            </div>


            {/* =========================
                REPAIR TABLE
            ========================== */}
            <section className="page-content">

                <RepairTable
                    repairs={
                        filteredRepairs
                    }
                />

            </section>

        </>
    );
}


export default RepairListPage;
