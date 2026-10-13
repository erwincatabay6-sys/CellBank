import Skeleton from "../../../components/Skeleton.jsx";

function SkeletonSection({ title, children }) {
  return (
    <section className="page-content">
      <div className="workspace-section-header">
        <div className="technician-skeleton-heading">
          <h3>{title}</h3>
          <Skeleton width={320} height={14} />
        </div>
      </div>

      {children}
    </section>
  );
}

function SkeletonGrid({ className }) {
  return (
    <div className={className}>
      {Array.from({ length: 5 }, (_, index) => (
        <div key={index}>
          <Skeleton width="65%" height={12} />
          <Skeleton width="80%" height={18} />
        </div>
      ))}
    </div>
  );
}

function SkeletonRepairs() {
  return (
    <div className="technician-repair-list">
      {Array.from({ length: 3 }, (_, rowIndex) => (
        <div
          className="technician-repair-item technician-skeleton-row"
          key={rowIndex}
        >
          {Array.from({ length: 4 }, (_, columnIndex) => (
            <div key={columnIndex}>
              <Skeleton width="60%" height={12} />
              <Skeleton
                width="85%"
                height={columnIndex === 3 ? 24 : 18}
                rounded={columnIndex === 3}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default function TechnicianDetailsSkeleton() {
  return (
    <div role="status" aria-label="Loading technician details">
      <div aria-hidden="true">
        <SkeletonSection title="Technician Information">
          <SkeletonGrid className="technician-info-grid" />
        </SkeletonSection>

        <SkeletonSection title="Workload Summary">
          <SkeletonGrid className="technician-workload-grid" />
        </SkeletonSection>

        <SkeletonSection title="Active Assigned Repairs">
          <SkeletonRepairs />
        </SkeletonSection>

        <SkeletonSection title="Repair History">
          <SkeletonRepairs />
        </SkeletonSection>
      </div>
    </div>
  );
}
