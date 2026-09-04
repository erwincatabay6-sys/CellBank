import StatusBadge
    from "../../../components/StatusBadge.jsx";


function CustomerRepairHistory({
    repairs,
    onRepairClick
}) {

    return (
        <section className="customer-repair-history-section">

            <div className="workspace-section-header">

                <div>

                    <h3>
                        Repair History
                    </h3>

                    <p className="workspace-section-description">
                        Current and previous repairs
                        for this customer's devices.
                    </p>

                </div>

            </div>


            {repairs.length > 0 ? (

                <div className="customer-repair-history">

                    {repairs.map((repair) => (

                        <button
                            key={repair.id}
                            className="customer-repair-item"
                            type="button"
                            onClick={() =>
                                onRepairClick(repair.id)
                            }
                        >

                            <div>

                                <span>
                                    Repair Reference
                                </span>

                                <strong>
                                    {repair.reference}
                                </strong>

                            </div>


                            <div>

                                <span>
                                    Device
                                </span>

                                <strong>
                                    {repair.device}
                                </strong>

                            </div>


                            <div>

                                <span>
                                    Reported Problem
                                </span>

                                <strong>
                                    {repair.reportedProblem}
                                </strong>

                            </div>


                            <div>

                                <span>
                                    Status
                                </span>

                                <StatusBadge
                                    status={repair.status}
                                />

                            </div>

                        </button>

                    ))}

                </div>

            ) : (

                <div className="workspace-empty-state">

                    <strong>
                        No repair history
                    </strong>

                    <p>
                        Repair jobs for this customer's
                        devices will appear here.
                    </p>

                </div>

            )}

        </section>
    );
}


export default CustomerRepairHistory;