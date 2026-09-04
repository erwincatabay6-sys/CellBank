function CustomerTable({
    customers,
    onCustomerClick
}) {

    return (
        <div className="customer-table-wrapper">

            <table className="customer-table">

                <thead>
                    <tr>
                        <th>Customer</th>
                        <th>Phone</th>
                        <th>Email</th>
                        <th>Devices</th>
                    </tr>
                </thead>


                <tbody>

                    {customers.map((customer) => (

                        <tr
                            key={customer.id}
                            className="customer-row"
                            onClick={() =>
                                onCustomerClick(customer.id)
                            }
                        >

                            <td>
                                {customer.name}
                            </td>

                            <td>
                                {customer.phone}
                            </td>

                            <td>
                                {customer.email}
                            </td>

                            <td>
                                {customer.devices.length}
                            </td>

                        </tr>

                    ))}

                </tbody>

            </table>

        </div>
    );
}


export default CustomerTable;