import { useState } from "react";

import { useNavigate }
    from "react-router-dom";

import {
    CalendarDays,
    RotateCcw,
    Search,
    TrendingUp
} from "lucide-react";


import RepairReportTable
    from "../components/RepairReportTable.jsx";

import FinancialReportTable
    from "../components/FinancialReportTable.jsx";

import ReportLineChart
    from "../components/ReportLineChart.jsx";

import ReportBarChart
    from "../components/ReportBarChart.jsx";


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


const reportStatuses = [
    {
        value: "RECEIVED",
        label: "Received"
    },
    {
        value: "AWAITING_APPROVAL",
        label: "Awaiting Approval"
    },
    {
        value: "IN_PROGRESS",
        label: "In Progress"
    },
    {
        value: "AWAITING_PARTS",
        label: "Awaiting Parts"
    },
    {
        value: "READY_FOR_RELEASE",
        label: "Ready for Release"
    },
    {
        value: "COMPLETED",
        label: "Completed"
    },
    {
        value: "CANCELLED",
        label: "Cancelled"
    }
];


function isWithinDateRange(
    date,
    startDate,
    endDate
) {

    if (!date) {
        return false;
    }


    if (
        startDate &&
        date < startDate
    ) {
        return false;
    }


    if (
        endDate &&
        date > endDate
    ) {
        return false;
    }


    return true;
}


function formatMonthLabel(monthKey) {

    const date =
        new Date(
            `${monthKey}-01T00:00:00`
        );


    return date.toLocaleDateString(
        "en-US",
        {
            month: "short",
            year: "numeric"
        }
    );
}


function groupMonthlyTotals(
    records,
    dateKey,
    valueSelector = () => 1
) {

    const totals =
        new Map();


    records.forEach((record) => {

        const date =
            record[dateKey];


        if (!date) {
            return;
        }


        const monthKey =
            date.slice(0, 7);


        totals.set(
            monthKey,
            (
                totals.get(monthKey) ??
                0
            ) + valueSelector(record)
        );
    });


    return [
        ...totals.entries()
    ]
        .sort(
            ([monthA], [monthB]) =>
                monthA.localeCompare(monthB)
        )
        .map(([month, value]) => ({
            key: month,
            label: formatMonthLabel(month),
            value
        }));
}


