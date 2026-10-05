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
}) {
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

  return (
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
  );
}

export default RepairOverview;
