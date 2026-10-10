import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";

import { getTechnicians } from "../../../api/technicianApi.js";
import { hasAccess } from "../../../config/accessControl.js";
import { useAuth } from "../../auth/context/AuthContext.jsx";

import TechnicianTable from "../components/TechnicianTable.jsx";

import "../technicians.css";

function TechnicianPage() {
  const { user } = useAuth();

  const accountKey = JSON.stringify([
    user?.id,
    [...(user?.roles ?? [])].sort(),
  ]);

  return <TechnicianList key={accountKey} user={user} />;
}

function TechnicianList({ user }) {
  const navigate = useNavigate();

  const [technicians, setTechnicians] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadCount, setReloadCount] = useState(0);

  const canView = hasAccess(user?.roles ?? [], "technicians");

  useEffect(() => {
    if (!canView) {
      return;
    }

    const controller = new AbortController();

    setLoading(true);
    setError("");
    setTechnicians([]);

    async function loadTechnicians() {
      try {
        const result = await getTechnicians({
          signal: controller.signal,
        });

        if (
          !Array.isArray(result) ||
          !result.every(
            (technician) =>
              technician?.id != null &&
              typeof technician.name === "string" &&
              ["ACTIVE", "INACTIVE"].includes(technician.status) &&
              Number.isInteger(technician.activeRepairs) &&
              technician.activeRepairs >= 0 &&
              Number.isInteger(technician.totalRepairs) &&
              technician.totalRepairs >= technician.activeRepairs,
          )
        ) {
          throw new Error("The server returned invalid technician data.");
        }

        if (!controller.signal.aborted) {
          setTechnicians(result);
        }
      } catch (requestError) {
        if (!controller.signal.aborted) {
          setError(requestError?.message || "Technicians could not be loaded.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadTechnicians();

    return () => controller.abort();
  }, [canView, reloadCount]);

  const search = searchTerm.trim().toLowerCase();

  const filteredTechnicians = technicians.filter((technician) => {
    const status = technician.status.toLowerCase();

    // Exact status matching prevents "active" from also matching "inactive".
    if (search === "active" || search === "inactive") {
      return status === search;
    }

    return (
      technician.name.toLowerCase().includes(search) || status.includes(search)
    );
  });

  function handleTechnicianClick(technicianId) {
    if (canView) {
      navigate(`/technicians/${technicianId}`);
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

  return (
    <>
      <section className="page-header">
        <h2>Technicians</h2>
        <p>View technician workload and assigned repair jobs.</p>
      </section>

      <section className="page-content" aria-busy={loading}>
        <div className="technician-toolbar">
          <div className="technician-search">
            <Search size={18} />

            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search technicians..."
              aria-label="Search technicians by name or status"
              disabled={loading || Boolean(error)}
            />
          </div>
        </div>

        {loading && (
          <div className="workspace-empty-state" role="status">
            <p>Loading technicians...</p>
          </div>
        )}

        {!loading && error && (
          <>
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
          </>
        )}

        {!loading &&
          !error &&
          (filteredTechnicians.length > 0 ? (
            <TechnicianTable
              technicians={filteredTechnicians}
              onTechnicianClick={handleTechnicianClick}
            />
          ) : (
            <div className="workspace-empty-state">
              <strong>
                {technicians.length === 0
                  ? "No technician accounts"
                  : "No matching technicians"}
              </strong>

              <p>
                {technicians.length === 0
                  ? "Staff accounts with the Technician role will appear here."
                  : "Try another technician name or status."}
              </p>
            </div>
          ))}
      </section>
    </>
  );
}

export default TechnicianPage;
