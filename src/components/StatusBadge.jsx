import { CheckCheck, CircleCheck, CircleX, ClipboardCheck, Clock, Package, Wrench } from "lucide-react";

const statusIcons = {
  RECEIVED: ClipboardCheck,
  AWAITING_APPROVAL: Clock,
  IN_PROGRESS: Wrench,
  AWAITING_PARTS: Package,
  READY_FOR_RELEASE: CircleCheck,
  COMPLETED: CheckCheck,
  CANCELLED: CircleX,
};

function StatusBadge({ status }) {
  const labels = {
    RECEIVED: "Received",
    AWAITING_APPROVAL: "Awaiting Approval",
    IN_PROGRESS: "In Progress",
    AWAITING_PARTS: "Awaiting Parts",
    READY_FOR_RELEASE: "Ready for Release",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
  };

  const statusClass = status.toLowerCase().replaceAll("_", "-");
  const Icon = statusIcons[status];

  return (
    <span className={`status-badge status-${statusClass}`}>
      {Icon && <Icon size={13} aria-hidden="true" />}
      {labels[status] ?? status}
    </span>
  );
}

export default StatusBadge;
