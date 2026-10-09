import { useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";

import { hasAccess } from "../../../config/accessControl.js";

const MONEY_PATTERN = /^\d{1,10}(?:\.\d{1,2})?$/;

function toCents(value) {
  if (value == null || value === "") return null;

  const text = String(value).trim();

  if (!MONEY_PATTERN.test(text)) return null;

  const [whole, fraction = ""] = text.split(".");

  return BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0"));
}

function formatCents(cents) {
  if (cents == null) return "—";

  const whole = (cents / 100n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  const fraction = (cents % 100n).toString().padStart(2, "0");

  return `₱${whole}.${fraction}`;
}

function formatMoney(value) {
  return formatCents(toCents(value));
}

function getSubtotalCents(part) {
  const unitCents = toCents(part.unitCost);
  const quantity = Number(part.quantity);

  if (unitCents == null || !Number.isSafeInteger(quantity) || quantity < 1) {
    return null;
  }

  return unitCents * BigInt(quantity);
}

function RepairPartsCosts({
  currentRoles = [],
  repairId,
  currentStatus,
  parts = [],
  estimatedCost,
  agreedPrice,
  onCreatePart,
  onUpdateEstimate,
  onUpdateAgreedPrice,
  saving = false,
  disabled = false,
  blocked = false,
  error = "",
  message = "",
  suggestedPart = "",
  onSuggestionHandled,
}) {
  const closed = ["COMPLETED", "CANCELLED"].includes(currentStatus);
  const repairOpen = Boolean(currentStatus) && !closed;

  const canEditEstimatedCost =
    repairOpen &&
    hasAccess(currentRoles, "editEstimatedCost") &&
    typeof onUpdateEstimate === "function";

  const canEditPartsCosts =
    repairOpen &&
    hasAccess(currentRoles, "editPartsCosts") &&
    typeof onCreatePart === "function";

  const canEditAgreedPrice =
    repairOpen &&
    hasAccess(currentRoles, "editAgreedPrice") &&
    typeof onUpdateAgreedPrice === "function";

  const [partFormOpen, setPartFormOpen] = useState(false);
  const [partName, setPartName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unitCost, setUnitCost] = useState("");

  const [estimateFormOpen, setEstimateFormOpen] = useState(false);
  const [estimateInput, setEstimateInput] = useState("");

  const [priceFormOpen, setPriceFormOpen] = useState(false);
  const [priceInput, setPriceInput] = useState("");

  const [localError, setLocalError] = useState("");
  const [localBlocked, setLocalBlocked] = useState(false);

  const submittingRef = useRef(false);

  const controlsDisabled = saving || disabled || blocked || localBlocked;

  useEffect(() => {
    setPartFormOpen(false);
    setPartName("");
    setQuantity("1");
    setUnitCost("");

    setEstimateFormOpen(false);
    setEstimateInput("");

    setPriceFormOpen(false);
    setPriceInput("");

    setLocalError("");
    setLocalBlocked(false);
  }, [repairId]);

  useEffect(() => {
    if (!suggestedPart) return;

    if (!canEditPartsCosts || controlsDisabled) {
      setLocalError(
        "An AI part suggestion cannot be applied while this form is unavailable.",
      );
      onSuggestionHandled?.();
      return;
    }

    const hasExistingDraft =
      partFormOpen ||
      estimateFormOpen ||
      priceFormOpen ||
      partName.trim().length > 0 ||
      unitCost.trim().length > 0 ||
      String(quantity).trim() !== "1";

    if (hasExistingDraft) {
      setLocalError(
        "Your current Parts & Costs draft was kept. Save or cancel the open form before using an AI part suggestion.",
      );
      onSuggestionHandled?.();
      return;
    }

    const suggestedName = suggestedPart.trim();

    if (!suggestedName || suggestedName.length > 150) {
      setLocalError(
        "The suggested part name must contain 1 to 150 characters.",
      );
      onSuggestionHandled?.();
      return;
    }

    setPartName(suggestedName);
    setQuantity("1");
    setUnitCost("");
    setPartFormOpen(true);
    setEstimateFormOpen(false);
    setPriceFormOpen(false);
    setLocalError("");

    onSuggestionHandled?.();
  }, [
    suggestedPart,
    canEditPartsCosts,
    controlsDisabled,
    partFormOpen,
    estimateFormOpen,
    priceFormOpen,
    partName,
    quantity,
    unitCost,
    onSuggestionHandled,
  ]);

  const subtotals = parts.map(getSubtotalCents);

  const partsTotal = subtotals.some((value) => value == null)
    ? null
    : subtotals.reduce((total, value) => total + value, 0n);

  function resetPartForm() {
    setPartName("");
    setQuantity("1");
    setUnitCost("");
  }

  function handlePartCancel() {
    if (saving || submittingRef.current) return;

    resetPartForm();
    setPartFormOpen(false);
    setLocalError("");
    onSuggestionHandled?.();
  }

  function handlePartFormToggle() {
    if (!canEditPartsCosts || controlsDisabled || submittingRef.current) {
      return;
    }

    if (partFormOpen) {
      handlePartCancel();
      return;
    }

    resetPartForm();
    setLocalError("");
    setPartFormOpen(true);
    setEstimateFormOpen(false);
    setPriceFormOpen(false);
  }

  function handleEstimateFormToggle() {
    if (!canEditEstimatedCost || controlsDisabled || submittingRef.current) {
      return;
    }

    setEstimateInput(estimatedCost != null ? String(estimatedCost) : "");

    setLocalError("");
    setEstimateFormOpen((open) => !open);
    setPriceFormOpen(false);
    setPartFormOpen(false);
  }

  function handlePriceFormToggle() {
    if (!canEditAgreedPrice || controlsDisabled || submittingRef.current) {
      return;
    }

    setPriceInput(agreedPrice != null ? String(agreedPrice) : "");

    setLocalError("");
    setPriceFormOpen((open) => !open);
    setEstimateFormOpen(false);
    setPartFormOpen(false);
  }

  async function submitAction(callback, data) {
    if (submittingRef.current || controlsDisabled) {
      return false;
    }

    submittingRef.current = true;
    setLocalError("");

    try {
      return (await callback(data)) === true;
    } catch {
      setLocalBlocked(true);
      setLocalError(
        "The save could not be confirmed. Reload the page and check the records before trying again.",
      );
      return false;
    } finally {
      submittingRef.current = false;
    }
  }

  async function handlePartSubmit(event) {
    event.preventDefault();

    if (!canEditPartsCosts || controlsDisabled || submittingRef.current) {
      return;
    }

    const trimmedName = partName.trim();
    const quantityText = String(quantity).trim();
    const parsedQuantity = Number(quantityText);
    const costText = unitCost.trim();

    if (!trimmedName || trimmedName.length > 150) {
      setLocalError("Enter a part name of 1 to 150 characters.");
      return;
    }

    if (
      !/^\d+$/.test(quantityText) ||
      !Number.isInteger(parsedQuantity) ||
      parsedQuantity < 1 ||
      parsedQuantity > 2147483647
    ) {
      setLocalError("Quantity must be a whole number from 1 to 2147483647.");
      return;
    }

    if (!MONEY_PATTERN.test(costText)) {
      setLocalError(
        "Enter a non-negative unit cost with at most 10 whole-number digits and 2 decimal places.",
      );
      return;
    }

    const saved = await submitAction(onCreatePart, {
      partName: trimmedName,
      quantity: parsedQuantity,
      unitCost: costText,
    });

    if (saved) {
      resetPartForm();
      setPartFormOpen(false);
      onSuggestionHandled?.();
    }
  }

  async function handleEstimateSubmit(event) {
    event.preventDefault();

    if (!canEditEstimatedCost || controlsDisabled || submittingRef.current) {
      return;
    }

    const amount = estimateInput.trim();

    if (!MONEY_PATTERN.test(amount)) {
      setLocalError(
        "Enter a non-negative estimate with at most 10 whole-number digits and 2 decimal places.",
      );
      return;
    }

    const saved = await submitAction(onUpdateEstimate, {
      estimatedCost: amount,
    });

    if (saved) {
      setEstimateFormOpen(false);
    }
  }

  async function handlePriceSubmit(event) {
    event.preventDefault();

    if (!canEditAgreedPrice || controlsDisabled || submittingRef.current) {
      return;
    }

    const amount = priceInput.trim();

    if (!MONEY_PATTERN.test(amount)) {
      setLocalError(
        "Enter a non-negative agreed price with at most 10 whole-number digits and 2 decimal places.",
      );
      return;
    }

    const saved = await submitAction(onUpdateAgreedPrice, {
      agreedPrice: amount,
    });

    if (saved) {
      setPriceFormOpen(false);
    }
  }

  const displayedError = error || localError;
  const cancelLabel = blocked || localBlocked ? "Close" : "Cancel";

  return (
    <section className="page-content repair-parts-costs">
      <div className="workspace-section-header">
        <div>
          <h3>Parts & Costs</h3>

          <p className="workspace-section-description">
            Review repair pricing, customer agreement, and parts used for this
            repair.
          </p>
        </div>
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

      <div className="price-agreement-section">
        <div className="price-agreement-header">
          <div>
            <h4>Price Agreement</h4>

            <p>Review the estimated cost and customer-approved repair price.</p>
          </div>

          {canEditAgreedPrice && (
            <button
              className="secondary-repair-button"
              type="button"
              onClick={handlePriceFormToggle}
              disabled={controlsDisabled}
              aria-expanded={priceFormOpen}
            >
              {agreedPrice != null ? "Update Agreement" : "Record Agreement"}
            </button>
          )}
        </div>

        <div className="price-summary">
          <div>
            <span>Estimated Cost</span>

            <strong>
              {estimatedCost != null
                ? formatMoney(estimatedCost)
                : "Not estimated"}
            </strong>

            {canEditEstimatedCost && (
              <button
                className="inline-cost-button"
                type="button"
                onClick={handleEstimateFormToggle}
                disabled={controlsDisabled}
                aria-expanded={estimateFormOpen}
              >
                {estimatedCost != null ? "Update Estimate" : "Set Estimate"}
              </button>
            )}
          </div>

          <div>
            <span>Agreed Price</span>

            <strong>
              {agreedPrice != null
                ? formatMoney(agreedPrice)
                : "Awaiting customer approval"}
            </strong>
          </div>

          <div>
            <span>Agreement Status</span>

            <strong>{agreedPrice != null ? "Approved" : "Pending"}</strong>
          </div>
        </div>

        {estimateFormOpen && canEditEstimatedCost && (
          <form
            className="price-agreement-form"
            onSubmit={handleEstimateSubmit}
            aria-busy={saving}
          >
            <div className="repair-form-group">
              <label htmlFor="estimated-cost-workspace">
                Estimated Repair Cost
              </label>

              <input
                id="estimated-cost-workspace"
                type="number"
                min="0"
                max="9999999999.99"
                step="0.01"
                value={estimateInput}
                onChange={(event) => setEstimateInput(event.target.value)}
                placeholder="0.00"
                disabled={controlsDisabled}
                required
              />
            </div>

            <div className="finding-form-actions">
              <button
                className="cancel-repair-button"
                type="button"
                disabled={saving}
                onClick={() => {
                  if (submittingRef.current) return;
                  setEstimateFormOpen(false);
                  setLocalError("");
                }}
              >
                {cancelLabel}
              </button>

              <button
                className="create-repair-button"
                type="submit"
                disabled={controlsDisabled}
              >
                {saving ? "Saving…" : "Save Estimate"}
              </button>
            </div>
          </form>
        )}

        {priceFormOpen && canEditAgreedPrice && (
          <form
            className="price-agreement-form"
            onSubmit={handlePriceSubmit}
            aria-busy={saving}
          >
            <div className="repair-form-group">
              <label htmlFor="agreed-price">Agreed Repair Price</label>

              <input
                id="agreed-price"
                type="number"
                min="0"
                max="9999999999.99"
                step="0.01"
                value={priceInput}
                onChange={(event) => setPriceInput(event.target.value)}
                placeholder="0.00"
                disabled={controlsDisabled}
                required
              />
            </div>

            <div className="finding-form-actions">
              <button
                className="cancel-repair-button"
                type="button"
                disabled={saving}
                onClick={() => {
                  if (submittingRef.current) return;
                  setPriceFormOpen(false);
                  setLocalError("");
                }}
              >
                {cancelLabel}
              </button>

              <button
                className="create-repair-button"
                type="submit"
                disabled={controlsDisabled}
              >
                {saving ? "Saving…" : "Confirm Agreement"}
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="parts-section-header">
        <div>
          <h4>Parts Used</h4>
          <p>Review parts actually used during the repair.</p>
        </div>

        {canEditPartsCosts && (
          <button
            className="secondary-repair-button"
            type="button"
            onClick={handlePartFormToggle}
            disabled={controlsDisabled}
            aria-expanded={partFormOpen}
          >
            <Plus size={18} />
            <span>Add Part</span>
          </button>
        )}
      </div>

      {partFormOpen && canEditPartsCosts && (
        <form
          className="part-form"
          onSubmit={handlePartSubmit}
          aria-busy={saving}
        >
          <div className="repair-form-grid">
            <div className="repair-form-group">
              <label htmlFor="part-name">Part Name</label>

              <input
                id="part-name"
                type="text"
                value={partName}
                onChange={(event) => setPartName(event.target.value)}
                maxLength={150}
                placeholder="e.g. Charging Port"
                disabled={controlsDisabled}
                required
              />
            </div>

            <div className="repair-form-group">
              <label htmlFor="part-quantity">Quantity</label>

              <input
                id="part-quantity"
                type="number"
                min="1"
                max="2147483647"
                step="1"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                disabled={controlsDisabled}
                required
              />
            </div>

            <div className="repair-form-group">
              <label htmlFor="part-unit-cost">Unit Cost</label>

              <input
                id="part-unit-cost"
                type="number"
                min="0"
                max="9999999999.99"
                step="0.01"
                value={unitCost}
                onChange={(event) => setUnitCost(event.target.value)}
                placeholder="0.00"
                disabled={controlsDisabled}
                required
              />
            </div>
          </div>

          <div className="finding-form-actions">
            <button
              className="cancel-repair-button"
              type="button"
              onClick={handlePartCancel}
              disabled={saving}
            >
              {cancelLabel}
            </button>

            <button
              className="create-repair-button"
              type="submit"
              disabled={controlsDisabled || !partName.trim()}
            >
              {saving ? "Saving…" : "Add Part"}
            </button>
          </div>
        </form>
      )}

      {parts.length > 0 ? (
        <>
          <div className="parts-table-wrapper">
            <table className="parts-table">
              <thead>
                <tr>
                  <th>Part</th>
                  <th>Quantity</th>
                  <th>Unit Cost</th>
                  <th>Subtotal</th>
                </tr>
              </thead>

              <tbody>
                {parts.map((part) => (
                  <tr key={part.id}>
                    <td style={{ overflowWrap: "anywhere" }}>{part.name}</td>
                    <td>{part.quantity}</td>
                    <td>{formatMoney(part.unitCost)}</td>
                    <td>{formatCents(getSubtotalCents(part))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="parts-total">
            <span>Parts Total</span>
            <strong>{formatCents(partsTotal)}</strong>
          </div>
        </>
      ) : (
        <div className="workspace-empty-state">
          <strong>No parts recorded</strong>

          <p>
            {canEditPartsCosts
              ? "Add a part when a component is used for this repair."
              : "Parts used for this repair will appear here."}
          </p>
        </div>
      )}
    </section>
  );
}

export default RepairPartsCosts;
