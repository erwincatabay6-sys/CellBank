import { useEffect, useRef, useState } from "react";
import { Ellipsis } from "lucide-react";
import StatusUpdateDetails from "./StatusUpdateDetails.jsx";

import useFeedbackState from "../../../hooks/useFeedbackState.js";
import FeedbackNotice from "../../../components/FeedbackNotice.jsx";

import StatusBadge from "../../../components/StatusBadge.jsx";

import {
  canChangeRepairStatus,
  canTransitionRepairStatus,
} from "../../../config/accessControl.js";
import LoadingSpinner from "../../../components/LoadingSpinner.jsx";

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
  feedbackVersion,
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
  const [selection, setSelection] = useState(null);
  const selectedEntry = selection?.repairId === repairId
    ? history.find((entry) => entry.id === selection.id)
    : null;
  const [status, setStatus] = useState("");
  const [note, setNote] = useState("");
  const [customerUpdate, setCustomerUpdate] = useState("");
  const customerUpdateRef = useRef(null);
  const customerUpdateTooLong = customerUpdate.length > 2000;
  const [formOpen, setFormOpen] = useState(false);
  const [localError, setLocalError, localErrorVersion] = useFeedbackState("");

  const submittingRef = useRef(false);

  useEffect(() => {
    setStatus("");
    setNote("");
    setCustomerUpdate("");
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

    if (formOpen || status || note.trim() || customerUpdate.trim()) {
      setLocalError(
        "Your current status draft was kept. Confirm or cancel it before using an AI status suggestion.",
      );
      onSuggestionHandled?.();
      return;
    }

    setStatus(suggestedStatus);
    setNote("");
    setCustomerUpdate("");
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
    customerUpdate,
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
    setCustomerUpdate("");
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

    if (customerUpdateTooLong) {
      customerUpdateRef.current?.focus();
      return;
    }

    setLocalError("");
    submittingRef.current = true;

    try {
      const saved = await onSubmitStatus({
        status,
        note: note.trim() || null,
        customerUpdate: customerUpdate.trim() || null,
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
        <FeedbackNotice
          variant={blocked ? "warning" : "error"}
          title="Unable to update repair status"
          className="customer-form-error"
          role="alert"
          style={{ marginBottom: "16px" }}
          resetKey={[displayedError, feedbackVersion, localErrorVersion]}
        >
          {displayedError}
        </FeedbackNotice>
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
            <label htmlFor="status-note">Internal note</label>

            <textarea
              id="status-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows="3"
              maxLength={2000}
              placeholder="Optional internal reason or note"
              aria-describedby="status-note-help"
              disabled={controlsDisabled}
            />
            <small id="status-note-help">Visible only to authorized staff.</small>
          </div>

          <div className="repair-form-group">
            <label htmlFor="status-customer-update">Customer update</label>
            <textarea
              ref={customerUpdateRef}
              id="status-customer-update"
              value={customerUpdate}
              onChange={(event) => setCustomerUpdate(event.target.value)}
              rows="3"
              maxLength={2000}
              disabled={controlsDisabled}
              aria-invalid={customerUpdateTooLong}
              aria-describedby={`status-customer-update-help${customerUpdateTooLong ? " status-customer-update-error" : ""}`}
            />
            <small id="status-customer-update-help">
              Visible on the customer tracking page. Included in the email when the device is marked Ready for Release.
            </small>
            {customerUpdateTooLong && (
              <p id="status-customer-update-error" className="feedback-field-error" role="alert">
                Customer update must not exceed 2000 characters.
              </p>
            )}
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
              {saving && <LoadingSpinner size={16} />}
              <span>{saving ? "Saving..." : "Confirm Status Change"}</span>
            </button>
          </div>
        </form>
      )}

      {history.length > 0 ? (
        <div className="status-history-list" role="region" aria-label="Repair status history" tabIndex={0}>
          {newestFirst.map((entry) => (
            <article key={entry.id} className="status-history-item">
              <div className="status-history-top">
                <StatusBadge status={entry.newStatus} />

                <span>{formatTimestamp(entry.changedAt)}</span>
              </div>

              <div className="status-history-metadata">
                <p><strong>Changed by:</strong>{" "}{entry.changedByName || staffName(entry.changedById)}</p>
                {[entry.note, entry.customerUpdate].some(
                  (value) => typeof value === "string" && value.trim(),
                ) && (
                  <button
                    type="button"
                    className="modal-close-button status-history-details-button"
                    aria-label={`View status update details: ${entry.newStatus.replaceAll("_", " ")}, ${formatTimestamp(entry.changedAt)}`}
                    aria-haspopup="dialog"
                    onClick={() => setSelection({ repairId, id: entry.id })}
                  >
                    <Ellipsis size={20} aria-hidden="true" />
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="workspace-empty-state">
          <strong>No status history</strong>

          <p>Status changes for this repair will appear here.</p>
        </div>
      )}
      {selectedEntry && (
        <StatusUpdateDetails
          entry={selectedEntry}
          changedBy={selectedEntry.changedByName || staffName(selectedEntry.changedById)}
          timestamp={formatTimestamp(selectedEntry.changedAt)}
          onClose={() => setSelection(null)}
        />
      )}
    </section>
  );
}

export default RepairStatusHistory;
