import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import {
  getRepair,
  getRepairStatusHistory,
  getRepairTechnicians,
} from "../../../api/repairApi.js";
import { getCustomer } from "../../../api/customerApi.js";
import { hasAccess } from "../../../config/accessControl.js";
import { useAuth } from "../../auth/context/AuthContext.jsx";
import StatusBadge from "../../../components/StatusBadge.jsx";

import "../../customers/customers.css";
import "../repairs.css";

const workspaceTabs = [
  { id: "overview", label: "Overview" },
  {
    id: "findings",
    label: "Findings",
    permission: "technicalFindings",
  },
  { id: "status-history", label: "Status History" },
  { id: "parts-costs", label: "Parts & Costs" },
  { id: "payments", label: "Payments" },
  {
    id: "ai",
    label: "AI Troubleshooting",
    permission: "aiTroubleshooting",
  },
];

const serviceLabels = {
  DIAGNOSTIC: "Diagnostic",
  HARDWARE_REPAIR: "Hardware Repair",
  SOFTWARE_REPAIR: "Software Repair",
  MAINTENANCE: "Maintenance / Cleaning",
  OTHER: "Other",
};

const pendingMessages = {
  findings: "Recording and viewing technical findings is not available yet.",
  "parts-costs":
    "Managing parts and updating repair costs is not available yet.",
  payments: "Recording and viewing payments is not available yet.",
  ai: "AI troubleshooting assistance is not available yet.",
};

const moneyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
});

function formatMoney(value, fallback) {
  if (value == null) {
    return fallback;
  }

  const amount = Number(value);

  return Number.isFinite(amount)
    ? moneyFormatter.format(amount)
    : "Unavailable";
}

