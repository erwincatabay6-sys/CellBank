function StatusBadge({ status }) {

    const labels = {
        RECEIVED: "Received",
        AWAITING_APPROVAL: "Awaiting Approval",
        IN_PROGRESS: "In Progress",
        AWAITING_PARTS: "Awaiting Parts",
        READY_FOR_RELEASE: "Ready for Release",
        COMPLETED: "Completed",
        CANCELLED: "Cancelled"
    };

    const statusClass =
        status.toLowerCase().replaceAll("_", "-");

    return (
        <span className={`status-badge status-${statusClass}`}>
            {labels[status] ?? status}
        </span>
    );
}

export default StatusBadge;