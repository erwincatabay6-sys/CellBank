import { useState } from "react";

import { useNavigate }
    from "react-router-dom";

import {
    Plus,
    Search
} from "lucide-react";


import CustomerTable
    from "../components/CustomerTable.jsx";

import CustomerRegistrationModal
    from "../components/CustomerRegistrationModal.jsx";

import { useCustomers }
    from "../context/CustomersContext.jsx";

import "../customers.css";


function CustomerListPage() {

    const navigate =
        useNavigate();


    // -----------------------------
    // SHARED CUSTOMER STATE
    // -----------------------------

    const {
        customers,
        addCustomer
    } = useCustomers();


    // -----------------------------
    // PAGE STATE
    // -----------------------------

    const [searchTerm, setSearchTerm] =
        useState("");

    const [
        customerModalOpen,
        setCustomerModalOpen
    ] = useState(false);


    // -----------------------------
    // FILTERED CUSTOMERS
    // -----------------------------

    const filteredCustomers =
        customers.filter((customer) => {

            const search =
                searchTerm
                    .trim()
                    .toLowerCase();


            return (
                customer.name
                    .toLowerCase()
                    .includes(search) ||

                customer.phone
                    .toLowerCase()
                    .includes(search) ||

                customer.email
                    .toLowerCase()
                    .includes(search)
            );
        });


    // -----------------------------
    // NAVIGATION
    // -----------------------------

    function handleCustomerClick(customerId) {

        navigate(
            `/customers/${customerId}`
        );
    }


    // -----------------------------
    // CUSTOMER REGISTRATION
    // -----------------------------

    function handleNewCustomer() {

        setCustomerModalOpen(true);
    }


    function handleCustomerSave(newCustomer) {

        addCustomer(newCustomer);

        setCustomerModalOpen(false);
    }


    function handleCustomerModalClose() {

        setCustomerModalOpen(false);
    }


    return (
        <>

            {/* =========================
                PAGE HEADER
            ========================== */}
            <section className="page-header">

                <h2>
                    Customers
                </h2>

                <p>
                    Manage customer records,
                    devices, and repair history.
                </p>

            </section>


            {/* =========================
                CUSTOMER LIST
            ========================== */}
            <section className="page-content">

                {/* TOOLBAR */}
                <div className="customer-toolbar">

                    <div className="customer-search">

                        <Search size={18} />

                        <input
                            type="search"
                            value={searchTerm}
                            onChange={(event) =>
                                setSearchTerm(
                                    event.target.value
                                )
                            }
                            placeholder="Search customers..."
                        />

                    </div>


                    <button
                        className="create-repair-button"
                        type="button"
                        onClick={handleNewCustomer}
                    >
                        <Plus size={18} />

                        <span>
                            New Customer
                        </span>
                    </button>

                </div>


                {/* CUSTOMER TABLE */}
                {filteredCustomers.length > 0 ? (

                    <CustomerTable
                        customers={filteredCustomers}
                        onCustomerClick={
                            handleCustomerClick
                        }
                    />

                ) : (

                    <div className="workspace-empty-state">

                        <strong>
                            No customers found
                        </strong>

                        <p>
                            Try another search or
                            register a new customer.
                        </p>

                    </div>

                )}

            </section>


            {/* =========================
                CUSTOMER REGISTRATION
            ========================== */}
            {customerModalOpen && (

                <CustomerRegistrationModal
                    onClose={
                        handleCustomerModalClose
                    }
                    onSave={
                        handleCustomerSave
                    }
                />

            )}

        </>
    );
}


export default CustomerListPage;