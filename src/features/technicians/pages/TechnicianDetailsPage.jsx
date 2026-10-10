import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import StatusBadge from "../../../components/StatusBadge.jsx";
import { getTechnician } from "../../../api/technicianApi.js";
import { hasAccess } from "../../../config/accessControl.js";
import { useAuth } from "../../auth/context/AuthContext.jsx";

import "../technicians.css";

const activeStatuses = [
  ["RECEIVED", "Received"],
  ["AWAITING_APPROVAL", "Awaiting Approval"],
  ["IN_PROGRESS", "In Progress"],
  ["AWAITING_PARTS", "Awaiting Parts"],
  ["READY_FOR_RELEASE", "Ready for Release"],
];

function TechnicianDetailsPage() {
  const { technicianId } = useParams();
  const { user } = useAuth();

  const pageKey = JSON.stringify([
    technicianId,
    user?.id,
    [...(user?.roles ?? [])].sort(),
  ]);

  return (
    <TechnicianDetails key={pageKey} technicianId={technicianId} user={user} />
  );
}

function TechnicianDetails({ technicianId, user }) {
  const navigate = useNavigate();

  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [reloadCount, setReloadCount] = useState(0);

  const roles = user?.roles ?? [];
  const canView = hasAccess(roles, "technicians");
  const canViewRepairs = hasAccess(roles, "repairs");

  useEffect(() => {
    if (!canView) {
      return;
    }

    const controller = new AbortController();

    setLoading(true);
    setError("");
    setNotFound(false);
    setDetails(null);

    async function loadTechnician() {
      try {
        const result = await getTechnician(technicianId, {
          signal: controller.signal,
        });

        if (
          !result?.technician ||
          String(result.technician.id) !== technicianId ||
          typeof result.technician.name !== "string" ||
          !["ACTIVE", "INACTIVE"].includes(result.technician.status) ||
          !Number.isInteger(result.technician.activeRepairs) ||
          !Number.isInteger(result.technician.totalRepairs) ||
          !result.statusCounts ||
          !Array.isArray(result.activeRepairs) ||
          !Array.isArray(result.repairHistory)
        ) {
          throw new Error("The server returned invalid technician details.");
        }

        if (!controller.signal.aborted) {
          setDetails(result);
        }
      } catch (requestError) {
        if (!controller.signal.aborted) {
          setNotFound(requestError?.status === 404);
          setError(
            requestError?.message ||
              "The technician details could not be loaded.",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadTechnician();

    return () => controller.abort();
  }, [canView, technicianId, reloadCount]);

  function handleRepairClick(repairId) {
    if (canViewRepairs) {
      navigate(`/repairs/${repairId}`);
    }
  }

  if (!canView) {
    return (
      <section className="page-header">
        <h2>Access Denied</h2>
        <p>You do not have permission to view technicians.</p>
      </section>
    );
  }

  const technician = details?.technician;

  return (
    <>
      <section className="page-header">
        <h2>
          {notFound
            ? "Technician Not Found"
            : technician?.name || "Technician Details"}
        </h2>

        <p>View technician workload and assigned repair jobs.</p>
      </section>

      {loading && (
        <section className="page-content" aria-busy="true">
          <div className="workspace-empty-state" role="status">
            <p>Loading technician details...</p>
          </div>
        </section>
      )}

      {!loading && error && (
        <section className="page-content">
          <div className="customer-form-error" role="alert">
            <p>
              {notFound
                ? "The requested technician record does not exist."
                : error}
            </p>
          </div>

          {notFound ? (
            <button
              className="secondary-repair-button"
              type="button"
              onClick={() => navigate("/technicians")}
            >
              Back to Technicians
            </button>
          ) : (
            <button
              className="create-repair-button"
              type="button"
              onClick={() => setReloadCount((current) => current + 1)}
            >
              Try Again
            </button>
          )}
        </section>
      )}

      {!loading && !error && details && (
        <>
          <section className="page-content">
            <div className="workspace-section-header">
              <div>
                <h3>Technician Information</h3>
                <p className="workspace-section-description">
                  Basic operational information for this technician.
                </p>
              </div>
            </div>

            <div className="technician-info-grid">
              <div>
                <span>Technician</span>
                <strong>{technician.name}</strong>
              </div>

              <div>
                <span>Role</span>
                <strong>{technician.role}</strong>
              </div>

              <div>
                <span>Status</span>
                <strong>
                  {technician.status === "ACTIVE" ? "Active" : "Inactive"}
                </strong>
              </div>

              <div>
                <span>Active Repairs</span>
                <strong>{technician.activeRepairs}</strong>
              </div>

              <div>
                <span>Total Assigned</span>
                <strong>{technician.totalRepairs}</strong>
              </div>
            </div>
          </section>

          <section className="page-content">
            <div className="workspace-section-header">
              <div>
                <h3>Workload Summary</h3>
                <p className="workspace-section-description">
                  Current assigned repairs grouped by repair status.
                </p>
              </div>
            </div>

            <div className="technician-workload-grid">
              {activeStatuses.map(([status, label]) => (
                <div key={status}>
                  <span>{label}</span>
                  <strong>{details.statusCounts[status] ?? 0}</strong>
                </div>
              ))}
            </div>
          </section>

          <section className="page-content">
            <div className="workspace-section-header">
              <div>
                <h3>Active Assigned Repairs</h3>
                <p className="workspace-section-description">
                  Repair jobs currently assigned to this technician.
                </p>
              </div>
            </div>

            <TechnicianRepairList
              repairs={details.activeRepairs}
              canViewRepairs={canViewRepairs}
              onRepairClick={handleRepairClick}
              emptyTitle="No active repairs"
              emptyMessage="This technician currently has no active repair assignments."
            />
          </section>

          <section className="page-content">
            <div className="workspace-section-header">
              <div>
                <h3>Repair History</h3>
                <p className="workspace-section-description">
                  Completed or cancelled repairs recorded under this technician.
                </p>
              </div>
            </div>

            <TechnicianRepairList
              repairs={details.repairHistory}
              canViewRepairs={canViewRepairs}
              onRepairClick={handleRepairClick}
              emptyTitle="No repair history"
              emptyMessage="Completed or cancelled repairs will appear here."
            />
          </section>
        </>
      )}
    </>
  );
}

function TechnicianRepairList({
  repairs,
  canViewRepairs,
  onRepairClick,
  emptyTitle,
  emptyMessage,
}) {
  if (repairs.length === 0) {
    return (
      <div className="workspace-empty-state">
        <strong>{emptyTitle}</strong>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="technician-repair-list">
      {repairs.map((repair) => (
        <button
          key={repair.id}
          className="technician-repair-item"
          type="button"
          disabled={!canViewRepairs}
          onClick={() => onRepairClick(repair.id)}
        >
          <div>
            <span>Repair Reference</span>
            <strong>{repair.reference}</strong>
          </div>

          <div>
            <span>Customer</span>
            <strong>{repair.customer}</strong>
          </div>

          <div>
            <span>Device</span>
            <strong>{repair.device}</strong>
          </div>

          <div>
            <span>Status</span>
            <StatusBadge status={repair.status} />
          </div>
        </button>
      ))}
    </div>
  );
}

export default TechnicianDetailsPage;
