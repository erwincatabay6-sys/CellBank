import StatusBadge
    from "../../../components/StatusBadge.jsx";


function DashboardAttentionRepairs({
    repairs,
    onRepairClick
}) {

    if (repairs.length === 0) {

        return (
            <div className="workspace-empty-state">

                <strong>
                    No repairs need attention
                </strong>

                <p>
                    There are currently no repair jobs
                    requiring immediate follow-up.
                </p>

            </div>
        );
    }


    return (
        <div className="dashboard-attention-list">

            {repairs.map((repair) => (

                <button
                    key={repair.id}
                    className="dashboard-attention-item"
                    type="button"
                    onClick={() =>
                        onRepairClick(
                            repair.id
                        )
                    }
                >

                    <div className="dashboard-attention-main">

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


                    <div className="dashboard-attention-meta">

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


export default DashboardAttentionRepairs;