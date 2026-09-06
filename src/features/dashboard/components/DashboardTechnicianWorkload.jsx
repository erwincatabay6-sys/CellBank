function DashboardTechnicianWorkload({
    technicians
}) {

    if (technicians.length === 0) {

        return (
            <div className="workspace-empty-state">

                <strong>
                    No technician workload available
                </strong>

                <p>
                    Technician assignment information
                    will appear here.
                </p>

            </div>
        );
    }


    return (
        <div className="dashboard-workload-list">

            {technicians.map((technician) => (

                <div
                    key={technician.id}
                    className="dashboard-workload-item"
                >

                    <div>

                        <strong>
                            {technician.name}
                        </strong>

                        <span>
                            Technician
                        </span>

                    </div>


                    <div className="dashboard-workload-values">

                        <div>

                            <span>
                                Active
                            </span>

                            <strong>
                                {technician.activeRepairs}
                            </strong>

                        </div>


                        <div>

                            <span>
                                Total Assigned
                            </span>

                            <strong>
                                {technician.totalRepairs}
                            </strong>

                        </div>

                    </div>

                </div>

            ))}

        </div>
    );
}


export default DashboardTechnicianWorkload;