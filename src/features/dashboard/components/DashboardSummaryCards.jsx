function DashboardSummaryCards({
    totalRepairs,
    activeRepairs,
    readyForRelease,
    completedRepairs
}) {

    return (
        <section className="dashboard-summary-grid">

            <div className="dashboard-summary-card">

                <span>
                    Total Repairs
                </span>

                <strong>
                    {totalRepairs}
                </strong>

            </div>


            <div className="dashboard-summary-card">

                <span>
                    Active Repairs
                </span>

                <strong>
                    {activeRepairs}
                </strong>

            </div>


            <div className="dashboard-summary-card">

                <span>
                    Ready for Release
                </span>

                <strong>
                    {readyForRelease}
                </strong>

            </div>


            <div className="dashboard-summary-card">

                <span>
                    Completed
                </span>

                <strong>
                    {completedRepairs}
                </strong>

            </div>

        </section>
    );
}


export default DashboardSummaryCards;