import StatusBadge
    from "../../../components/StatusBadge.jsx";


function DashboardRecentRepairs({
    repairs,
    onRepairClick
}) {

    if (repairs.length === 0) {

        return (
            <div className="workspace-empty-state">

                <strong>
                    No active repairs
                </strong>

                <p>
                    Active repair jobs will
                    appear here.
                </p>

            </div>
        );
    }


    return (
        <div className="dashboard-recent-list">

            {repairs.map((repair) => (

                <button
                    key={repair.id}
                    className="dashboard-recent-item"
                    type="button"
                    onClick={() =>
                        onRepairClick(
                            repair.id
                        )
                    }
                >

                    <div className="dashboard-recent-main">

                        <strong>
                            {repair.reference}
                        </strong>

                        <span>
                            {repair.customer}
                        </span>

                        <span>
                            {repair.device}
                        </span>

                    </div>


                    <div className="dashboard-recent-meta">

                        <span>
                            {repair.technician}
                        </span>

                        <StatusBadge
                            status={
                                repair.status
                            }
                        />

                    </div>

                </button>

            ))}

        </div>
    );
}


export default DashboardRecentRepairs;