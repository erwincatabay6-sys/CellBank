import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import FeedbackNotice from "../../../components/FeedbackNotice.jsx";
import StatusBadge from "../../../components/StatusBadge.jsx";

import { CalendarDays, RotateCcw, Search } from "lucide-react";

import { getReport } from "../../../api/reportApi.js";
import { hasAccess } from "../../../config/accessControl.js";
import { useAuth } from "../../auth/context/AuthContext.jsx";

import RepairReportTable from "../components/RepairReportTable.jsx";
import FinancialReportTable from "../components/FinancialReportTable.jsx";
import ReportLineChart from "../components/ReportLineChart.jsx";
import ReportDetailsTabs from "../components/ReportDetailsTabs.jsx";
import ReportsSkeleton from "../components/ReportsSkeleton.jsx";
import ReportColumnChart from "../components/ReportColumnChart.jsx";
import buildPaymentChart from "../utils/buildPaymentChart.js";
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

const dateFormatter = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeZone: "UTC",
});

const moneyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
});

function formatPeriod(startDate, endDate) {
  const format = (value) => dateFormatter.format(new Date(`${value}T00:00:00Z`));
  if (startDate && endDate) {
    return startDate === endDate ? format(startDate) : `${format(startDate)} – ${format(endDate)}`;
  }
  if (startDate) return `From ${format(startDate)}`;
  if (endDate) return `Through ${format(endDate)}`;
  return "All Time";
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
  const [activeTab, setActiveTab] = useState("repairs");

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
  const paymentChart = report
    ? buildPaymentChart(report.paymentTrend, startDate, endDate)
    : { data: [], periodLabel: "" };

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
    <div className="reports-page">
      <section className="page-header report-heading">
        <div>
          <h2>Reports</h2>
          <p className="report-selected-period">
            {hasInvalidDateRange ? "Invalid date range" : formatPeriod(startDate, endDate)}
          </p>
          <p>Philippine time</p>
        </div>

        <div className="report-period-controls">
          <label className="report-date-field">
            <span>Start Date</span>
            <div>
              <CalendarDays size={17} />
              <input
                type="date"
                value={startDate}
                aria-invalid={hasInvalidDateRange}
                aria-describedby={
                  hasInvalidDateRange ? "report-date-error" : undefined
                }
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
                aria-invalid={hasInvalidDateRange}
                aria-describedby={
                  hasInvalidDateRange ? "report-date-error" : undefined
                }
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
          <p id="report-date-error" className="report-date-error" role="alert">
            Start Date cannot be later than End Date.
          </p>
        )}
      </section>

      {loading && <ReportsSkeleton activeTab={activeTab} />}

      {!loading && error && (
        <section className="page-content">
          <FeedbackNotice
            title="Unable to load report"
            className="customer-form-error"
            role="alert"
            resetKey={[error]}
            actions={
              <button
                type="button"
                className="create-repair-button"
                onClick={() => setReloadCount((current) => current + 1)}
              >
                Try Again
              </button>
            }
          >
            <p>{error}</p>
          </FeedbackNotice>
        </section>
      )}

      {report && (
        <>
          <section className="report-summary-strip" aria-label="Period summary">
            <div>
              <span>Repairs received</span>
              <strong>{totalRepairs}</strong>
            </div>
            <div>
              <span>Still active</span>
              <strong>{activeRepairs}</strong>
            </div>
            <div>
              <span>Completed</span>
              <strong>{completedRepairs}</strong>
            </div>
            <div>
              <span>Payments received</span>
              <strong>{moneyFormatter.format(totalPaymentsCollected)}</strong>
            </div>
          </section>

          <section className="report-chart-grid" aria-label="Repair analytics">
            <article className="report-chart-card">
              <div className="report-chart-header">
                <h3>Repair Volume Over Time</h3>
                <p>Repairs received by month.</p>
              </div>
              <ReportLineChart
                data={repairVolumeData}
                ariaLabel="Line chart showing repair volume over time"
              />
            </article>

            <article className="report-chart-card">
              <div className="report-chart-header">
                <h3>Repairs by Status</h3>
                <p>Current status of repairs received in the selected period.</p>
              </div>
              <dl className="report-status-list">
                {reportStatuses.map(({ value }) => (
                  <div key={value}>
                    <dt><StatusBadge status={value} /></dt>
                    <dd>{report.statusCounts[value] ?? 0}</dd>
                  </div>
                ))}
              </dl>
            </article>
          </section>

          <ReportDetailsTabs
            selected={activeTab}
            onSelect={setActiveTab}
            panels={{
              repairs: (
                <>
                  <section className="page-content">
                    <div className="report-detail-heading">
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
              ),
              financial: (
                <>
                  <section className="page-content">
                    <div className="report-detail-heading">
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
                        <strong>{moneyFormatter.format(totalAgreedValue)}</strong>
                      </div>
                      <div>
                        <span>Payments Received</span>
                        <strong>{moneyFormatter.format(totalPaymentsCollected)}</strong>
                      </div>
                      <div>
                        <span>Outstanding Balance</span>
                        <strong>{moneyFormatter.format(totalOutstandingBalance)}</strong>
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
                        <h4>Payments Received by Month — {paymentChart.periodLabel}</h4>

                        <p>
                          {!startDate && !endDate
                            ? "Monthly payments for the current year. All Time totals above include every year."
                            : "Monthly payments within the selected date filters; boundary months may cover only part of the month."}{" "}
                          Months without recorded payments show ₱0.
                        </p>
                      </div>

                      <ReportColumnChart
                        data={paymentChart.data}
                        ariaLabel={`Monthly payments received: ${paymentChart.periodLabel}`}
                      />
                    </article>
                  </section>

                  <section className="page-content">
                    <div className="report-detail-heading">
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
                </>
              ),
              technicians: (
                <>
                  <section className="page-content">
                    <div className="report-detail-heading">
                      <div>
                        <h3>Technician Repair Activity</h3>
                        <p className="workspace-section-description">
                          Saved technician assignments for repairs received during the
                          selected period, showing their current status.
                        </p>
                      </div>
                    </div>

                    {technicianActivity.length > 0 ? (
                      <div
                        className="report-table-wrapper"
                        role="region"
                        aria-label="Technician repair activity"
                        tabIndex={0}
                      >
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
                </>
              ),
            }}
          />
        </>
      )}
    </div>
  );
}

export default ReportsPage;
