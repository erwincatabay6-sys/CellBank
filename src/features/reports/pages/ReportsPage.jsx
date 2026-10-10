import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { CalendarDays, RotateCcw, Search, TrendingUp } from "lucide-react";

import { getReport } from "../../../api/reportApi.js";
import { hasAccess } from "../../../config/accessControl.js";
import { useAuth } from "../../auth/context/AuthContext.jsx";

import RepairReportTable from "../components/RepairReportTable.jsx";
import FinancialReportTable from "../components/FinancialReportTable.jsx";
import ReportLineChart from "../components/ReportLineChart.jsx";
import ReportBarChart from "../components/ReportBarChart.jsx";

import "../reports.css";

const reportStatuses = [
  { value: "RECEIVED", label: "Received" },
  { value: "AWAITING_APPROVAL", label: "Awaiting Approval" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "AWAITING_PARTS", label: "Awaiting Parts" },
  { value: "READY_FOR_RELEASE", label: "Ready for Release" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

function toChartData(points) {
  return points.map((point) => ({
    key: point.month,
    label: new Date(`${point.month}-01T00:00:00`).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    }),
    value: point.value,
  }));
}

function ReportsPage() {
  const { user } = useAuth();

  const accountKey = JSON.stringify([
    user?.id,
    [...(user?.roles ?? [])].sort(),
  ]);

  return <ReportsContent key={accountKey} user={user} />;
}

