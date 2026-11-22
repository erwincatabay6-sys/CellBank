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

function SkeletonChart({ title }) {
  return (
    <article className="report-chart-card">
      <div className="report-chart-header">
        <h3>{title}</h3>
        <Skeleton width="75%" height={14} />
      </div>
      <Skeleton height={205} />
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

const headingsByTab = {
  repairs: ["Reference", "Date Received", "Customer", "Device", "Technician", "Status"],
  financial: ["Reference", "Customer", "Agreed Price", "Total Paid", "Balance", "Payment Status"],
  technicians: ["Technician", "Repairs Handled", "Active", "Completed"],
};

export default function ReportsSkeleton({ activeTab = "repairs" }) {
  return (
    <div role="status" aria-label="Loading reports">
      <div aria-hidden="true">
        <SkeletonCards count={4} className="report-summary-strip" />

        <div className="report-chart-grid">
          <SkeletonChart title="Repair Volume Over Time" />
          <SkeletonChart title="Repairs by Status" />
        </div>

        <SkeletonSection title="Report details">
          <SkeletonTable filters={activeTab !== "technicians"} headings={headingsByTab[activeTab]} />
        </SkeletonSection>
      </div>
    </div>
  );
}
