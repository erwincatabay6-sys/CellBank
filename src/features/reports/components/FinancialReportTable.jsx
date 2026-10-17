function FinancialReportTable({ records, onRepairClick }) {
  return (
    <div className="report-table-wrapper" role="region" aria-label="Financial records" tabIndex={0}>
      <table className="report-table">
        <thead>
          <tr>
            <th scope="col">Reference</th>
            <th scope="col">Customer</th>
            <th scope="col">Agreed Price</th>
            <th scope="col">Total Paid</th>
            <th scope="col">Balance</th>
            <th scope="col">Payment Status</th>
          </tr>
        </thead>

        <tbody>
          {records.map((record) => (
            <tr
              key={record.id}
              className="report-repair-row"
              onClick={() => onRepairClick(record.id)}
            >
              <td>
                <button
                  type="button"
                  className="record-link"
                  aria-label={`Open repair ${record.reference}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    onRepairClick(record.id);
                  }}
                >
                  {record.reference}
                </button>
              </td>

              <td>{record.customer}</td>

              <td>
                {record.agreedPrice != null
                  ? `₱${record.agreedPrice.toFixed(2)}`
                  : "Not agreed"}
              </td>

              <td>₱{record.totalPaid.toFixed(2)}</td>

              <td>
                {record.balance != null ? `₱${record.balance.toFixed(2)}` : "—"}
              </td>

              <td>
                <span
                  className={`financial-status ${record.paymentStatus
                    .toLowerCase()
                    .replaceAll(" ", "-")}`}
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
