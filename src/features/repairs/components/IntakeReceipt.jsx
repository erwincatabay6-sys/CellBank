import qrcode from "qrcode-generator";

const intakeDateFormatter = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Manila",
});

function TrackingQr({ url }) {
  const qr = qrcode(0, "M");
  qr.addData(url);
  qr.make();

  const size = qr.getModuleCount();
  const border = 4;
  const dimension = size + border * 2;
  const modules = [];

  for (let row = 0; row < size; row++) {
    for (let column = 0; column < size; column++) {
      if (qr.isDark(row, column)) {
        modules.push(`M${column + border} ${row + border}h1v1h-1z`);
      }
    }
  }

  return (
    <svg
      className="intake-receipt-qr"
      viewBox={`0 0 ${dimension} ${dimension}`}
      shapeRendering="crispEdges"
      role="img"
      aria-label="QR code for public repair tracking"
    >
      <rect width={dimension} height={dimension} fill="#fff" />
      <path d={modules.join("")} fill="#000" />
    </svg>
  );
}

export default function IntakeReceipt({ repair, device }) {
  const trackingPage = new URL("/track", window.location.origin);
  const trackingUrl = new URL(trackingPage);
  trackingUrl.searchParams.set("code", repair.trackingCode);

  const intakeDate = new Date(repair.createdAt);
  const details = [
    ["Repair reference", repair.repairReference],
    ["Intake date", repair.createdAt && Number.isFinite(intakeDate.getTime())
      ? intakeDateFormatter.format(intakeDate)
      : null],
    ["Device", [device?.brand, device?.model].filter(Boolean).join(" ")],
    ["Reported problem", repair.reportedProblem],
  ];

  return (
    <article className="intake-receipt" aria-label="Repair Intake Receipt">
      <header className="intake-receipt-brand">
        <strong>CELLBANK</strong>
        <h4>Repair Intake Receipt</h4>
        <p>Alaminos City</p>
      </header>

      <dl className="intake-receipt-details">
        {details.map(([label, value]) => (
          <div key={label}>
            <dt>{label}:</dt>
            <dd>{value || "Not recorded"}</dd>
          </div>
        ))}
      </dl>

      <div className="intake-receipt-tracking">
        <strong>Tracking code:</strong>
        <code>{repair.trackingCode}</code>
        <TrackingQr url={trackingUrl.href} />
        <strong>Track your repair</strong>
        <p>{trackingPage.href}</p>
        <p className="intake-receipt-reminder">Keep your tracking code private.</p>
      </div>
    </article>
  );
}
