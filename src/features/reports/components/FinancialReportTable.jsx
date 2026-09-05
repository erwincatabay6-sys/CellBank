function FinancialReportTable({
    records,
    onRepairClick
}) {

    return (
        <div className="report-table-wrapper">

            <table className="report-table">

                <thead>

                    <tr>
                        <th>Reference</th>
                        <th>Customer</th>
                        <th>Agreed Price</th>
                        <th>Total Paid</th>
                        <th>Balance</th>
                        <th>Payment Status</th>
                    </tr>

                </thead>


                <tbody>

                    {records.map((record) => (

                        <tr
                            key={record.id}
                            className="report-repair-row"
                            onClick={() =>
                                onRepairClick(record.id)
                            }
                        >

                            <td>
                                <strong>
                                    {record.reference}
                                </strong>
                            </td>


                            <td>
                                {record.customer}
                            </td>


                            <td>
                                {record.agreedPrice != null
                                    ? `₱${record.agreedPrice.toFixed(2)}`
                                    : "Not agreed"
                                }
                            </td>


                            <td>
                                ₱{record.totalPaid.toFixed(2)}
                            </td>


                            <td>
                                {record.balance != null
                                    ? `₱${record.balance.toFixed(2)}`
                                    : "—"
                                }
                            </td>


                            <td>

                                <span
                                    className={
                                        `financial-status ${
                                            record.paymentStatus
                                                .toLowerCase()
                                                .replaceAll(" ", "-")
                                        }`
                                    }
                                >
                                    {record.paymentStatus}
                                </span>

                            </td>

                        </tr>

                    ))}

                </tbody>

            </table>

        </div>
    );
}


export default FinancialReportTable;