function CustomerTable({ customers, onCustomerClick }) {
  return (
    <div className="customer-table-wrapper" role="region" aria-label="Customer records" tabIndex={0}>
      <table className="customer-table">
        <thead>
          <tr>
            <th scope="col">Customer</th>
            <th scope="col">Phone</th>
            <th scope="col">Email</th>
            <th scope="col">Devices</th>
          </tr>
        </thead>

        <tbody>
          {customers.map((customer) => (
            <tr
              key={customer.id}
              className="customer-row"
              onClick={() => onCustomerClick(customer.id)}
            >
              <td>
                <button
                  type="button"
                  className="record-link"
                  aria-label={`Open customer ${customer.name}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    onCustomerClick(customer.id);
                  }}
                >
                  {customer.name}
                </button>
              </td>

              <td>{customer.phone}</td>

              <td>{customer.email?.trim() || "-"}</td>

              <td>{customer.devices.length}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default CustomerTable;
