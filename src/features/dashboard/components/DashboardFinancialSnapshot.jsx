function DashboardFinancialSnapshot({
    totalAgreedValue,
    totalCollected,
    outstandingBalance
}) {

    return (
        <div className="dashboard-financial-grid">

            <div className="dashboard-financial-card">

                <span>
                    Agreed Repair Value
                </span>

                <strong>
                    ₱{totalAgreedValue.toFixed(2)}
                </strong>

            </div>


            <div className="dashboard-financial-card">

                <span>
                    Payments Collected
                </span>

                <strong>
                    ₱{totalCollected.toFixed(2)}
                </strong>

            </div>


            <div className="dashboard-financial-card">

                <span>
                    Outstanding Balance
                </span>

                <strong>
                    ₱{outstandingBalance.toFixed(2)}
                </strong>

            </div>

        </div>
    );
}


export default DashboardFinancialSnapshot;