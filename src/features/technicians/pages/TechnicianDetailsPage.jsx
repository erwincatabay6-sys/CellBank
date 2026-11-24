import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import useFeedbackState from "../../../hooks/useFeedbackState.js";
import FeedbackNotice from "../../../components/FeedbackNotice.jsx";

import { getTechnician } from "../../../api/technicianApi.js";
import { hasAccess, canOpenTechnician } from "../../../config/accessControl.js";
import { useAuth } from "../../auth/context/AuthContext.jsx";
import TechnicianDetailsSkeleton from "../components/TechnicianDetailsSkeleton.jsx";
import TechnicianRepairPanel from "../components/TechnicianRepairPanel.jsx";

import "../technicians.css";
import "../technicianDetails.css";

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
  const [error, setError, errorVersion] = useFeedbackState("");
  const [notFound, setNotFound] = useState(false);
  const [reloadCount, setReloadCount] = useState(0);

  const roles = user?.roles ?? [];
  const canView = hasAccess(roles, "technicians") && canOpenTechnician(user, technicianId);
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
          setNotFound([403, 404].includes(requestError?.status));
          setError(
            [403, 404].includes(requestError?.status) ? "This record is unavailable or you do not have access." : requestError?.message ||
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
        <h2>Access restricted</h2>
        <p>You do not have access to these technician details.</p>
        <button type="button" onClick={() => navigate("/technicians")}>Back to technicians</button>
      </section>
    );
  }

  const technician = details?.technician;

  return (
    <>
      {!technician && (
        <section className="page-header">
          <h2>{notFound ? "Access restricted" : "Technician Details"}</h2>
          <p>View technician workload and assigned repair jobs.</p>
        </section>
      )}

      {loading && <TechnicianDetailsSkeleton />}

      {!loading && error && (
        <section className="page-content">
          <FeedbackNotice
            title={notFound ? "Access restricted" : "Unable to load technician"}
            resetKey={[error, errorVersion, notFound]}
            actions={
              notFound ? (
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
              )
            }
          >
            {notFound
              ? "This record is unavailable or you do not have access."
              : error}
          </FeedbackNotice>
        </section>
      )}

      {!loading && !error && details && (
        <>
          <nav className="technician-detail-breadcrumb" aria-label="Breadcrumb">
            <Link to="/technicians">Technicians</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">Technician details</span>
          </nav>

          <section className="page-content technician-detail-header">
            <div className="technician-detail-identity">
              <h2>{technician.name}</h2>
              <div className="technician-detail-role">
                <span>{technician.role}</span>
                <span className={`technician-status ${technician.status === "ACTIVE" ? "active" : "inactive"}`}>
                  {technician.status === "ACTIVE" ? "Active" : "Inactive"}
                </span>
              </div>
            </div>

            <dl className="technician-detail-counts">
              <div>
                <dt>Active Repairs</dt>
                <dd>{technician.activeRepairs}</dd>
              </div>
              <div>
                <dt>Total Assigned</dt>
                <dd>{technician.totalRepairs}</dd>
              </div>
            </dl>
          </section>

          <section className="page-content technician-detail-workload" aria-labelledby="technician-workload-title">
            <h3 id="technician-workload-title">Workload Summary</h3>
            <dl className="technician-detail-status-counts">
              {activeStatuses.map(([status, label]) => (
                <div key={status}>
                  <dt>{label}</dt>
                  <dd>{details.statusCounts[status] ?? 0}</dd>
                </div>
              ))}
            </dl>
          </section>

          <TechnicianRepairPanel
            activeRepairs={details.activeRepairs}
            repairHistory={details.repairHistory}
            canViewRepairs={canViewRepairs}
            onRepairClick={handleRepairClick}
          />
        </>
      )}
    </>
  );
}

export default TechnicianDetailsPage;
