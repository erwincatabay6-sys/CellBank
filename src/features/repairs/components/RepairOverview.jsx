function RepairOverview({
    repair,
    estimatedCost,
    agreedPrice
}) {

    return (
        <section className="page-content repair-overview">

            <h3>
                Repair Overview
            </h3>


            <div className="repair-overview-grid">

                {/* REPORTED PROBLEM */}
                <div className="overview-wide">

                    <span>
                        Reported Problem
                    </span>

                    <strong>
                        {repair.reportedProblem}
                    </strong>

                </div>


                {/* SERVICE TYPE */}
                <div>

                    <span>
                        Service Type
                    </span>

                    <strong>
                        {repair.serviceType}
                    </strong>

                </div>


                {/* ESTIMATED COST */}
                <div>

                    <span>
                        Estimated Cost
                    </span>

                    <strong>
                        {estimatedCost != null
                            ? `₱${estimatedCost.toFixed(2)}`
                            : "Not estimated"
                        }
                    </strong>

                </div>


                {/* AGREED PRICE */}
                <div>

                    <span>
                        Agreed Price
                    </span>

                    <strong>
                        {agreedPrice != null
                            ? `₱${agreedPrice.toFixed(2)}`
                            : "Awaiting approval"
                        }
                    </strong>

                </div>


                {/* PRICE AGREEMENT */}
                <div>

                    <span>
                        Price Agreement
                    </span>

                    <strong>
                        {agreedPrice != null
                            ? "Approved"
                            : "Pending"
                        }
                    </strong>

                </div>


                {/* ACCESSORIES RECEIVED */}
                <div>

                    <span>
                        Accessories Received
                    </span>

                    <strong>
                        {repair.accessoriesReceived
                            ?? "None recorded"
                        }
                    </strong>

                </div>


                {/* INTAKE NOTES */}
                <div className="overview-wide">

                    <span>
                        Intake Notes
                    </span>

                    <strong>
                        {repair.intakeNotes
                            ?? "None recorded"
                        }
                    </strong>

                </div>

            </div>

        </section>
    );
}


export default RepairOverview;