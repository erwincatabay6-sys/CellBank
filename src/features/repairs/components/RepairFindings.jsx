import { useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";

function formatTimestamp(value) {
  if (!value) return "—";

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

function RepairFindings({
  repairId,
  findings = [],
  currentStatus,
  canAdd = false,
  onSubmitFinding,
  saving = false,
  disabled = false,
  blocked = false,
  error = "",
  message = "",
  aiDraft = "",
  onDraftUsed,
}) {
  const [findingText, setFindingText] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [actionTaken, setActionTaken] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [localError, setLocalError] = useState("");
  const [localBlocked, setLocalBlocked] = useState(false);

  const submittingRef = useRef(false);

  const closed = ["COMPLETED", "CANCELLED"].includes(currentStatus);

  const canRecord =
    canAdd &&
    Boolean(currentStatus) &&
    !closed &&
    typeof onSubmitFinding === "function";

  const controlsDisabled = saving || disabled || blocked || localBlocked;

  useEffect(() => {
    setFindingText("");
    setDiagnosis("");
    setActionTaken("");
    setFormOpen(false);
    setLocalError("");
    setLocalBlocked(false);
  }, [repairId]);

  useEffect(() => {
    if (!aiDraft) return;

    setFindingText(aiDraft);
    setFormOpen(true);
  }, [aiDraft]);

  function resetForm() {
    setFindingText("");
    setDiagnosis("");
    setActionTaken("");
    setLocalError("");
  }

  function handleCancel() {
    if (saving || submittingRef.current) return;

    resetForm();
    setFormOpen(false);
    onDraftUsed?.();
  }

  function handleAddFinding() {
    if (!canRecord || controlsDisabled || submittingRef.current) {
      return;
    }

    if (formOpen) {
      handleCancel();
      return;
    }

    resetForm();
    setFormOpen(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (submittingRef.current || controlsDisabled || !canRecord) {
      return;
    }

    const finding = findingText.trim();
    const trimmedDiagnosis = diagnosis.trim();
    const trimmedAction = actionTaken.trim();

    if (!finding) {
      setLocalError("Enter a finding.");
      return;
    }

    if (
      [finding, trimmedDiagnosis, trimmedAction].some(
        (value) => value.length > 5000,
      )
    ) {
      setLocalError("Each field must not exceed 5000 characters.");
      return;
    }

    setLocalError("");
    submittingRef.current = true;

    let saved = false;

    try {
      saved =
        (await onSubmitFinding({
          finding,
          diagnosis: trimmedDiagnosis || null,
          actionTaken: trimmedAction || null,
        })) === true;
    } catch {
      setLocalBlocked(true);
      setLocalError(
        "The save could not be confirmed. Reload the page and check the findings before trying again.",
      );
    } finally {
      submittingRef.current = false;
    }

    if (saved) {
      resetForm();
      setFormOpen(false);
      onDraftUsed?.();
    }
  }

  const displayedError = error || localError;

  const newestFirst = [...findings].sort(
    (a, b) =>
      new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime() ||
      b.id - a.id,
  );

  const textStyle = {
    whiteSpace: "pre-wrap",
    overflowWrap: "anywhere",
  };

  return (
    <section className="page-content repair-findings">
      <div className="workspace-section-header">
        <div>
          <h3>Findings</h3>

          <p className="workspace-section-description">
            Technician findings recorded during diagnosis and repair.
          </p>
        </div>

        {canRecord && (
          <button
            className="secondary-repair-button"
            type="button"
            onClick={handleAddFinding}
            disabled={controlsDisabled}
            aria-expanded={formOpen}
          >
            <Plus size={18} />
            <span>Add Finding</span>
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

      {localBlocked && error && (
        <p role="alert">
          Reload the page and check the findings before trying again.
        </p>
      )}

      {formOpen && canRecord && (
        <form
          className="finding-form"
          onSubmit={handleSubmit}
          aria-busy={saving}
        >
          <div className="repair-form-group">
            <label htmlFor="finding">Finding</label>

            <textarea
              id="finding"
              value={findingText}
              onChange={(event) => setFindingText(event.target.value)}
              rows="3"
              maxLength={5000}
              placeholder="Record what was observed during inspection"
              disabled={controlsDisabled}
              required
            />
          </div>

          <div className="repair-form-group">
            <label htmlFor="diagnosis">Diagnosis</label>

            <textarea
              id="diagnosis"
              value={diagnosis}
              onChange={(event) => setDiagnosis(event.target.value)}
              rows="3"
              maxLength={5000}
              placeholder="Optional diagnosis"
              disabled={controlsDisabled}
            />
          </div>

          <div className="repair-form-group">
            <label htmlFor="action-taken">Action Taken</label>

            <textarea
              id="action-taken"
              value={actionTaken}
              onChange={(event) => setActionTaken(event.target.value)}
              rows="3"
              maxLength={5000}
              placeholder="Optional inspection, test, or repair action performed"
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
              {blocked || localBlocked ? "Close" : "Cancel"}
            </button>

            <button
              className="create-repair-button"
              type="submit"
              disabled={controlsDisabled || !findingText.trim()}
            >
              {saving ? "Saving…" : "Save Finding"}
            </button>
          </div>
        </form>
      )}

      {findings.length > 0 ? (
        <div className="findings-list">
          {newestFirst.map((entry) => (
            <article key={entry.id} className="finding-item">
              <div className="finding-field">
                <span>Finding</span>
                <p style={textStyle}>{entry.finding}</p>
              </div>

              {entry.diagnosis && (
                <div className="finding-field">
                  <span>Diagnosis</span>
                  <p style={textStyle}>{entry.diagnosis}</p>
                </div>
              )}

              {entry.actionTaken && (
                <div className="finding-field">
                  <span>Action Taken</span>
                  <p style={textStyle}>{entry.actionTaken}</p>
                </div>
              )}

              <div className="finding-meta">
                Recorded by{" "}
                {entry.recordedByName ||
                  (entry.recordedById == null
                    ? "Unknown staff"
                    : `Staff #${entry.recordedById}`)}
                {" • "}
                {formatTimestamp(entry.recordedAt)}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="workspace-empty-state">
          <strong>No findings recorded</strong>

          <p>
            {closed
              ? "No findings were recorded for this repair."
              : "Findings will appear here after they are recorded."}
          </p>
        </div>
      )}
    </section>
  );
}

export default RepairFindings;
