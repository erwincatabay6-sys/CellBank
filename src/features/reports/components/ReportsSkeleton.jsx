import Skeleton from "../../../components/Skeleton.jsx";

function SkeletonSection({ title, children }) {
  return (
    <section className="page-content">
      <div className="report-skeleton-heading">
        <h3>{title}</h3>
        <Skeleton width={380} height={14} />
      </div>

      {children}
    </section>
  );
}

function SkeletonCards({ count, className }) {
  return (
    <div className={className}>
      {Array.from({ length: count }, (_, index) => (
        <div key={index}>
          <Skeleton width="65%" height={12} />
          <Skeleton width="50%" height={24} />
        </div>
      ))}
    </div>
  );
}

function SkeletonChart({ title, payment = false }) {
  return (
    <article
      className={`report-chart-card ${
        payment ? "report-payment-chart-card" : ""
      }`}
    >
      <div className="report-chart-header">
        <h4>{title}</h4>
        <Skeleton width="75%" height={14} />
      </div>

      <div className={payment ? "report-line-chart-wrapper" : undefined}>
        <Skeleton height={220} />
      </div>
    </article>
  );
}

function SkeletonTable({ headings, filters = false }) {
  return (
    <>
      {filters && (
        <div className="report-skeleton-filters">
          <Skeleton width={260} height={40} />
          <Skeleton width={180} height={14} />
        </div>
      )}

      <div className="report-table-wrapper">
        <table className="report-table">
          <thead>
            <tr>
              {headings.map((heading) => (
                <th key={heading}>{heading}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {Array.from({ length: 5 }, (_, rowIndex) => (
              <tr key={rowIndex}>
                {headings.map((heading) => (
                  <td key={heading}>
                    <Skeleton width="80%" height={16} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default function ReportsSkeleton() {
  return (
    <div role="status" aria-label="Loading reports">
      <div aria-hidden="true">
        <SkeletonSection title="Repair Summary">
          <SkeletonCards count={4} className="report-summary-grid" />
        </SkeletonSection>

        <SkeletonSection title="Repair Analytics">
          <div className="report-chart-grid">
            <SkeletonChart title="Repair Volume Over Time" />
            <SkeletonChart title="Repairs by Status" />
          </div>
        </SkeletonSection>

        <SkeletonSection title="Financial Summary">
          <SkeletonCards count={3} className="financial-summary-grid" />
          <SkeletonCards count={4} className="financial-status-grid" />
          <SkeletonChart title="Payments Received Over Time" payment />
        </SkeletonSection>

        <SkeletonSection title="Financial Records">
          <SkeletonTable
            filters
            headings={[
              "Reference",
              "Customer",
              "Agreed Price",
              "Total Paid",
              "Balance",
              "Payment Status",
            ]}
          />
        </SkeletonSection>

        <SkeletonSection title="Technician Repair Activity">
          <SkeletonTable
            headings={["Technician", "Repairs Handled", "Active", "Completed"]}
          />
        </SkeletonSection>

        <SkeletonSection title="Detailed Repair Records">
          <SkeletonTable
            filters
            headings={[
              "Reference",
              "Date Received",
              "Customer",
              "Device",
              "Technician",
              "Status",
            ]}
          />
        </SkeletonSection>
      </div>
    </div>
  );
}
