const statusItems = [
    {
        status: "RECEIVED",
        label: "Received"
    },

    {
        status: "AWAITING_APPROVAL",
        label: "Awaiting Approval"
    },

    {
        status: "IN_PROGRESS",
        label: "In Progress"
    },

    {
        status: "AWAITING_PARTS",
        label: "Awaiting Parts"
    },

    {
        status: "READY_FOR_RELEASE",
        label: "Ready for Release"
    },

    {
        status: "COMPLETED",
        label: "Completed"
    },

    {
        status: "CANCELLED",
        label: "Cancelled"
    }
];


function DashboardStatusCounts({
    statusCounts
}) {

    return (
        <div className="dashboard-status-grid">

            {statusItems.map((item) => (

                <div
                    key={item.status}
                    className="dashboard-status-card"
                >

                    <span>
                        {item.label}
                    </span>

                    <strong>
                        {
                            statusCounts[
                                item.status
                            ] ?? 0
                        }
                    </strong>

                </div>

            ))}

        </div>
    );
}


export default DashboardStatusCounts;