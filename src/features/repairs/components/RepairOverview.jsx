import { useEffect, useRef, useState } from "react";

import { hasAccess } from "../../../config/accessControl.js";

import {
  problemCategoryOptions,
  getProblemCategoryLabel,
  isValidProblemCategory,
} from "../problemCategories.js";

const serviceLabels = {
  DIAGNOSTIC: "Diagnostic",
  HARDWARE_REPAIR: "Hardware Repair",
  SOFTWARE_REPAIR: "Software Repair",
  MAINTENANCE: "Maintenance / Cleaning",
  OTHER: "Other",
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

function RepairOverview({
  repair,
  estimatedCost,
  agreedPrice,
  staffName = (staffId) =>
    staffId == null ? "Not recorded" : `Staff #${staffId}`,
  currentRoles = [],
  onUpdateProblemCategory,
  categorySaving = false,
  disabled = false,
  categoryBlocked = false,
  categoryError = "",
  categoryMessage = "",
}) {
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [localError, setLocalError] = useState("");
  const [localBlocked, setLocalBlocked] = useState(false);

  const submittingRef = useRef(false);

  const closed = ["COMPLETED", "CANCELLED"].includes(repair.status);

  const canEditCategory =
    Boolean(repair.status) &&
    !closed &&
    hasAccess(currentRoles, "technicalFindings") &&
    typeof onUpdateProblemCategory === "function";

  const controlsDisabled =
    disabled || categorySaving || categoryBlocked || localBlocked;

  useEffect(() => {
    setCategoryFormOpen(false);
    setSelectedCategory("");
    setLocalError("");
    setLocalBlocked(false);
  }, [repair.id]);

  useEffect(() => {
    if (!canEditCategory) {
      setCategoryFormOpen(false);
      setSelectedCategory("");
      setLocalError("");
    }
  }, [canEditCategory]);

  function handleCategoryToggle() {
    if (!canEditCategory || controlsDisabled || submittingRef.current) {
      return;
    }

    setSelectedCategory(
      isValidProblemCategory(repair.problemCategory)
        ? repair.problemCategory
        : "",
    );
    setLocalError("");
    setCategoryFormOpen((open) => !open);
  }

  function handleCategoryCancel() {
    if (categorySaving || submittingRef.current) {
      return;
    }

    setCategoryFormOpen(false);
    setSelectedCategory("");
    setLocalError("");
  }

  async function handleCategorySubmit(event) {
    event.preventDefault();

    if (!canEditCategory || controlsDisabled || submittingRef.current) {
      return;
    }

    setLocalError("");

    if (!isValidProblemCategory(selectedCategory)) {
      setLocalError("Select a problem category.");
      return;
    }

    if (selectedCategory === repair.problemCategory) {
      setCategoryFormOpen(false);
      return;
    }

    submittingRef.current = true;

    try {
      const saved = await onUpdateProblemCategory({
        problemCategory: selectedCategory,
      });

      if (saved === true) {
        setCategoryFormOpen(false);
        setSelectedCategory("");
        setLocalError("");
      }
    } catch {
      setLocalBlocked(true);
      setLocalError(
        "The category may have been saved. Reload the page and check it before trying again.",
      );
    } finally {
      submittingRef.current = false;
    }
  }

  const fields = [
    ["Reported Problem", repair.reportedProblem],
    ["Service Type", serviceLabels[repair.serviceType] ?? repair.serviceType],
    ["Estimated Cost", formatMoney(estimatedCost, "Not estimated")],
    ["Agreed Price", formatMoney(agreedPrice, "Not recorded")],
    ["Accessories Received", repair.accessoriesReceived || "None recorded"],
    ["Intake Notes", repair.intakeNotes || "None recorded"],
    ["Created By", staffName(repair.createdById)],
    ["Created At", formatTimestamp(repair.createdAt)],
    ["Updated At", formatTimestamp(repair.updatedAt)],
    ["Tracking Code", repair.trackingCode],
  ];

  const displayedError = localError || categoryError;

  return (
    <>
      <section className="page-content repair-overview">
        <h3>Repair Overview</h3>

        <div className="repair-overview-grid">
          {fields.map(([label, value]) => (
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

      <section className="page-content repair-overview repair-category-section">
        <div className="workspace-section-header">
          <div>
            <h3>Problem Category</h3>

            <p className="workspace-section-description">
              The primary problem recorded for this repair helps identify
              similar problems across this device’s repair visits.
            </p>
          </div>

          {canEditCategory && (
            <button
              className="secondary-repair-button"
              type="button"
              onClick={handleCategoryToggle}
              disabled={controlsDisabled}
              aria-expanded={categoryFormOpen}
            >
              {repair.problemCategory == null
                ? "Set Category"
                : "Update Category"}
            </button>
          )}
        </div>

        {displayedError && (
          <div className="customer-form-error" role="alert">
            {displayedError}
          </div>
        )}

        {categoryMessage && (
          <div className="repair-success-message" role="status">
            {categoryMessage}
          </div>
        )}

        <div className="repair-overview-grid">
          <div>
            <span>Current Category</span>
            <strong>{getProblemCategoryLabel(repair.problemCategory)}</strong>
          </div>
        </div>

        {categoryFormOpen && canEditCategory && (
          <form
            className="repair-form"
            onSubmit={handleCategorySubmit}
            aria-busy={categorySaving}
          >
            <div className="repair-form-grid">
              <div className="repair-form-group">
                <select
                  id="overview-problem-category"
                  aria-label="Problem Category"
                  value={selectedCategory}
                  onChange={(event) => {
                    setSelectedCategory(event.target.value);
                    setLocalError("");
                  }}
                  disabled={controlsDisabled}
                  required
                >
                  <option value="">Select problem category</option>

                  {problemCategoryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="finding-form-actions">
              <button
                className="cancel-repair-button"
                type="button"
                onClick={handleCategoryCancel}
                disabled={categorySaving}
              >
                Cancel
              </button>

              <button
                className="create-repair-button"
                type="submit"
                disabled={
                  controlsDisabled ||
                  !isValidProblemCategory(selectedCategory) ||
                  selectedCategory === repair.problemCategory
                }
              >
                {categorySaving ? "Saving..." : "Save Category"}
              </button>
            </div>
          </form>
        )}
      </section>
    </>
  );
}

export default RepairOverview;
