import LoadingSpinner from "./LoadingSpinner.jsx";

export function LoadingStatus({ children, className = "" }) {
  return (
    <span className={`loading-status ${className}`} role="status">
      <LoadingSpinner size={16} />
      <span>{children}</span>
    </span>
  );
}

export default function PendingAction({ pending, label, pendingLabel, icon, reserveLabel }) {
  return (
    <span className="pending-action">
      <span className={pending ? "pending-action-measure" : undefined} aria-hidden={pending || undefined}>
        {icon}
        <span>{label}</span>
      </span>
      <span className={!pending ? "pending-action-measure" : undefined} aria-hidden={!pending || undefined}>
        {pending && <LoadingSpinner size={16} />}
        {!pending && <span className="pending-action-spinner-space" />}
        <span>{pendingLabel}</span>
      </span>
      {reserveLabel && (
        <span className="pending-action-measure" aria-hidden="true">
          {icon}
          <span>{reserveLabel}</span>
        </span>
      )}
    </span>
  );
}