function formatTimestamp(value) {
  if (!value) {
    return "Not recorded";
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? "Unavailable" : date.toLocaleString();
}

function RepairWorkspacePage() {
  const { repairId } = useParams();
  const { user } = useAuth();

  const sessionKey = [
    repairId,
    user?.id ?? "signed-out",
    ...(user?.roles ?? []),
  ].join(":");

  return <RepairWorkspace key={sessionKey} repairId={repairId} user={user} />;
}

function RepairWorkspace({ repairId, user }) {
  const canView = hasAccess(user?.roles, "repairs");
  const canAssign = hasAccess(user?.roles, "assignTechnician");

  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [reloadVersion, setReloadVersion] = useState(0);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (!canView) {
      return;
    }

    if (!/^[1-9]\d*$/.test(repairId ?? "")) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    let active = true;

    async function loadWorkspace() {
      setLoading(true);
      setLoadError("");
      setNotFound(false);

      let repairLoaded = false;

      try {
        const repair = await getRepair(repairId, {
          signal: controller.signal,
        });

        repairLoaded = true;

        if (!repair?.id || !repair.customerId || !repair.status) {
          throw new Error("The server returned invalid repair data.");
        }

        const [customer, history, technicians] = await Promise.all([
          getCustomer(repair.customerId, {
            signal: controller.signal,
          }),
          getRepairStatusHistory(repairId, {
            signal: controller.signal,
          }),
          getRepairTechnicians({
            signal: controller.signal,
          }),
        ]);

        if (
          !Array.isArray(customer?.devices) ||
          !Array.isArray(history) ||
          !Array.isArray(technicians)
        ) {
          throw new Error("The server returned invalid workspace data.");
        }

        const device = customer.devices.find(
          (item) => item.id === repair.deviceId,
        );

        if (!device) {
          throw new Error(
            "The repair's device could not be found under its customer.",
          );
        }

        if (active) {
          setRecord({
            repair,
            customer,
            device,
            history,
            technicians,
          });
        }
      } catch (error) {
        if (active && error.code !== "CANCELLED") {
          if (!repairLoaded && error.status === 404) {
            setRecord(null);
            setNotFound(true);
          } else {
            setLoadError(
              error.status === 403
                ? "You do not have permission to view these records."
                : error.message || "Unable to load the repair workspace.",
            );
          }
        }

        controller.abort();
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadWorkspace();

    return () => {
      active = false;
      controller.abort();
    };
  }, [repairId, canView, reloadVersion]);

  const visibleTabs = workspaceTabs.filter(
    (tab) => !tab.permission || hasAccess(user?.roles, tab.permission),
  );

  function staffName(staffId) {
    if (staffId == null) {
      return "Unassigned";
    }

    if (staffId === user?.id) {
      return user.name || `Staff #${staffId}`;
    }

    return (
      record?.technicians.find((staff) => staff.id === staffId)?.name ??
      `Staff #${staffId}`
    );
  }

  if (!canView) {
    return (
      <section className="page-content">
        <h2>Access denied</h2>
        <p>You do not have permission to view repairs.</p>
      </section>
    );
  }

  const repair = record?.repair;
  const customer = record?.customer;
  const device = record?.device;

  const overviewFields = repair
    ? [
        ["Reported Problem", repair.reportedProblem],
        [
          "Service Type",
          serviceLabels[repair.serviceType] ?? repair.serviceType,
        ],
        ["Priority", repair.priority],
        ["Estimated Cost", formatMoney(repair.estimatedCost, "Not estimated")],
        ["Agreed Price", formatMoney(repair.agreedPrice, "Not recorded")],
        ["Due Date", repair.dueDate || "Not recorded"],
        ["Accessories Received", repair.accessoriesReceived || "None recorded"],
        ["Intake Notes", repair.intakeNotes || "None recorded"],
        ["Created By", staffName(repair.createdById)],
        ["Created At", formatTimestamp(repair.createdAt)],
        ["Updated At", formatTimestamp(repair.updatedAt)],
        ["Tracking Code", repair.trackingCode],
      ]
    : [];

  return (
    <>
      <section className="page-header">
        <h2>{repair?.repairReference ?? "Repair Workspace"}</h2>
        <p>
          {device
            ? `Repair workspace for ${device.brand} ${device.model}.`
            : "View repair information and status history."}
        </p>
      </section>

      {(loadError || notFound || (!record && loading)) && (
        <section className="page-content">
          {loadError && (
            <div className="customer-form-error" role="alert">
              <p>{loadError}</p>

              {record && (
                <p>
                  Previously loaded information is shown and may be out of date.
                </p>
              )}

              <button
                className="secondary-repair-button"
                type="button"
                onClick={() => setReloadVersion((value) => value + 1)}
                disabled={loading}
              >
                Try Again
              </button>
            </div>
          )}

          {!record && loading && (
            <div role="status" aria-label="Loading repair workspace">
              <div className="customer-info-grid" aria-hidden="true">
                {Array.from({ length: 6 }, (_, index) => (
                  <div key={index}>
                    <span className="customer-skeleton-line" />
                    <span className="customer-skeleton-line" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {notFound && !loading && (
            <div className="workspace-empty-state">
              <strong>Repair not found</strong>
              <p>The requested repair record does not exist.</p>
            </div>
          )}
        </section>
      )}

      {record && (
        <>
          <section className="repair-workspace-header">
            <div>
              <span className="workspace-label">Customer</span>
              <strong>{customer.name}</strong>
            </div>

            <div>
              <span className="workspace-label">Device</span>
              <strong>
                {device.brand} {device.model}
              </strong>
            </div>

            <div>
              <span className="workspace-label">Technician</span>
              <strong>{staffName(repair.assignedTechnicianId)}</strong>

              {canAssign && (
                <button
                  className="workspace-reassign-button"
                  type="button"
                  disabled
                  title="Technician reassignment is not available yet."
                >
                  Change Technician
                </button>
              )}
            </div>

            <div>
              <span className="workspace-label">Status</span>
              <StatusBadge status={repair.status} />
            </div>
          </section>

          <nav
            className="repair-workspace-tabs"
            aria-label="Repair workspace sections"
          >
            {visibleTabs.map((tab) => (
              <button
                key={tab.id}
                className={`workspace-tab ${
                  activeTab === tab.id ? "active" : ""
                }`}
                type="button"
                aria-pressed={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {activeTab === "overview" && (
            <section className="page-content repair-overview">
              <h3>Repair Overview</h3>

              <div className="repair-overview-grid">
                {overviewFields.map(([label, value]) => (
                  <div
                    key={label}
                    className={
                      label === "Reported Problem" || label === "Intake Notes"
                        ? "overview-wide"
                        : undefined
                    }
                  >
                    <span>{label}</span>
                    <strong
                      style={{
                        whiteSpace: "pre-wrap",
                        overflowWrap: "anywhere",
                      }}
                    >
                      {value}
                    </strong>
                  </div>
                ))}
              </div>
            </section>
          )}

          {activeTab === "status-history" && (
            <section className="page-content">
              <div className="workspace-section-header">
                <div>
                  <h3>Status History</h3>
                  <p className="workspace-section-description">
                    Saved status changes, oldest first.
                  </p>
                </div>
              </div>

              <p>Status changes are not available yet.</p>

              {record.history.length === 0 ? (
                <div className="workspace-empty-state">
                  <strong>No status history recorded</strong>
                </div>
              ) : (
                <div className="status-history-list">
                  {record.history.map((entry) => (
                    <article key={entry.id} className="status-history-item">
                      <div className="status-history-top">
                        <strong>{staffName(entry.changedById)}</strong>
                        <span>{formatTimestamp(entry.changedAt)}</span>
                      </div>

                      <p>
                        Previous status:{" "}
                        {entry.previousStatus ? (
                          <StatusBadge status={entry.previousStatus} />
                        ) : (
                          "None — initial entry"
                        )}
                      </p>

                      <p>
                        New status: <StatusBadge status={entry.newStatus} />
                      </p>

                      <p style={{ whiteSpace: "pre-wrap" }}>
                        {entry.note || "No note recorded."}
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}

          {pendingMessages[activeTab] && (
            <section className="page-content">
              <h3>{visibleTabs.find((tab) => tab.id === activeTab)?.label}</h3>
              <div className="workspace-empty-state">
                <strong>Not available yet</strong>
                <p>{pendingMessages[activeTab]}</p>
              </div>
            </section>
          )}
        </>
      )}
    </>
  );
}

export default RepairWorkspacePage;
