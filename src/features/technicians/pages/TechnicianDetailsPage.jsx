import {
    useNavigate,
    useParams
} from "react-router-dom";


import StatusBadge
    from "../../../components/StatusBadge.jsx";

import { mockTechnicians }
    from "../data/mockTechnicians.js";

import { mockRepairs }
    from "../../repairs/data/mockRepairs.js";


const terminalStatuses = [
    "COMPLETED",
    "CANCELLED"
];


function TechnicianDetailsPage() {

    const { technicianId } =
        useParams();

    const navigate =
        useNavigate();


    // -----------------------------
    // TECHNICIAN
    // -----------------------------

    const technician =
        mockTechnicians.find(
            (technician) =>
                technician.id ===
                Number(technicianId)
        );


    // -----------------------------
    // ASSIGNED REPAIRS
    // -----------------------------

    const assignedRepairs =
        technician
            ? mockRepairs.filter(
                (repair) =>
                    repair.technicianId ===
                    technician.id
            )
            : [];


    // -----------------------------
    // ACTIVE REPAIRS
    // -----------------------------

    const activeRepairs =
        assignedRepairs.filter(
            (repair) =>
                !terminalStatuses.includes(
                    repair.status
                )
        );


    // -----------------------------
    // REPAIR HISTORY
    // -----------------------------

    const repairHistory =
        assignedRepairs.filter(
            (repair) =>
                terminalStatuses.includes(
                    repair.status
                )
        );


    // -----------------------------
    // STATUS COUNTS
    // -----------------------------

    const receivedCount =
    activeRepairs.filter(
        (repair) =>
            repair.status ===
                "RECEIVED"
    ).length;

    const awaitingApprovalCount =
        activeRepairs.filter(
            (repair) =>
                repair.status ===
                "AWAITING_APPROVAL"
        ).length;


    const inProgressCount =
        activeRepairs.filter(
            (repair) =>
                repair.status ===
                "IN_PROGRESS"
        ).length;


    const awaitingPartsCount =
        activeRepairs.filter(
            (repair) =>
                repair.status ===
                "AWAITING_PARTS"
        ).length;


    const readyForReleaseCount =
        activeRepairs.filter(
            (repair) =>
                repair.status ===
                "READY_FOR_RELEASE"
        ).length;


    // -----------------------------
    // TECHNICIAN NOT FOUND
    // -----------------------------

    if (!technician) {

        return (
            <>

                <section className="page-header">

                    <h2>
                        Technician Not Found
                    </h2>

                    <p>
                        The requested technician record
                        does not exist.
                    </p>

                </section>


                <section className="page-content">

                    <button
                        className="secondary-repair-button"
                        type="button"
                        onClick={() =>
                            navigate("/technicians")
                        }
                    >
                        Back to Technicians
                    </button>

                </section>

            </>
        );
    }


    // -----------------------------
    // REPAIR NAVIGATION
    // -----------------------------

    function handleRepairClick(repairId) {

        navigate(
            `/repairs/${repairId}`
        );
    }


    return (
        <>

            {/* =========================
                PAGE HEADER
            ========================== */}
            <section className="page-header">

                <h2>
                    {technician.name}
                </h2>

                <p>
                    View technician workload
                    and assigned repair jobs.
                </p>

            </section>


            {/* =========================
                TECHNICIAN INFORMATION
            ========================== */}
            <section className="page-content">

                <div className="workspace-section-header">

                    <div>

                        <h3>
                            Technician Information
                        </h3>

                        <p className="workspace-section-description">
                            Basic operational information
                            for this technician.
                        </p>

                    </div>

                </div>


                <div className="technician-info-grid">

                    <div>

                        <span>
                            Technician
                        </span>

                        <strong>
                            {technician.name}
                        </strong>

                    </div>


                    <div>

                        <span>
                            Role
                        </span>

                        <strong>
                            {technician.role}
                        </strong>

                    </div>


                    <div>

                        <span>
                            Status
                        </span>

                        <strong>
                            {technician.status === "ACTIVE"
                                ? "Active"
                                : "Inactive"
                            }
                        </strong>

                    </div>


                    <div>

                        <span>
                            Active Repairs
                        </span>

                        <strong>
                            {activeRepairs.length}
                        </strong>

                    </div>


                    <div>

                        <span>
                            Total Assigned
                        </span>

                        <strong>
                            {assignedRepairs.length}
                        </strong>

                    </div>

                </div>

            </section>


            {/* =========================
                WORKLOAD SUMMARY
            ========================== */}
            <section className="page-content">

                <div className="workspace-section-header">

                    <div>

                        <h3>
                            Workload Summary
                        </h3>

                        <p className="workspace-section-description">
                            Current assigned repairs
                            grouped by repair status.
                        </p>

                    </div>

                </div>


                <div className="technician-workload-grid">

                    <div>

                        <span>
                            Received
                        </span>

                        <strong>
                            {receivedCount}
                        </strong>

                    </div>

                    <div>

                        <span>
                            Awaiting Approval
                        </span>

                        <strong>
                            {awaitingApprovalCount}
                        </strong>

                    </div>


                    <div>

                        <span>
                            In Progress
                        </span>

                        <strong>
                            {inProgressCount}
                        </strong>

                    </div>


                    <div>

                        <span>
                            Awaiting Parts
                        </span>

                        <strong>
                            {awaitingPartsCount}
                        </strong>

                    </div>


                    <div>

                        <span>
                            Ready for Release
                        </span>

                        <strong>
                            {readyForReleaseCount}
                        </strong>

                    </div>

                </div>

            </section>


            {/* =========================
                ACTIVE ASSIGNED REPAIRS
            ========================== */}
            <section className="page-content">

                <div className="workspace-section-header">

                    <div>

                        <h3>
                            Active Assigned Repairs
                        </h3>

                        <p className="workspace-section-description">
                            Repair jobs currently assigned
                            to this technician.
                        </p>

                    </div>

                </div>


                {activeRepairs.length > 0 ? (

                    <div className="technician-repair-list">

                        {activeRepairs.map((repair) => (

                            <button
                                key={repair.id}
                                className="technician-repair-item"
                                type="button"
                                onClick={() =>
                                    handleRepairClick(
                                        repair.id
                                    )
                                }
                            >

                                <div>

                                    <span>
                                        Repair Reference
                                    </span>

                                    <strong>
                                        {repair.reference}
                                    </strong>

                                </div>


                                <div>

                                    <span>
                                        Customer
                                    </span>

                                    <strong>
                                        {repair.customer}
                                    </strong>

                                </div>


                                <div>

                                    <span>
                                        Device
                                    </span>

                                    <strong>
                                        {repair.device}
                                    </strong>

                                </div>


                                <div>

                                    <span>
                                        Status
                                    </span>

                                    <StatusBadge
                                        status={
                                            repair.status
                                        }
                                    />

                                </div>

                            </button>

                        ))}

                    </div>

                ) : (

                    <div className="workspace-empty-state">

                        <strong>
                            No active repairs
                        </strong>

                        <p>
                            This technician currently has
                            no active repair assignments.
                        </p>

                    </div>

                )}

            </section>


            {/* =========================
                REPAIR HISTORY
            ========================== */}
            <section className="page-content">

                <div className="workspace-section-header">

                    <div>

                        <h3>
                            Repair History
                        </h3>

                        <p className="workspace-section-description">
                            Completed or cancelled repairs
                            previously assigned to this technician.
                        </p>

                    </div>

                </div>


                {repairHistory.length > 0 ? (

                    <div className="technician-repair-list">

                        {repairHistory.map((repair) => (

                            <button
                                key={repair.id}
                                className="technician-repair-item"
                                type="button"
                                onClick={() =>
                                    handleRepairClick(
                                        repair.id
                                    )
                                }
                            >

                                <div>

                                    <span>
                                        Repair Reference
                                    </span>

                                    <strong>
                                        {repair.reference}
                                    </strong>

                                </div>


                                <div>

                                    <span>
                                        Customer
                                    </span>

                                    <strong>
                                        {repair.customer}
                                    </strong>

                                </div>


                                <div>

                                    <span>
                                        Device
                                    </span>

                                    <strong>
                                        {repair.device}
                                    </strong>

                                </div>


                                <div>

                                    <span>
                                        Status
                                    </span>

                                    <StatusBadge
                                        status={
                                            repair.status
                                        }
                                    />

                                </div>

                            </button>

                        ))}

                    </div>

                ) : (

                    <div className="workspace-empty-state">

                        <strong>
                            No repair history
                        </strong>

                        <p>
                            Completed or cancelled repairs
                            will appear here.
                        </p>

                    </div>

                )}

            </section>

        </>
    );
}


export default TechnicianDetailsPage;