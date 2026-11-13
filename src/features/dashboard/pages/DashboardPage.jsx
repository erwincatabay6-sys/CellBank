import DashboardFrontDeskActivity from "../components/DashboardFrontDeskActivity.jsx";
import { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";

import useFeedbackState from "../../../hooks/useFeedbackState.js";
import FeedbackNotice from "../../../components/FeedbackNotice.jsx";

import { hasAccess, hasRole } from "../../../config/accessControl.js";
import { getDashboard } from "../../../api/dashboardApi.js";
import { useAuth } from "../../auth/context/AuthContext.jsx";

import DashboardSummaryCards from "../components/DashboardSummaryCards.jsx";
import DashboardStatusCounts from "../components/DashboardStatusCounts.jsx";
import DashboardAttentionRepairs from "../components/DashboardAttentionRepairs.jsx";
import DashboardTechnicianWorkload from "../components/DashboardTechnicianWorkload.jsx";
import DashboardRecentRepairs from "../components/DashboardRecentRepairs.jsx";
import DashboardFinancialSnapshot from "../components/DashboardFinancialSnapshot.jsx";
import DashboardSkeleton from "../components/DashboardSkeleton.jsx";

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
  const [restricted, setRestricted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError, errorVersion] = useFeedbackState("");
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
    setRestricted(false);
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
        if (!controller.signal.aborted) setRestricted([403, 404].includes(requestError?.status));
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
      <section className="page-header dashboard-page-header">
        <div>
          <h2>
            {user?.name?.trim()
              ? `Welcome back, ${user.name.trim().split(/\s+/)[0]}`
              : "Dashboard"}
          </h2>
          <p>
            {isTechnicianOnly
              ? "Here is the latest on your assigned repairs."
              : "Here is the latest on shop-wide repair operations."}
          </p>
        </div>

      </section>

      {loading && (
        <DashboardSkeleton
          isAdmin={isAdmin}
          technicianOnly={
            hasRole(currentRoles, "TECHNICIAN") &&
            !isAdmin &&
            !hasRole(currentRoles, "FRONT_DESK")
          }
        />
      )}

      {!loading && error && (
        <section className="page-content">
          <FeedbackNotice
            title={restricted ? "Access restricted" : "Unable to load dashboard"}
            className="customer-form-error"
            role="alert"
            resetKey={[error, errorVersion]}
            actions={restricted ? <button type="button" onClick={() => navigate("/account")}>Go to account</button> :
              <button
                type="button"
                className="create-repair-button"
                onClick={() => setReloadCount((current) => current + 1)}
              >
                Try Again
              </button>
            }
          >
            <p>{restricted ? "This information is unavailable or you do not have access." : error}</p>
          </FeedbackNotice>
        </section>
      )}

      {!loading && !error && dashboard && (
        <div className="dashboard-layout">
          <section className="dashboard-summary-section" aria-label="Repair summary">
            <DashboardSummaryCards
              totalRepairs={dashboard.summary.totalRepairs}
              activeRepairs={dashboard.summary.activeRepairs}
              readyForRelease={dashboard.summary.readyForRelease}
              completedRepairs={dashboard.summary.completedRepairs}
            />
          </section>

          <div className="dashboard-columns">
            <div className="dashboard-main-column">
              <section className="page-content dashboard-attention-section">
                <div className="dashboard-panel-header">
                  <div>
                    <h3>Needs Attention</h3>
                  </div>
                </div>

                <DashboardAttentionRepairs
                  repairs={dashboard.attentionRepairs}
                  onRepairClick={handleRepairClick}
                />
              </section>

              <section className="page-content dashboard-recent-section">
                <div className="dashboard-panel-header">
                  <div>
                    <h3>
                      {isTechnicianOnly
                        ? "Your Active Repairs"
                        : "Recent Active Repairs"}
                    </h3>
                  </div>
                  {canViewRepairs && (
                    <button
                      type="button"
                      className="dashboard-view-all"
                      onClick={() => navigate("/repairs")}
                    >
                      View repairs
                    </button>
                  )}
                </div>
                <p className="dashboard-table-description">
                  {isTechnicianOnly
                    ? "Your five most recently updated active repair jobs."
                    : "The five most recently updated active repair jobs."}
                </p>

                <DashboardRecentRepairs
                  repairs={dashboard.recentActiveRepairs}
                  onRepairClick={handleRepairClick}
                />
              </section>
            </div>
            <div className="dashboard-side-column">
              {(isAdmin || hasRole(currentRoles, "TECHNICIAN")) && <section className="page-content dashboard-workload-section">
                <div className="dashboard-panel-header">
                  <div>
                    <h3>
                      {isAdmin ? "Technician Workload" : "Your Workload"}
                    </h3>
                  </div>
                </div>

                <DashboardTechnicianWorkload
                  technicians={isAdmin ? dashboard.technicianWorkload : dashboard.technicianWorkload.filter((row) => String(row.id) === String(user.id))}
                />
              </section>}

              {(isAdmin || hasRole(currentRoles, "FRONT_DESK")) && (
                <section className="page-content dashboard-workload-section">
                  <div className="dashboard-panel-header"><h3>{isAdmin ? "Front Desk Activity" : "Your Front Desk Activity"}</h3></div>
                  <DashboardFrontDeskActivity activityDate={dashboard.activityDate}
                    staff={isAdmin ? dashboard.frontDeskActivity ?? [] : (dashboard.frontDeskActivity ?? []).filter((row) => String(row.id) === String(user.id))} />
                </section>
              )}

              <section className="page-content dashboard-status-section">
                <div className="dashboard-panel-header">
                  <div>
                    <h3>Repair Status</h3>
                  </div>
                </div>

                <DashboardStatusCounts statusCounts={dashboard.statusCounts} />
              </section>
              {isAdmin && financial && (
                <section className="page-content dashboard-financial-section">
                  <div className="dashboard-panel-header">
                    <div>
                      <h3>Financial Snapshot</h3>
                    </div>
                  </div>

                  <DashboardFinancialSnapshot
                    totalAgreedValue={financial.totalAgreedValue}
                    totalCollected={financial.totalCollected}
                    outstandingBalance={financial.outstandingBalance}
                  />
                </section>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default DashboardPage;
