import { useState } from "react";

import { useNavigate }
    from "react-router-dom";

import { Search }
    from "lucide-react";


import RepairReportTable
    from "../components/RepairReportTable.jsx";

import FinancialReportTable
    from "../components/FinancialReportTable.jsx";


import { mockRepairs }
    from "../../repairs/data/mockRepairs.js";

import { mockPayments }
    from "../../repairs/data/mockPayments.js";

import { mockTechnicians }
    from "../../technicians/data/mockTechnicians.js";


import "../reports.css";


const terminalStatuses = [
    "COMPLETED",
    "CANCELLED"
];


const initialStatusCounts = {
    RECEIVED: 0,
    AWAITING_APPROVAL: 0,
    IN_PROGRESS: 0,
    AWAITING_PARTS: 0,
    READY_FOR_RELEASE: 0,
    COMPLETED: 0,
    CANCELLED: 0
};


function ReportsPage() {

    const navigate =
        useNavigate();


    // -----------------------------
    // REPAIR RECORD FILTER STATE
    // -----------------------------

    const [searchTerm, setSearchTerm] =
        useState("");

    const [statusFilter, setStatusFilter] =
        useState("ALL");

    const [
        technicianFilter,
        setTechnicianFilter
    ] = useState("ALL");


    // -----------------------------
    // FINANCIAL FILTER STATE
    // -----------------------------

    const [
        paymentStatusFilter,
        setPaymentStatusFilter
    ] = useState("ALL");


    // -----------------------------
    // REPAIR SUMMARY
    // -----------------------------

    const totalRepairs =
        mockRepairs.length;


    const activeRepairs =
        mockRepairs.filter(
            (repair) =>
                !terminalStatuses.includes(
                    repair.status
                )
        ).length;


    const completedRepairs =
        mockRepairs.filter(
            (repair) =>
                repair.status === "COMPLETED"
        ).length;


    const cancelledRepairs =
        mockRepairs.filter(
            (repair) =>
                repair.status === "CANCELLED"
        ).length;


    // -----------------------------
    // FINANCIAL RECORDS
    // -----------------------------

    const financialRecords =
        mockRepairs.map((repair) => {

            const repairPayments =
                mockPayments.filter(
                    (payment) =>
                        payment.repairId ===
                        repair.id
                );


            const totalPaid =
                repairPayments.reduce(
                    (total, payment) =>
                        total + payment.amount,
                    0
                );


            let balance = null;

            let paymentStatus =
                "Price Not Agreed";


            if (repair.agreedPrice != null) {

                balance =
                    Math.max(
                        repair.agreedPrice -
                            totalPaid,
                        0
                    );


                if (
                    totalPaid >=
                        repair.agreedPrice &&
                    repair.agreedPrice > 0
                ) {

                    paymentStatus =
                        "Paid";

                }
                else if (totalPaid > 0) {

                    paymentStatus =
                        "Partially Paid";

                }
                else {

                    paymentStatus =
                        "Unpaid";

                }
            }


            return {
                id:
                    repair.id,

                reference:
                    repair.reference,

                customer:
                    repair.customer,

                agreedPrice:
                    repair.agreedPrice,

                totalPaid,

                balance,

                paymentStatus
            };
        });


    // -----------------------------
    // FINANCIAL SUMMARY
    // -----------------------------

    const totalAgreedValue =
        financialRecords.reduce(
            (total, record) =>
                total +
                (record.agreedPrice ?? 0),
            0
        );


    const totalPaymentsCollected =
        financialRecords.reduce(
            (total, record) =>
                total + record.totalPaid,
            0
        );


    const totalOutstandingBalance =
        financialRecords.reduce(
            (total, record) =>
                total +
                (record.balance ?? 0),
            0
        );


    const paidRepairs =
        financialRecords.filter(
            (record) =>
                record.paymentStatus === "Paid"
        ).length;


    const partiallyPaidRepairs =
        financialRecords.filter(
            (record) =>
                record.paymentStatus ===
                    "Partially Paid"
        ).length;


    const unpaidRepairs =
        financialRecords.filter(
            (record) =>
                record.paymentStatus === "Unpaid"
        ).length;


    const priceNotAgreedRepairs =
        financialRecords.filter(
            (record) =>
                record.paymentStatus ===
                    "Price Not Agreed"
        ).length;


    // -----------------------------
    // FILTERED FINANCIAL RECORDS
    // -----------------------------

    const filteredFinancialRecords =
        financialRecords.filter(
            (record) =>
                paymentStatusFilter === "ALL" ||
                record.paymentStatus ===
                    paymentStatusFilter
        );


    // -----------------------------
    // REPAIR STATUS BREAKDOWN
    // -----------------------------

    const statusCounts =
        mockRepairs.reduce(
            (counts, repair) => {

                if (
                    counts[repair.status] !==
                    undefined
                ) {

                    counts[repair.status] += 1;
                }


                return counts;

            },
            {
                ...initialStatusCounts
            }
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


                const currentRepairs =
                    assignedRepairs.filter(
                        (repair) =>
                            !terminalStatuses.includes(
                                repair.status
                            )
                    );


                return {
                    ...technician,

                    activeRepairs:
                        currentRepairs.length,

                    totalRepairs:
                        assignedRepairs.length
                };
            }
        );


    // -----------------------------
    // FILTERED REPAIR RECORDS
    // -----------------------------

    const filteredRepairs =
        mockRepairs.filter((repair) => {

            const search =
                searchTerm
                    .trim()
                    .toLowerCase();


            const matchesSearch =
                repair.reference
                    .toLowerCase()
                    .includes(search) ||

                repair.customer
                    .toLowerCase()
                    .includes(search) ||

                repair.device
                    .toLowerCase()
                    .includes(search);


            const matchesStatus =
                statusFilter === "ALL" ||
                repair.status ===
                    statusFilter;


            const matchesTechnician =
                technicianFilter === "ALL" ||
                repair.technicianId ===
                    Number(technicianFilter);


            return (
                matchesSearch &&
                matchesStatus &&
                matchesTechnician
            );
        });


    // -----------------------------
    // NAVIGATION
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
                    Reports
                </h2>

                <p>
                    Review repair activity,
                    financial records,
                    workload, and operational summaries.
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
                            Current repair activity
                            across the system.
                        </p>

                    </div>

                </div>


                <div className="report-summary-grid">

                    <div>

                        <span>
                            Total Repairs
                        </span>

                        <strong>
                            {totalRepairs}
                        </strong>

                    </div>


                    <div>

                        <span>
                            Active Repairs
                        </span>

                        <strong>
                            {activeRepairs}
                        </strong>

                    </div>


                    <div>

                        <span>
                            Completed
                        </span>

                        <strong>
                            {completedRepairs}
                        </strong>

                    </div>


                    <div>

                        <span>
                            Cancelled
                        </span>

                        <strong>
                            {cancelledRepairs}
                        </strong>

                    </div>

                </div>

            </section>


            {/* =========================
                FINANCIAL SUMMARY
            ========================== */}
            <section className="page-content">

                <div className="workspace-section-header">

                    <div>

                        <h3>
                            Financial Summary
                        </h3>

                        <p className="workspace-section-description">
                            Summary of agreed repair prices,
                            collected payments,
                            and outstanding balances.
                        </p>

                    </div>

                </div>


                <div className="financial-summary-grid">

                    <div>

                        <span>
                            Total Agreed Value
                        </span>

                        <strong>
                            ₱{totalAgreedValue.toFixed(2)}
                        </strong>

                    </div>


                    <div>

                        <span>
                            Payments Collected
                        </span>

                        <strong>
                            ₱{totalPaymentsCollected.toFixed(2)}
                        </strong>

                    </div>


                    <div>

                        <span>
                            Outstanding Balance
                        </span>

                        <strong>
                            ₱{totalOutstandingBalance.toFixed(2)}
                        </strong>

                    </div>

                </div>


                <div className="financial-status-grid">

                    <div>

                        <span>
                            Paid Repairs
                        </span>

                        <strong>
                            {paidRepairs}
                        </strong>

                    </div>


                    <div>

                        <span>
                            Partially Paid
                        </span>

                        <strong>
                            {partiallyPaidRepairs}
                        </strong>

                    </div>


                    <div>

                        <span>
                            Unpaid
                        </span>

                        <strong>
                            {unpaidRepairs}
                        </strong>

                    </div>


                    <div>

                        <span>
                            Price Not Agreed
                        </span>

                        <strong>
                            {priceNotAgreedRepairs}
                        </strong>

                    </div>

                </div>

            </section>


            {/* =========================
                FINANCIAL RECORDS
            ========================== */}
            <section className="page-content">

                <div className="workspace-section-header">

                    <div>

                        <h3>
                            Financial Records
                        </h3>

                        <p className="workspace-section-description">
                            Review payment totals and
                            outstanding balances for
                            individual repair jobs.
                        </p>

                    </div>

                </div>


                {/* PAYMENT STATUS FILTER */}
                <div className="financial-record-filters">

                    <select
                        value={paymentStatusFilter}
                        onChange={(event) =>
                            setPaymentStatusFilter(
                                event.target.value
                            )
                        }
                        aria-label={
                            "Filter by payment status"
                        }
                    >

                        <option value="ALL">
                            All Payment Statuses
                        </option>

                        <option value="Paid">
                            Paid
                        </option>

                        <option value="Partially Paid">
                            Partially Paid
                        </option>

                        <option value="Unpaid">
                            Unpaid
                        </option>

                        <option value="Price Not Agreed">
                            Price Not Agreed
                        </option>

                    </select>

                </div>


                {/* RESULT COUNT */}
                <div className="report-result-count">

                    Showing{" "}

                    <strong>
                        {
                            filteredFinancialRecords
                                .length
                        }
                    </strong>

                    {" "}of{" "}

                    <strong>
                        {financialRecords.length}
                    </strong>

                    {" "}financial records

                </div>


                {/* FINANCIAL TABLE */}
                {filteredFinancialRecords.length > 0 ? (

                    <FinancialReportTable
                        records={
                            filteredFinancialRecords
                        }
                        onRepairClick={
                            handleRepairClick
                        }
                    />

                ) : (

                    <div className="workspace-empty-state">

                        <strong>
                            No financial records found
                        </strong>

                        <p>
                            Try changing the payment
                            status filter.
                        </p>

                    </div>

                )}

            </section>


            {/* =========================
                REPAIR STATUS BREAKDOWN
            ========================== */}
            <section className="page-content">

                <div className="workspace-section-header">

                    <div>

                        <h3>
                            Repair Status Breakdown
                        </h3>

                        <p className="workspace-section-description">
                            Repair jobs grouped
                            by their current status.
                        </p>

                    </div>

                </div>


                <div className="report-status-grid">

                    <div>
                        <span>Received</span>
                        <strong>
                            {statusCounts.RECEIVED}
                        </strong>
                    </div>


                    <div>
                        <span>
                            Awaiting Approval
                        </span>
                        <strong>
                            {
                                statusCounts
                                    .AWAITING_APPROVAL
                            }
                        </strong>
                    </div>


                    <div>
                        <span>
                            In Progress
                        </span>
                        <strong>
                            {statusCounts.IN_PROGRESS}
                        </strong>
                    </div>


                    <div>
                        <span>
                            Awaiting Parts
                        </span>
                        <strong>
                            {statusCounts.AWAITING_PARTS}
                        </strong>
                    </div>


                    <div>
                        <span>
                            Ready for Release
                        </span>
                        <strong>
                            {
                                statusCounts
                                    .READY_FOR_RELEASE
                            }
                        </strong>
                    </div>


                    <div>
                        <span>
                            Completed
                        </span>
                        <strong>
                            {statusCounts.COMPLETED}
                        </strong>
                    </div>


                    <div>
                        <span>
                            Cancelled
                        </span>
                        <strong>
                            {statusCounts.CANCELLED}
                        </strong>
                    </div>

                </div>

            </section>


            {/* =========================
                TECHNICIAN WORKLOAD
            ========================== */}
            <section className="page-content">

                <div className="workspace-section-header">

                    <div>

                        <h3>
                            Technician Workload
                        </h3>

                        <p className="workspace-section-description">
                            Current and total repair
                            assignments for each technician.
                        </p>

                    </div>

                </div>


                <div className="report-table-wrapper">

                    <table className="report-table">

                        <thead>

                            <tr>

                                <th>
                                    Technician
                                </th>

                                <th>
                                    Active Repairs
                                </th>

                                <th>
                                    Total Assigned
                                </th>

                            </tr>

                        </thead>


                        <tbody>

                            {technicianWorkload.map(
                                (technician) => (

                                    <tr
                                        key={
                                            technician.id
                                        }
                                    >

                                        <td>
                                            {technician.name}
                                        </td>

                                        <td>
                                            {
                                                technician
                                                    .activeRepairs
                                            }
                                        </td>

                                        <td>
                                            {
                                                technician
                                                    .totalRepairs
                                            }
                                        </td>

                                    </tr>

                                )
                            )}

                        </tbody>

                    </table>

                </div>

            </section>


            {/* =========================
                REPAIR RECORDS
            ========================== */}
            <section className="page-content">

                <div className="workspace-section-header">

                    <div>

                        <h3>
                            Repair Records
                        </h3>

                        <p className="workspace-section-description">
                            Search and filter repair records
                            included in the operational report.
                        </p>

                    </div>

                </div>


                {/* FILTERS */}
                <div className="report-filters">

                    <div className="report-search">

                        <Search size={18} />

                        <input
                            type="search"
                            value={searchTerm}
                            onChange={(event) =>
                                setSearchTerm(
                                    event.target.value
                                )
                            }
                            placeholder={
                                "Search reference, customer, or device..."
                            }
                        />

                    </div>


                    <select
                        value={statusFilter}
                        onChange={(event) =>
                            setStatusFilter(
                                event.target.value
                            )
                        }
                        aria-label={
                            "Filter by repair status"
                        }
                    >

                        <option value="ALL">
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


                    <select
                        value={technicianFilter}
                        onChange={(event) =>
                            setTechnicianFilter(
                                event.target.value
                            )
                        }
                        aria-label={
                            "Filter by technician"
                        }
                    >

                        <option value="ALL">
                            All Technicians
                        </option>


                        {mockTechnicians.map(
                            (technician) => (

                                <option
                                    key={
                                        technician.id
                                    }
                                    value={
                                        technician.id
                                    }
                                >
                                    {technician.name}
                                </option>

                            )
                        )}

                    </select>

                </div>


                {/* RESULT COUNT */}
                <div className="report-result-count">

                    Showing{" "}

                    <strong>
                        {filteredRepairs.length}
                    </strong>

                    {" "}of{" "}

                    <strong>
                        {mockRepairs.length}
                    </strong>

                    {" "}repair records

                </div>


                {/* REPAIR TABLE */}
                {filteredRepairs.length > 0 ? (

                    <RepairReportTable
                        repairs={
                            filteredRepairs
                        }
                        onRepairClick={
                            handleRepairClick
                        }
                    />

                ) : (

                    <div className="workspace-empty-state">

                        <strong>
                            No repair records found
                        </strong>

                        <p>
                            Try changing the search
                            or report filters.
                        </p>

                    </div>

                )}

            </section>

        </>
    );
}


export default ReportsPage;