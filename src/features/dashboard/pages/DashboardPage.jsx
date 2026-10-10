import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { hasAccess, hasRole } from "../../../config/accessControl.js";
import { getDashboard } from "../../../api/dashboardApi.js";
import { useAuth } from "../../auth/context/AuthContext.jsx";

import DashboardSummaryCards from "../components/DashboardSummaryCards.jsx";
import DashboardStatusCounts from "../components/DashboardStatusCounts.jsx";
import DashboardAttentionRepairs from "../components/DashboardAttentionRepairs.jsx";
import DashboardTechnicianWorkload from "../components/DashboardTechnicianWorkload.jsx";
import DashboardRecentRepairs from "../components/DashboardRecentRepairs.jsx";
import DashboardFinancialSnapshot from "../components/DashboardFinancialSnapshot.jsx";

import "../dashboard.css";

function DashboardPage() {
  const { user } = useAuth();

  // Reset loaded data when the signed-in account or its roles change.
  const accountKey = JSON.stringify([
    user?.id,
    [...(user?.roles ?? [])].sort(),
  ]);

  return <DashboardContent key={accountKey} user={user} />;
}

function DashboardContent({ user }) {
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadCount, setReloadCount] = useState(0);

  const currentRoles = user?.roles ?? [];
  const canViewDashboard = hasAccess(currentRoles, "dashboard");
  const canViewRepairs = hasAccess(currentRoles, "repairs");
  const isAdmin = hasRole(currentRoles, "ADMIN");

  useEffect(() => {
    if (!canViewDashboard) {
      return;
    }

    const controller = new AbortController();

    setLoading(true);
    setError("");
    setDashboard(null);

    async function loadDashboard() {
      try {
        const result = await getDashboard({
          signal: controller.signal,
        });

        if (
          !result?.summary ||
          !result?.statusCounts ||
          typeof result.technicianOnly !== "boolean" ||
          !Array.isArray(result.attentionRepairs) ||
          !Array.isArray(result.technicianWorkload) ||
          !Array.isArray(result.recentActiveRepairs)
        ) {
          throw new Error("The server returned invalid dashboard data.");
        }

        if (
          isAdmin &&
          (!result.financialSnapshot ||
            ![
              result.financialSnapshot.totalAgreedValue,
              result.financialSnapshot.totalCollected,
              result.financialSnapshot.outstandingBalance,
            ].every(
              (value) => typeof value === "number" && Number.isFinite(value),
            ))
        ) {
          throw new Error("The server returned invalid financial data.");
        }

        if (!controller.signal.aborted) {
          setDashboard(result);
        }
      } catch (requestError) {
        if (!controller.signal.aborted) {
          setError(
            requestError?.message || "The dashboard could not be loaded.",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => controller.abort();
  }, [canViewDashboard, isAdmin, reloadCount]);

  function handleRepairClick(repairId) {
    if (canViewRepairs) {
      navigate(`/repairs/${repairId}`);
    }
  }

  if (!canViewDashboard) {
    return (
      <section className="page-header">
        <h2>Access Denied</h2>
        <p>You do not have permission to access the Dashboard.</p>
      </section>
    );
  }

  const isTechnicianOnly = dashboard?.technicianOnly === true;
  const financial = dashboard?.financialSnapshot;

  return (
    <>
      <section className="page-header">
        <h2>Dashboard</h2>
        <p>Current operational overview of Cellbank repair activity.</p>
      </section>

      {loading && (
        <section className="page-content" aria-busy="true">
          <div className="workspace-empty-state" role="status">
            <p>Loading dashboard...</p>
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

      {!loading && !error && dashboard && (
        <>
          <section className="page-content">
            <div className="workspace-section-header">
              <div>
                <h3>Repair Summary</h3>
                <p className="workspace-section-description">
                  {isTechnicianOnly
                    ? "Summary of repairs currently assigned to you."
                    : "Current repair activity across the system."}
                </p>
              </div>
            </div>

            <DashboardSummaryCards
              totalRepairs={dashboard.summary.totalRepairs}
              activeRepairs={dashboard.summary.activeRepairs}
              readyForRelease={dashboard.summary.readyForRelease}
              completedRepairs={dashboard.summary.completedRepairs}
            />
          </section>

          <section className="page-content">
            <div className="workspace-section-header">
              <div>
                <h3>Repair Status</h3>
                <p className="workspace-section-description">
                  {isTechnicianOnly
                    ? "Current status of repairs assigned to you."
                    : "Current repair jobs grouped by status."}
                </p>
              </div>
            </div>

            <DashboardStatusCounts statusCounts={dashboard.statusCounts} />
          </section>

          <section className="page-content">
            <div className="workspace-section-header">
              <div>
                <h3>Repairs Needing Attention</h3>
                <p className="workspace-section-description">
                  {isTechnicianOnly
                    ? "Assigned repairs that currently require your attention."
                    : "Repair jobs that currently require staff follow-up."}
                </p>
              </div>
            </div>

            <DashboardAttentionRepairs
              repairs={dashboard.attentionRepairs}
              onRepairClick={handleRepairClick}
            />
          </section>

          <section className="page-content">
            <div className="workspace-section-header">
              <div>
                <h3>
                  {isTechnicianOnly ? "Your Workload" : "Technician Workload"}
                </h3>
                <p className="workspace-section-description">
                  {isTechnicianOnly
                    ? "Current and total repair assignments assigned to you."
                    : "Current repair workload across Cellbank technicians."}
                </p>
              </div>
            </div>

            <DashboardTechnicianWorkload
              technicians={dashboard.technicianWorkload}
            />
          </section>

          <section className="page-content">
            <div className="workspace-section-header">
              <div>
                <h3>
                  {isTechnicianOnly
                    ? "Your Active Repairs"
                    : "Recent Active Repairs"}
                </h3>
                <p className="workspace-section-description">
                  {isTechnicianOnly
                    ? "Your five most recently updated active repair jobs."
                    : "The five most recently updated active repair jobs."}
                </p>
              </div>
            </div>

            <DashboardRecentRepairs
              repairs={dashboard.recentActiveRepairs}
              onRepairClick={handleRepairClick}
            />
          </section>

          {isAdmin && financial && (
            <section className="page-content">
              <div className="workspace-section-header">
                <div>
                  <h3>Financial Snapshot</h3>
                  <p className="workspace-section-description">
                    Current repair value, collected payments, and outstanding
                    balances.
                  </p>
                </div>
              </div>

              <DashboardFinancialSnapshot
                totalAgreedValue={financial.totalAgreedValue}
                totalCollected={financial.totalCollected}
                outstandingBalance={financial.outstandingBalance}
              />
            </section>
          )}
        </>
      )}
    </>
  );
}

export default DashboardPage;
