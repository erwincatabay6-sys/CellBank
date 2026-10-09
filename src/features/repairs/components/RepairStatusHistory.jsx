import { useEffect, useRef, useState } from "react";

import StatusBadge from "../../../components/StatusBadge.jsx";

import {
  canChangeRepairStatus,
  canTransitionRepairStatus,
} from "../../../config/accessControl.js";

const repairStatuses = [
  { value: "RECEIVED", label: "Received" },
  { value: "AWAITING_APPROVAL", label: "Awaiting Approval" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "AWAITING_PARTS", label: "Awaiting Parts" },
  { value: "READY_FOR_RELEASE", label: "Ready for Release" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

function formatTimestamp(value) {
  if (!value) return "—";

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

function RepairStatusHistory({
  repairId,
  history = [],
  staffName = (id) => (id == null ? "Unknown staff" : `Staff #${id}`),
  currentRoles = [],
  currentStatus,
  onSubmitStatus,
  saving = false,
  disabled = false,
  blocked = false,
  error = "",
  message = "",
  suggestedStatus = "",
  onSuggestionHandled,
}) {
  const [status, setStatus] = useState("");
  const [note, setNote] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [localError, setLocalError] = useState("");

  const submittingRef = useRef(false);

  useEffect(() => {
    setStatus("");
    setNote("");
    setFormOpen(false);
    setLocalError("");
  }, [repairId]);

  const allowedStatuses = repairStatuses.filter(
    (option) =>
      canTransitionRepairStatus(currentStatus, option.value) &&
      canChangeRepairStatus(currentRoles, option.value),
  );

  const canChangeStatus =
    allowedStatuses.length > 0 && typeof onSubmitStatus === "function";

  const selectedStatusAllowed = allowedStatuses.some(
    (option) => option.value === status,
  );

  const controlsDisabled = saving || disabled || blocked;

  useEffect(() => {
    if (!suggestedStatus) return;

    const suggestionAllowed =
      canTransitionRepairStatus(currentStatus, suggestedStatus) &&
      canChangeRepairStatus(currentRoles, suggestedStatus);

    if (!canChangeStatus || controlsDisabled || !suggestionAllowed) {
      setLocalError(
        "This AI status suggestion is not currently available for your role or this repair.",
      );
      onSuggestionHandled?.();
      return;
    }

    if (formOpen || status || note.trim()) {
      setLocalError(
        "Your current status draft was kept. Confirm or cancel it before using an AI status suggestion.",
      );
      onSuggestionHandled?.();
      return;
    }

    setStatus(suggestedStatus);
    setNote("");
    setFormOpen(true);
    setLocalError("");

    onSuggestionHandled?.();
  }, [
    suggestedStatus,
    currentStatus,
    currentRoles,
    canChangeStatus,
    controlsDisabled,
    formOpen,
    status,
    note,
    onSuggestionHandled,
  ]);

  const newestFirst = [...history].sort(
    (a, b) =>
      new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime() ||
      b.id - a.id,
  );

  function resetForm() {
    setStatus("");
    setNote("");
    setLocalError("");
  }

  function handleFormToggle() {
    if (!canChangeStatus || controlsDisabled || submittingRef.current) {
      return;
    }

    resetForm();
    setFormOpen((open) => !open);
  }

  function handleCancel() {
    if (saving || submittingRef.current) return;

    resetForm();
    setFormOpen(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (
      submittingRef.current ||
      controlsDisabled ||
      !canChangeStatus ||
      !selectedStatusAllowed
    ) {
      return;
    }

    setLocalError("");
    submittingRef.current = true;

    try {
      const saved = await onSubmitStatus({
        status,
        note: note.trim() || null,
      });

      if (saved === true) {
        resetForm();
        setFormOpen(false);
      }
    } catch {
      setLocalError(
        "The status update could not be confirmed. Reload the page before trying again.",
      );
    } finally {
      submittingRef.current = false;
    }
  }

  const displayedError = error || localError;

  return (
    <section className="page-content">
      <div className="workspace-section-header">
        <div>
          <h3>Status History</h3>

          <p className="workspace-section-description">
            Review repair progress and record approved status changes.
          </p>
        </div>

        {canChangeStatus && (
          <button
            className="secondary-repair-button"
            type="button"
            onClick={handleFormToggle}
            disabled={controlsDisabled}
            aria-expanded={formOpen}
          >
            Change Status
          </button>
        )}
      </div>

      {displayedError && (
        <div
          className="customer-form-error"
          role="alert"
          style={{ marginBottom: "16px" }}
        >
          {displayedError}
        </div>
      )}

      {message && (
        <div className="repair-success-message" role="status">
          {message}
        </div>
      )}

      {formOpen && canChangeStatus && (
        <form
          className="status-change-form"
          onSubmit={handleSubmit}
          aria-busy={saving}
        >
          <div className="repair-form-group">
            <label>Current Status</label>

            <div>
              <StatusBadge status={currentStatus} />
            </div>
          </div>

          <div className="repair-form-group">
            <label htmlFor="repair-status">New Status</label>

            <select
              id="repair-status"
              value={selectedStatusAllowed ? status : ""}
              onChange={(event) => setStatus(event.target.value)}
              disabled={controlsDisabled}
              required
            >
              <option value="">Select status</option>

              {allowedStatuses.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="repair-form-group">
            <label htmlFor="status-note">Status Note</label>

            <textarea
              id="status-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows="3"
              maxLength={2000}
              placeholder="Optional reason or status note"
              disabled={controlsDisabled}
            />
          </div>

          <div className="finding-form-actions">
            <button
              className="cancel-repair-button"
              type="button"
              onClick={handleCancel}
              disabled={saving}
            >
              {blocked ? "Close" : "Cancel"}
            </button>

            <button
              className="create-repair-button"
              type="submit"
              disabled={controlsDisabled || !selectedStatusAllowed}
            >
              {saving ? "Saving…" : "Confirm Status Change"}
            </button>
          </div>
        </form>
      )}

      {history.length > 0 ? (
        <div className="status-history-list">
          {newestFirst.map((entry) => (
            <article key={entry.id} className="status-history-item">
              <div className="status-history-top">
                <StatusBadge status={entry.newStatus} />

                <span>{formatTimestamp(entry.changedAt)}</span>
              </div>

              <p>
                Changed by{" "}
                <strong>
                  {entry.changedByName || staffName(entry.changedById)}
                </strong>
              </p>

              {entry.note && (
                <p
                  style={{
                    whiteSpace: "pre-wrap",
                    overflowWrap: "anywhere",
                  }}
                >
                  {entry.note}
                </p>
              )}
            </article>
          ))}
        </div>
      ) : (
        <div className="workspace-empty-state">
          <strong>No status history</strong>

          <p>Status changes for this repair will appear here.</p>
        </div>
      )}
    </section>
  );
}

export default RepairStatusHistory;
