import Skeleton from "../../../components/Skeleton.jsx";

function SkeletonSection({ children }) {
  return (
    <section className="page-content">
      <div className="dashboard-skeleton-heading">
        <Skeleton width={180} height={22} />
        <Skeleton width={320} height={14} />
      </div>

      {children}
    </section>
  );
}

function SkeletonCards({ count, gridClass, cardClass }) {
  return (
    <div className={gridClass}>
      {Array.from({ length: count }, (_, index) => (
        <div className={cardClass} key={index}>
          <Skeleton width="65%" height={14} />
          <Skeleton width="40%" height={28} />
        </div>
      ))}
    </div>
  );
}

function SkeletonRows({ count = 3 }) {
  return (
    <div className="dashboard-skeleton-list">
      {Array.from({ length: count }, (_, index) => (
        <div className="dashboard-skeleton-row" key={index}>
          <div className="dashboard-skeleton-row-main">
            <Skeleton width="55%" height={16} />
            <Skeleton width="85%" height={14} />
          </div>

          <Skeleton width={110} height={26} rounded />
        </div>
      ))}
    </div>
  );
}

export default function DashboardSkeleton({
  isAdmin = false,
  technicianOnly = false,
}) {
  return (
    <div role="status" aria-label="Loading dashboard">
      <div aria-hidden="true">
        <SkeletonSection>
          <SkeletonCards
            count={4}
            gridClass="dashboard-summary-grid"
            cardClass="dashboard-summary-card"
          />
        </SkeletonSection>

        <SkeletonSection>
          <SkeletonCards
            count={7}
            gridClass="dashboard-status-grid"
            cardClass="dashboard-status-card"
          />
        </SkeletonSection>

        <SkeletonSection>
          <SkeletonRows />
        </SkeletonSection>

        <SkeletonSection>
          <SkeletonRows count={technicianOnly ? 1 : 3} />
        </SkeletonSection>

        <SkeletonSection>
          <SkeletonRows count={5} />
        </SkeletonSection>

        {isAdmin && (
          <SkeletonSection>
            <SkeletonCards
              count={3}
              gridClass="dashboard-financial-grid"
              cardClass="dashboard-financial-card"
            />
          </SkeletonSection>
        )}
      </div>
    </div>
  );
}