import Skeleton from "../../../components/Skeleton.jsx";

export default function TechnicianDetailsSkeleton() {
  return (
    <div role="status" aria-label="Loading technician details">
      <section className="page-content technician-detail-header" aria-hidden="true">
        <div>
          <Skeleton width={210} height={24} />
          <Skeleton width={130} height={16} />
        </div>
        <div className="technician-detail-counts">
          <Skeleton width="85%" height={32} />
          <Skeleton width="85%" height={32} />
        </div>
      </section>
      <section className="page-content technician-detail-workload" aria-hidden="true">
        <h3>Workload Summary</h3>
        <div className="technician-detail-status-counts">
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index}><Skeleton width="85%" height={29} /></div>
          ))}
        </div>
      </section>
      <section className="page-content technician-detail-repairs" aria-hidden="true">
        <div className="technician-detail-tabs">
          <Skeleton width={128} height={24} />
          <Skeleton width={128} height={24} />
        </div>
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} width="100%" height={30} />
        ))}
      </section>
    </div>
  );
}