function ReportsPage() {

    const navigate =
        useNavigate();


    // -----------------------------
    // REPORT PERIOD
    // -----------------------------

    const [startDate, setStartDate] =
        useState("");

    const [endDate, setEndDate] =
        useState("");


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


    const hasInvalidDateRange =
        Boolean(
            startDate &&
            endDate &&
            startDate > endDate
        );


    // -----------------------------
    // PERIOD DATA
    // -----------------------------

    const periodRepairs =
        hasInvalidDateRange
            ? []
            : mockRepairs.filter(
                (repair) =>
                    isWithinDateRange(
                        repair.createdAt,
                        startDate,
                        endDate
                    )
            );


    const periodPayments =
        hasInvalidDateRange
            ? []
            : mockPayments.filter(
                (payment) =>
                    isWithinDateRange(
                        payment.recordedDate,
                        startDate,
                        endDate
                    )
            );


    // -----------------------------
    // REPAIR SUMMARY
    // -----------------------------

    const totalRepairs =
        periodRepairs.length;

    const activeRepairs =
        periodRepairs.filter(
            (repair) =>
                !terminalStatuses.includes(
                    repair.status
                )
        ).length;

    const completedRepairs =
        periodRepairs.filter(
            (repair) =>
                repair.status === "COMPLETED"
        ).length;

    const cancelledRepairs =
        periodRepairs.filter(
            (repair) =>
                repair.status === "CANCELLED"
        ).length;


    // -----------------------------
    // REPAIR ANALYTICS
    // -----------------------------

    const repairVolumeData =
        groupMonthlyTotals(
            periodRepairs,
            "createdAt"
        );


    const statusCounts =
        periodRepairs.reduce(
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


    const statusChartData =
        reportStatuses.map(
            (status) => ({
                key: status.value,
                label: status.label,
                value:
                    statusCounts[
                        status.value
                    ] ?? 0
            })
        );


    // -----------------------------
    // FINANCIAL RECORDS
    // -----------------------------

    const financialRecords =
        periodRepairs.map((repair) => {

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
                    paymentStatus = "Paid";
                }
                else if (totalPaid > 0) {
                    paymentStatus =
                        "Partially Paid";
                }
                else {
                    paymentStatus = "Unpaid";
                }
            }


            return {
                id: repair.id,
                reference: repair.reference,
                customer: repair.customer,
                agreedPrice: repair.agreedPrice,
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
        periodPayments.reduce(
            (total, payment) =>
                total + payment.amount,
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


    const paymentTrendData =
        groupMonthlyTotals(
            periodPayments,
            "recordedDate",
            (payment) => payment.amount
        );


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
    // TECHNICIAN ACTIVITY
    // -----------------------------

    const technicianActivity =
        mockTechnicians.map(
            (technician) => {

                const assignedRepairs =
                    periodRepairs.filter(
                        (repair) =>
                            repair.technicianId ===
                                technician.id
                    );


                return {
                    ...technician,
                    repairsHandled:
                        assignedRepairs.length,
                    completedRepairs:
                        assignedRepairs.filter(
                            (repair) =>
                                repair.status ===
                                    "COMPLETED"
                        ).length,
                    activeRepairs:
                        assignedRepairs.filter(
                            (repair) =>
                                !terminalStatuses.includes(
                                    repair.status
                                )
                        ).length
                };
            }
        );


    // -----------------------------
    // FILTERED REPAIR RECORDS
    // -----------------------------

    const filteredRepairs =
        periodRepairs.filter((repair) => {

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
    // ACTIONS
    // -----------------------------

    function handleRepairClick(repairId) {

        navigate(
            `/repairs/${repairId}`
        );
    }


    function handleClearPeriod() {

        setStartDate("");
        setEndDate("");
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
                    Analyze repair activity and
                    financial performance over a
                    selected reporting period.
                </p>

            </section>


            {/* =========================
                REPORT PERIOD
            ========================== */}
            <section className="page-content report-period-section">

                <div className="workspace-section-header">

                    <div>

                        <h3>
                            Report Period
                        </h3>

                        <p className="workspace-section-description">
                            Filter historical report data
                            by repair and payment date.
                            Leave both dates blank to view
                            all available records.
                        </p>

                    </div>

                </div>


                <div className="report-period-controls">

                    <label className="report-date-field">

                        <span>
                            Start Date
                        </span>

                        <div>

                            <CalendarDays size={17} />

                            <input
                                type="date"
                                value={startDate}
                                onChange={(event) =>
                                    setStartDate(
                                        event.target.value
                                    )
                                }
                            />

                        </div>

                    </label>


                    <label className="report-date-field">

                        <span>
                            End Date
                        </span>

                        <div>

                            <CalendarDays size={17} />

                            <input
                                type="date"
                                value={endDate}
                                onChange={(event) =>
                                    setEndDate(
                                        event.target.value
                                    )
                                }
                            />

                        </div>

                    </label>


                    <button
                        className="secondary-repair-button report-reset-button"
                        type="button"
                        onClick={handleClearPeriod}
                        disabled={
                            !startDate &&
                            !endDate
                        }
                    >
                        <RotateCcw size={17} />
                        <span>All Time</span>
                    </button>

                </div>


                {hasInvalidDateRange && (
                    <p className="report-date-error">
                        Start Date cannot be later than
                        End Date.
                    </p>
                )}

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
                            Repair activity recorded during
                            the selected reporting period.
                        </p>

                    </div>

                </div>


                <div className="report-summary-grid">

                    <div>
                        <span>Total Repairs</span>
                        <strong>{totalRepairs}</strong>
                    </div>

                    <div>
                        <span>Active Repairs</span>
                        <strong>{activeRepairs}</strong>
                    </div>

                    <div>
                        <span>Completed</span>
                        <strong>{completedRepairs}</strong>
                    </div>

                    <div>
                        <span>Cancelled</span>
                        <strong>{cancelledRepairs}</strong>
                    </div>

                </div>

            </section>


            {/* =========================
                REPAIR ANALYTICS
            ========================== */}
            <section className="page-content">

                <div className="workspace-section-header">

                    <div>

                        <h3>
                            Repair Analytics
                        </h3>

                        <p className="workspace-section-description">
                            Historical trends and repair
                            distribution for the selected period.
                        </p>

                    </div>

                    <TrendingUp
                        size={22}
                        className="report-section-icon"
                    />

                </div>


                <div className="report-chart-grid">

                    <article className="report-chart-card">

                        <div className="report-chart-header">
                            <h4>Repair Volume Over Time</h4>
                            <p>
                                New repair jobs recorded by month.
                            </p>
                        </div>

                        <ReportLineChart
                            data={repairVolumeData}
                            ariaLabel={
                                "Line chart showing repair volume over time"
                            }
                        />

                    </article>


                    <article className="report-chart-card">

                        <div className="report-chart-header">
                            <h4>Repairs by Status</h4>
                            <p>
                                Distribution of repair records
                                by their current status.
                            </p>
                        </div>

                        <ReportBarChart
                            data={statusChartData}
                            ariaLabel={
                                "Bar chart showing repair count by status"
                            }
                        />

                    </article>

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
                            Financial performance associated
                            with the selected reporting period.
                        </p>

                    </div>

                </div>


                <div className="financial-summary-grid">

                    <div>
                        <span>Agreed Repair Value</span>
                        <strong>
                            ₱{totalAgreedValue.toFixed(2)}
                        </strong>
                    </div>

                    <div>
                        <span>Payments Received</span>
                        <strong>
                            ₱{totalPaymentsCollected.toFixed(2)}
                        </strong>
                    </div>

                    <div>
                        <span>Outstanding Balance</span>
                        <strong>
                            ₱{totalOutstandingBalance.toFixed(2)}
                        </strong>
                    </div>

                </div>


                <div className="financial-status-grid">

                    <div>
                        <span>Paid Repairs</span>
                        <strong>{paidRepairs}</strong>
                    </div>

                    <div>
                        <span>Partially Paid</span>
                        <strong>{partiallyPaidRepairs}</strong>
                    </div>

                    <div>
                        <span>Unpaid</span>
                        <strong>{unpaidRepairs}</strong>
                    </div>

                    <div>
                        <span>Price Not Agreed</span>
                        <strong>{priceNotAgreedRepairs}</strong>
                    </div>

                </div>


                <article className="report-chart-card report-payment-chart-card">

                    <div className="report-chart-header">
                        <h4>Payments Received Over Time</h4>
                        <p>
                            Recorded payments by month during
                            the selected reporting period.
                        </p>
                    </div>

                    <ReportLineChart
                        data={paymentTrendData}
                        valueType="currency"
                        ariaLabel={
                            "Line chart showing payments received over time"
                        }
                    />

                </article>

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
                            outstanding balances for repairs
                            in the selected period.
                        </p>

                    </div>

                </div>


                <div className="financial-record-filters">

                    <select
                        value={paymentStatusFilter}
                        onChange={(event) =>
                            setPaymentStatusFilter(
                                event.target.value
                            )
                        }
                        aria-label="Filter by payment status"
                    >
                        <option value="ALL">
                            All Payment Statuses
                        </option>
                        <option value="Paid">Paid</option>
                        <option value="Partially Paid">
                            Partially Paid
                        </option>
                        <option value="Unpaid">Unpaid</option>
                        <option value="Price Not Agreed">
                            Price Not Agreed
                        </option>
                    </select>

                </div>


                <div className="report-result-count">
                    Showing <strong>{filteredFinancialRecords.length}</strong>
                    {" "}of <strong>{financialRecords.length}</strong>
                    {" "}financial records
                </div>


                {filteredFinancialRecords.length > 0 ? (
                    <FinancialReportTable
                        records={filteredFinancialRecords}
                        onRepairClick={handleRepairClick}
                    />
                ) : (
                    <div className="workspace-empty-state">
                        <strong>
                            No financial records found
                        </strong>
                        <p>
                            Try changing the report period
                            or payment-status filter.
                        </p>
                    </div>
                )}

            </section>


            {/* =========================
                TECHNICIAN ACTIVITY
            ========================== */}
            <section className="page-content">

                <div className="workspace-section-header">

                    <div>

                        <h3>
                            Technician Repair Activity
                        </h3>

                        <p className="workspace-section-description">
                            Repair assignments handled by each
                            technician during the selected period.
                        </p>

                    </div>

                </div>


                <div className="report-table-wrapper">

                    <table className="report-table">

                        <thead>
                            <tr>
                                <th>Technician</th>
                                <th>Repairs Handled</th>
                                <th>Active</th>
                                <th>Completed</th>
                            </tr>
                        </thead>

                        <tbody>
                            {technicianActivity.map(
                                (technician) => (
                                    <tr key={technician.id}>
                                        <td>{technician.name}</td>
                                        <td>{technician.repairsHandled}</td>
                                        <td>{technician.activeRepairs}</td>
                                        <td>{technician.completedRepairs}</td>
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
                            Detailed Repair Records
                        </h3>

                        <p className="workspace-section-description">
                            Search and filter the repair records
                            included in the selected report period.
                        </p>

                    </div>

                </div>


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
                        aria-label="Filter by repair status"
                    >
                        <option value="ALL">
                            All Statuses
                        </option>
                        {reportStatuses.map(
                            (status) => (
                                <option
                                    key={status.value}
                                    value={status.value}
                                >
                                    {status.label}
                                </option>
                            )
                        )}
                    </select>


                    <select
                        value={technicianFilter}
                        onChange={(event) =>
                            setTechnicianFilter(
                                event.target.value
                            )
                        }
                        aria-label="Filter by technician"
                    >
                        <option value="ALL">
                            All Technicians
                        </option>
                        {mockTechnicians.map(
                            (technician) => (
                                <option
                                    key={technician.id}
                                    value={technician.id}
                                >
                                    {technician.name}
                                </option>
                            )
                        )}
                    </select>

                </div>


                <div className="report-result-count">
                    Showing <strong>{filteredRepairs.length}</strong>
                    {" "}of <strong>{periodRepairs.length}</strong>
                    {" "}repair records
                </div>


                {filteredRepairs.length > 0 ? (
                    <RepairReportTable
                        repairs={filteredRepairs}
                        onRepairClick={handleRepairClick}
                    />
                ) : (
                    <div className="workspace-empty-state">
                        <strong>
                            No repair records found
                        </strong>
                        <p>
                            Try changing the report period,
                            search, or record filters.
                        </p>
                    </div>
                )}

            </section>

        </>
    );
}


export default ReportsPage;