function ReportsContent({ user }) {
  const navigate = useNavigate();

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [technicianFilter, setTechnicianFilter] = useState("ALL");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("ALL");
  const [reloadCount, setReloadCount] = useState(0);

  const [result, setResult] = useState({
    key: "",
    data: null,
    error: "",
    loading: true,
  });

  const canView = hasAccess(user?.roles ?? [], "reports");

  const hasInvalidDateRange = Boolean(
    startDate && endDate && startDate > endDate,
  );

  const requestKey = JSON.stringify([startDate, endDate, reloadCount]);

  useEffect(() => {
    if (!canView || hasInvalidDateRange) {
      return;
    }

    const controller = new AbortController();

    setResult({
      key: requestKey,
      data: null,
      error: "",
      loading: true,
    });

    async function loadReport() {
      try {
        const data = await getReport(
          { startDate, endDate },
          { signal: controller.signal },
        );

        if (
          !data?.repairSummary ||
          !data?.financialSummary ||
          !data?.statusCounts ||
          !Array.isArray(data.repairVolume) ||
          !Array.isArray(data.paymentTrend) ||
          !Array.isArray(data.financialRecords) ||
          !Array.isArray(data.technicianActivity) ||
          !Array.isArray(data.repairRecords)
        ) {
          throw new Error("The server returned invalid report data.");
        }

        if (!controller.signal.aborted) {
          setResult({
            key: requestKey,
            data,
            error: "",
            loading: false,
          });
        }
      } catch (requestError) {
        if (!controller.signal.aborted) {
          setResult({
            key: requestKey,
            data: null,
            error: requestError?.message || "The report could not be loaded.",
            loading: false,
          });
        }
      }
    }

    const timer = window.setTimeout(() => {
      void loadReport();
    }, 300);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [canView, hasInvalidDateRange, startDate, endDate, requestKey]);

  const matchesPeriod = result.key === requestKey;

  const loading = !hasInvalidDateRange && (!matchesPeriod || result.loading);

  const error = !hasInvalidDateRange && matchesPeriod ? result.error : "";

  const report =
    !hasInvalidDateRange && matchesPeriod && !result.loading
      ? result.data
      : null;

  const {
    totalRepairs = 0,
    activeRepairs = 0,
    completedRepairs = 0,
    cancelledRepairs = 0,
  } = report?.repairSummary ?? {};

  const {
    totalAgreedValue = 0,
    totalPaymentsCollected = 0,
    totalOutstandingBalance = 0,
    paidRepairs = 0,
    partiallyPaidRepairs = 0,
    unpaidRepairs = 0,
    priceNotAgreedRepairs = 0,
  } = report?.financialSummary ?? {};

  const periodRepairs = report?.repairRecords ?? [];
  const financialRecords = report?.financialRecords ?? [];
  const technicianActivity = report?.technicianActivity ?? [];

  const repairVolumeData = toChartData(report?.repairVolume ?? []);
  const paymentTrendData = toChartData(report?.paymentTrend ?? []);

  const statusChartData = reportStatuses.map((status) => ({
    key: status.value,
    label: status.label,
    value: report?.statusCounts?.[status.value] ?? 0,
  }));

  const filteredFinancialRecords = financialRecords.filter(
    (record) =>
      paymentStatusFilter === "ALL" ||
      record.paymentStatus === paymentStatusFilter,
  );

  const filteredRepairs = periodRepairs.filter((repair) => {
    const search = searchTerm.trim().toLowerCase();

    const matchesSearch = [
      repair.reference,
      repair.customer,
      repair.device,
    ].some((value) => (value ?? "").toLowerCase().includes(search));

    const matchesStatus =
      statusFilter === "ALL" || repair.status === statusFilter;

    const matchesTechnician =
      technicianFilter === "ALL" ||
      (technicianFilter === "UNASSIGNED"
        ? repair.technicianId == null
        : String(repair.technicianId) === technicianFilter);

    return matchesSearch && matchesStatus && matchesTechnician;
  });

  function handleRepairClick(repairId) {
    navigate(`/repairs/${repairId}`);
  }

  function handleClearPeriod() {
    setStartDate("");
    setEndDate("");
  }

  if (!canView) {
    return (
      <section className="page-header">
        <h2>Access Denied</h2>
        <p>You do not have permission to view reports.</p>
      </section>
    );
  }

  return (
    <>
      <section className="page-header">
        <h2>Reports</h2>
        <p>
          Analyze repair activity and financial performance over a selected
          reporting period.
        </p>
      </section>

      <section className="page-content report-period-section">
        <div className="workspace-section-header">
          <div>
            <h3>Report Period</h3>
            <p className="workspace-section-description">
              Dates use Philippine time. Repairs are filtered by date received;
              payments by date recorded. Leave both dates blank for All Time.
            </p>
          </div>
        </div>

        <div className="report-period-controls">
          <label className="report-date-field">
            <span>Start Date</span>
            <div>
              <CalendarDays size={17} />
              <input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </div>
          </label>

          <label className="report-date-field">
            <span>End Date</span>
            <div>
              <CalendarDays size={17} />
              <input
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </div>
          </label>

          <button
            className="secondary-repair-button report-reset-button"
            type="button"
            onClick={handleClearPeriod}
            disabled={!startDate && !endDate}
          >
            <RotateCcw size={17} />
            <span>All Time</span>
          </button>
        </div>

        {hasInvalidDateRange && (
          <p className="report-date-error" role="alert">
            Start Date cannot be later than End Date.
          </p>
        )}
      </section>

      {loading && (
        <section className="page-content" aria-busy="true">
          <div className="workspace-empty-state" role="status">
            <p>Loading report...</p>
          </div>
        </section>
      )}

      {!loading && error && (
        <section className="page-content">
          <div className="customer-form-error" role="alert">
            <p>{error}</p>
          </div>

          <button
            type="button"
            className="create-repair-button"
            onClick={() => setReloadCount((current) => current + 1)}
          >
            Try Again
          </button>
        </section>
      )}

      {report && (
        <>
          <section className="page-content">
            <div className="workspace-section-header">
              <div>
                <h3>Repair Summary</h3>
                <p className="workspace-section-description">
                  Current status of repairs received during the selected period.
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

          <section className="page-content">
            <div className="workspace-section-header">
              <div>
                <h3>Repair Analytics</h3>
                <p className="workspace-section-description">
                  Monthly intake and current status distribution for repairs
                  received in the selected period.
                </p>
              </div>

              <TrendingUp size={22} className="report-section-icon" />
            </div>

            <div className="report-chart-grid">
              <article className="report-chart-card">
                <div className="report-chart-header">
                  <h4>Repair Volume Over Time</h4>
                  <p>New repair jobs recorded by month.</p>
                </div>

                <ReportLineChart
                  data={repairVolumeData}
                  ariaLabel="Line chart showing repair volume over time"
                />
              </article>

              <article className="report-chart-card">
                <div className="report-chart-header">
                  <h4>Repairs by Status</h4>
                  <p>Distribution of repair records by their current status.</p>
                </div>

                <ReportBarChart
                  data={statusChartData}
                  ariaLabel="Bar chart showing repair count by status"
                />
              </article>
            </div>
          </section>

          <section className="page-content">
            <div className="workspace-section-header">
              <div>
                <h3>Financial Summary</h3>
                <p className="workspace-section-description">
                  Agreed values and current balances belong to repairs received
                  in the selected period. Payments Received includes all
                  payments recorded during that period, including payments for
                  older repairs.
                </p>
              </div>
            </div>

            <div className="financial-summary-grid">
              <div>
                <span>Agreed Repair Value</span>
                <strong>₱{totalAgreedValue.toFixed(2)}</strong>
              </div>
              <div>
                <span>Payments Received</span>
                <strong>₱{totalPaymentsCollected.toFixed(2)}</strong>
              </div>
              <div>
                <span>Outstanding Balance</span>
                <strong>₱{totalOutstandingBalance.toFixed(2)}</strong>
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
                  Recorded payments by month during the selected reporting
                  period.
                </p>
              </div>

              <ReportLineChart
                data={paymentTrendData}
                valueType="currency"
                ariaLabel="Line chart showing payments received over time"
              />
            </article>
          </section>

          <section className="page-content">
            <div className="workspace-section-header">
              <div>
                <h3>Financial Records</h3>
                <p className="workspace-section-description">
                  Current payment totals and balances for repairs received in
                  the selected period, including payments recorded outside that
                  period.
                </p>
              </div>
            </div>

            <div className="financial-record-filters">
              <select
                value={paymentStatusFilter}
                onChange={(event) => setPaymentStatusFilter(event.target.value)}
                aria-label="Filter by payment status"
              >
                <option value="ALL">All Payment Statuses</option>
                <option value="Paid">Paid</option>
                <option value="Partially Paid">Partially Paid</option>
                <option value="Unpaid">Unpaid</option>
                <option value="Price Not Agreed">Price Not Agreed</option>
              </select>
            </div>

            <div className="report-result-count">
              Showing <strong>{filteredFinancialRecords.length}</strong> of{" "}
              <strong>{financialRecords.length}</strong> financial records
            </div>

            {filteredFinancialRecords.length > 0 ? (
              <FinancialReportTable
                records={filteredFinancialRecords}
                onRepairClick={handleRepairClick}
              />
            ) : (
              <div className="workspace-empty-state">
                <strong>No financial records found</strong>
                <p>Try changing the report period or payment-status filter.</p>
              </div>
            )}
          </section>

          <section className="page-content">
            <div className="workspace-section-header">
              <div>
                <h3>Technician Repair Activity</h3>
                <p className="workspace-section-description">
                  Saved technician assignments for repairs received during the
                  selected period, showing their current status.
                </p>
              </div>
            </div>

            {technicianActivity.length > 0 ? (
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
                    {technicianActivity.map((technician) => (
                      <tr key={technician.id}>
                        <td>{technician.name}</td>
                        <td>{technician.repairsHandled}</td>
                        <td>{technician.activeRepairs}</td>
                        <td>{technician.completedRepairs}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="workspace-empty-state">
                <strong>No technician activity available</strong>
                <p>
                  Technician accounts and assignments will appear here when
                  available.
                </p>
              </div>
            )}
          </section>

          <section className="page-content">
            <div className="workspace-section-header">
              <div>
                <h3>Detailed Repair Records</h3>
                <p className="workspace-section-description">
                  Search and filter the repair records included in the selected
                  report period.
                </p>
              </div>
            </div>

            <div className="report-filters">
              <div className="report-search">
                <Search size={18} />

                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search reference, customer, or device..."
                  aria-label="Search repair records"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                aria-label="Filter by repair status"
              >
                <option value="ALL">All Statuses</option>
                {reportStatuses.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>

              <select
                value={technicianFilter}
                onChange={(event) => setTechnicianFilter(event.target.value)}
                aria-label="Filter by technician"
              >
                <option value="ALL">All Technicians</option>
                <option value="UNASSIGNED">Unassigned</option>
                {technicianActivity.map((technician) => (
                  <option key={technician.id} value={technician.id}>
                    {technician.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="report-result-count">
              Showing <strong>{filteredRepairs.length}</strong> of{" "}
              <strong>{periodRepairs.length}</strong> repair records
            </div>

            {filteredRepairs.length > 0 ? (
              <RepairReportTable
                repairs={filteredRepairs}
                onRepairClick={handleRepairClick}
              />
            ) : (
              <div className="workspace-empty-state">
                <strong>No repair records found</strong>
                <p>
                  Try changing the report period, search, or record filters.
                </p>
              </div>
            )}
          </section>
        </>
      )}
    </>
  );
}

export default ReportsPage;
