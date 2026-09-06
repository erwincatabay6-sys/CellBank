import { useNavigate }
    from "react-router-dom";

import {
    hasAccess,
    hasRole
} from "../../../config/accessControl.js";

import DashboardSummaryCards
    from "../components/DashboardSummaryCards.jsx";

import DashboardStatusCounts
    from "../components/DashboardStatusCounts.jsx";

import DashboardAttentionRepairs
    from "../components/DashboardAttentionRepairs.jsx";

import DashboardTechnicianWorkload
    from "../components/DashboardTechnicianWorkload.jsx";

import DashboardRecentRepairs
    from "../components/DashboardRecentRepairs.jsx";

import DashboardFinancialSnapshot
    from "../components/DashboardFinancialSnapshot.jsx";

import { mockRepairs }
    from "../../repairs/data/mockRepairs.js";

import { mockPayments }
    from "../../repairs/data/mockPayments.js";

import { mockTechnicians }
    from "../../technicians/data/mockTechnicians.js";

import "../dashboard.css";


const terminalStatuses = [
    "COMPLETED",
    "CANCELLED"
];


const attentionStatuses = [
    "RECEIVED",
    "AWAITING_APPROVAL",
    "AWAITING_PARTS",
    "READY_FOR_RELEASE"
];


function DashboardPage({
    currentRoles,
    currentUserName
}) {

    const navigate =
        useNavigate();


    // -----------------------------
    // ROLE PERMISSIONS
    // -----------------------------

    const canViewDashboard =
        hasAccess(
            currentRoles,
            "dashboard"
        );


    const canViewRepairs =
        hasAccess(
            currentRoles,
            "repairs"
        );


    const isAdmin =
        hasRole(
            currentRoles,
            "ADMIN"
        );


    const isTechnician =
        hasRole(
            currentRoles,
            "TECHNICIAN"
        );


    const isFrontDesk =
        hasRole(
            currentRoles,
            "FRONT_DESK"
        );


    // Technician-only dashboard behavior.
    // Technician + Front Desk uses the
    // shop-wide Front Desk operational view.
    const isTechnicianOnly =
        isTechnician &&
        !isFrontDesk &&
        !isAdmin;


    // -----------------------------
    // ROLE-AWARE REPAIR DATA
    // -----------------------------

    let dashboardRepairs = [];


    if (
        isAdmin ||
        isFrontDesk
    ) {

        dashboardRepairs =
            mockRepairs;

    }
    else if (isTechnicianOnly) {

        dashboardRepairs =
            mockRepairs.filter(
                (repair) =>
                    repair.technician ===
                        currentUserName
            );

    }


    // -----------------------------
    // REPAIR SUMMARY
    // -----------------------------

    const totalRepairs =
        dashboardRepairs.length;


    const activeRepairs =
        dashboardRepairs.filter(
            (repair) =>
                !terminalStatuses.includes(
                    repair.status
                )
        ).length;


    const readyForRelease =
        dashboardRepairs.filter(
            (repair) =>
                repair.status ===
                    "READY_FOR_RELEASE"
        ).length;


    const completedRepairs =
        dashboardRepairs.filter(
            (repair) =>
                repair.status ===
                    "COMPLETED"
        ).length;


    // -----------------------------
    // STATUS COUNTS
    // -----------------------------

    const statusCounts =
        dashboardRepairs.reduce(
            (counts, repair) => {

                counts[repair.status] =
                    (
                        counts[repair.status] ??
                        0
                    ) + 1;


                return counts;
            },
            {}
        );


    // -----------------------------
    // REPAIRS NEEDING ATTENTION
    // -----------------------------

    const attentionRepairs =
        dashboardRepairs.filter(
            (repair) =>
                attentionStatuses.includes(
                    repair.status
                )
        );


    // -----------------------------
    // TECHNICIAN WORKLOAD
    // -----------------------------

    const technicianWorkload =
        mockTechnicians.map(
            (technician) => {

                const assignedRepairs =
                    mockRepairs.filter(
                        (repair) =>
                            repair.technicianId ===
                                technician.id
                    );


                const activeAssignedRepairs =
                    assignedRepairs.filter(
                        (repair) =>
                            !terminalStatuses.includes(
                                repair.status
                            )
                    );


                return {
                    ...technician,

                    activeRepairs:
                        activeAssignedRepairs.length,

                    totalRepairs:
                        assignedRepairs.length
                };
            }
        );


    let visibleTechnicianWorkload = [];


    if (
        isAdmin ||
        isFrontDesk
    ) {

        visibleTechnicianWorkload =
            technicianWorkload;

    }
    else if (isTechnicianOnly) {

        visibleTechnicianWorkload =
            technicianWorkload.filter(
                (technician) =>
                    technician.name ===
                        currentUserName
            );

    }


    // -----------------------------
    // RECENT / ACTIVE REPAIRS
    // -----------------------------

    const recentActiveRepairs =
        dashboardRepairs
            .filter(
                (repair) =>
                    !terminalStatuses.includes(
                        repair.status
                    )
            )
            .slice(0, 5);


    // -----------------------------
    // FINANCIAL SNAPSHOT
    // ADMIN ONLY
    // -----------------------------

    const totalAgreedValue =
        isAdmin
            ? mockRepairs.reduce(
                (total, repair) =>
                    total +
                    (
                        repair.agreedPrice ??
                        0
                    ),
                0
            )
            : 0;


    const totalCollected =
        isAdmin
            ? mockPayments.reduce(
                (total, payment) =>
                    total +
                    payment.amount,
                0
            )
            : 0;


    const outstandingBalance =
        isAdmin
            ? mockRepairs.reduce(
                (total, repair) => {

                    if (
                        repair.agreedPrice ==
                        null
                    ) {
                        return total;
                    }


                    const repairPaid =
                        mockPayments
                            .filter(
                                (payment) =>
                                    payment.repairId ===
                                        repair.id
                            )
                            .reduce(
                                (
                                    paymentTotal,
                                    payment
                                ) =>
                                    paymentTotal +
                                        payment.amount,
                                0
                            );


                    const repairBalance =
                        Math.max(
                            repair.agreedPrice -
                                repairPaid,
                            0
                        );


                    return (
                        total +
                        repairBalance
                    );
                },
                0
            )
            : 0;


    // -----------------------------
    // NAVIGATION
    // -----------------------------

    function handleRepairClick(repairId) {

        if (!canViewRepairs) {
            return;
        }


        navigate(
            `/repairs/${repairId}`
        );
    }


    // -----------------------------
    // ACCESS DENIED
    // -----------------------------

    if (!canViewDashboard) {

        return (
            <>

                <section className="page-header">

                    <h2>
                        Access Denied
                    </h2>

                    <p>
                        You do not have permission
                        to access the Dashboard.
                    </p>

                </section>

            </>
        );
    }


    return (
        <>

            {/* =========================
                PAGE HEADER
            ========================== */}
            <section className="page-header">

                <h2>
                    Dashboard
                </h2>

                <p>
                    Current operational overview
                    of Cellbank repair activity.
                </p>

            </section>


            {/* =========================
                REPAIR SUMMARY
            ========================== */}
            <section className="page-content">

                <div className="workspace-section-header">

                    <div>

                        <h3>
                            Repair Summary
                        </h3>

                        <p className="workspace-section-description">

                            {isTechnicianOnly
                                ? "Summary of repairs currently assigned to you."
                                : "Current repair activity across the system."
                            }

                        </p>

                    </div>

                </div>


                <DashboardSummaryCards
                    totalRepairs={
                        totalRepairs
                    }
                    activeRepairs={
                        activeRepairs
                    }
                    readyForRelease={
                        readyForRelease
                    }
                    completedRepairs={
                        completedRepairs
                    }
                />

            </section>


            {/* =========================
                STATUS COUNTS
            ========================== */}
            <section className="page-content">

                <div className="workspace-section-header">

                    <div>

                        <h3>
                            Repair Status
                        </h3>

                        <p className="workspace-section-description">

                            {isTechnicianOnly
                                ? "Current status of repairs assigned to you."
                                : "Current repair jobs grouped by status."
                            }

                        </p>

                    </div>

                </div>


                <DashboardStatusCounts
                    statusCounts={
                        statusCounts
                    }
                />

            </section>


            {/* =========================
                REPAIRS NEEDING ATTENTION
            ========================== */}
            <section className="page-content">

                <div className="workspace-section-header">

                    <div>

                        <h3>
                            Repairs Needing Attention
                        </h3>

                        <p className="workspace-section-description">

                            {isTechnicianOnly
                                ? "Assigned repairs that currently require your attention."
                                : "Repair jobs that currently require staff follow-up."
                            }

                        </p>

                    </div>

                </div>


                <DashboardAttentionRepairs
                    repairs={
                        attentionRepairs
                    }
                    onRepairClick={
                        handleRepairClick
                    }
                />

            </section>


            {/* =========================
                TECHNICIAN WORKLOAD
            ========================== */}
            <section className="page-content">

                <div className="workspace-section-header">

                    <div>

                        <h3>
                            {isTechnicianOnly
                                ? "Your Workload"
                                : "Technician Workload"
                            }
                        </h3>

                        <p className="workspace-section-description">

                            {isTechnicianOnly
                                ? "Current and total repair assignments assigned to you."
                                : "Current repair workload across Cellbank technicians."
                            }

                        </p>

                    </div>

                </div>


                <DashboardTechnicianWorkload
                    technicians={
                        visibleTechnicianWorkload
                    }
                />

            </section>


            {/* =========================
                RECENT / ACTIVE REPAIRS
            ========================== */}
            <section className="page-content">

                <div className="workspace-section-header">

                    <div>

                        <h3>
                            {isTechnicianOnly
                                ? "Your Active Repairs"
                                : "Recent Active Repairs"
                            }
                        </h3>

                        <p className="workspace-section-description">

                            {isTechnicianOnly
                                ? "Current repair jobs assigned to you."
                                : "Recently active repair jobs across Cellbank."
                            }

                        </p>

                    </div>

                </div>


                <DashboardRecentRepairs
                    repairs={
                        recentActiveRepairs
                    }
                    onRepairClick={
                        handleRepairClick
                    }
                />

            </section>


            {/* =========================
                FINANCIAL SNAPSHOT
                ADMIN ONLY
            ========================== */}
            {isAdmin && (

                <section className="page-content">

                    <div className="workspace-section-header">

                        <div>

                            <h3>
                                Financial Snapshot
                            </h3>

                            <p className="workspace-section-description">
                                Current repair value,
                                collected payments,
                                and outstanding balances.
                            </p>

                        </div>

                    </div>


                    <DashboardFinancialSnapshot
                        totalAgreedValue={
                            totalAgreedValue
                        }
                        totalCollected={
                            totalCollected
                        }
                        outstandingBalance={
                            outstandingBalance
                        }
                    />

                </section>

            )}

        </>
    );
}


export default DashboardPage;