import { useState } from "react";

import {
    useNavigate,
    useParams
} from "react-router-dom";


import CustomerDeviceList
    from "../components/CustomerDeviceList.jsx";

import CustomerRepairHistory
    from "../components/CustomerRepairHistory.jsx";

import CustomerRegistrationModal
    from "../components/CustomerRegistrationModal.jsx";

import DeviceRegistrationModal
    from "../components/DeviceRegistrationModal.jsx";

import { useCustomers }
    from "../context/CustomersContext.jsx";

import { mockRepairs }
    from "../../repairs/data/mockRepairs.js";


function CustomerDetailsPage() {

    const { customerId } =
        useParams();

    const navigate =
        useNavigate();


    // -----------------------------
    // SHARED CUSTOMER STATE
    // -----------------------------

    const {
        customers,
        addDevice,
        updateCustomer
    } = useCustomers();


    // -----------------------------
    // PAGE STATE
    // -----------------------------

    const [
        customerEditOpen,
        setCustomerEditOpen
    ] = useState(false);

    const [
        deviceModalOpen,
        setDeviceModalOpen
    ] = useState(false);


    // -----------------------------
    // CUSTOMER
    // -----------------------------

    const customer =
        customers.find(
            (customer) =>
                customer.id === Number(customerId)
        );


    // -----------------------------
    // CUSTOMER NOT FOUND
    // -----------------------------

    if (!customer) {

        return (
            <>

                <section className="page-header">

                    <h2>
                        Customer Not Found
                    </h2>

                    <p>
                        The requested customer record
                        does not exist.
                    </p>

                </section>


                <section className="page-content">

                    <button
                        className="secondary-repair-button"
                        type="button"
                        onClick={() =>
                            navigate("/customers")
                        }
                    >
                        Back to Customers
                    </button>

                </section>

            </>
        );
    }


    // -----------------------------
    // DERIVED CUSTOMER DATA
    // -----------------------------

    const customerDeviceIds =
        customer.devices.map(
            (device) => device.id
        );


    const customerRepairs =
        mockRepairs.filter(
            (repair) =>
                customerDeviceIds.includes(
                    repair.deviceId
                )
        );


    // -----------------------------
    // NAVIGATION
    // -----------------------------

    function handleDeviceClick(deviceId) {

        navigate(
            `/customers/${customer.id}/devices/${deviceId}`
        );
    }


    function handleRepairClick(repairId) {

        navigate(
            `/repairs/${repairId}`
        );
    }


    // -----------------------------
    // CUSTOMER EDITING
    // -----------------------------

    function handleEditCustomer() {

        setCustomerEditOpen(true);
    }


    function handleCustomerUpdate(
        updatedCustomer
    ) {

        updateCustomer(
            customer.id,
            updatedCustomer
        );


        setCustomerEditOpen(false);
    }


    function handleCustomerEditClose() {

        setCustomerEditOpen(false);
    }


    // -----------------------------
    // DEVICE REGISTRATION
    // -----------------------------

    function handleNewDevice() {

        setDeviceModalOpen(true);
    }


    function handleDeviceSave(newDevice) {

        addDevice(
            customer.id,
            newDevice
        );


        setDeviceModalOpen(false);
    }


    function handleDeviceModalClose() {

        setDeviceModalOpen(false);
    }


    return (
        <>

            {/* =========================
                PAGE HEADER
            ========================== */}
            <section className="page-header">

                <h2>
                    {customer.name}
                </h2>

                <p>
                    View customer information,
                    registered devices, and repair history.
                </p>

            </section>


            {/* =========================
                CUSTOMER INFORMATION
            ========================== */}
            <section className="page-content">

                <div className="workspace-section-header">

                    <div>

                        <h3>
                            Customer Information
                        </h3>

                        <p className="workspace-section-description">
                            Contact and account information
                            for this customer.
                        </p>

                    </div>


                    <button
                        className="secondary-repair-button"
                        type="button"
                        onClick={handleEditCustomer}
                    >
                        Edit Customer
                    </button>

                </div>


                <div className="customer-info-grid">

                    {/* FULL NAME */}
                    <div>

                        <span>
                            Full Name
                        </span>

                        <strong>
                            {customer.name}
                        </strong>

                    </div>


                    {/* PHONE */}
                    <div>

                        <span>
                            Phone
                        </span>

                        <strong>
                            {customer.phone}
                        </strong>

                    </div>


                    {/* EMAIL */}
                    <div>

                        <span>
                            Email
                        </span>

                        <strong>
                            {customer.email ||
                                "Not recorded"
                            }
                        </strong>

                    </div>


                    {/* ADDRESS */}
                    <div>

                        <span>
                            Address
                        </span>

                        <strong>
                            {customer.address ||
                                "Not recorded"
                            }
                        </strong>

                    </div>


                    {/* REGISTERED DEVICES */}
                    <div>

                        <span>
                            Registered Devices
                        </span>

                        <strong>
                            {customer.devices.length}
                        </strong>

                    </div>


                    {/* REPAIR RECORDS */}
                    <div>

                        <span>
                            Repair Records
                        </span>

                        <strong>
                            {customerRepairs.length}
                        </strong>

                    </div>

                </div>

            </section>


            {/* =========================
                REGISTERED DEVICES
            ========================== */}
            <section className="page-content">

                <CustomerDeviceList
                    devices={
                        customer.devices
                    }
                    onDeviceClick={
                        handleDeviceClick
                    }
                    onNewDevice={
                        handleNewDevice
                    }
                />

            </section>


            {/* =========================
                CUSTOMER REPAIR HISTORY
            ========================== */}
            <section className="page-content">

                <CustomerRepairHistory
                    repairs={
                        customerRepairs
                    }
                    onRepairClick={
                        handleRepairClick
                    }
                />

            </section>


            {/* =========================
                EDIT CUSTOMER MODAL
            ========================== */}
            {customerEditOpen && (

                <CustomerRegistrationModal
                    initialCustomer={
                        customer
                    }
                    onClose={
                        handleCustomerEditClose
                    }
                    onSave={
                        handleCustomerUpdate
                    }
                />

            )}


            {/* =========================
                NEW DEVICE MODAL
            ========================== */}
            {deviceModalOpen && (

                <DeviceRegistrationModal
                    customerName={
                        customer.name
                    }
                    onClose={
                        handleDeviceModalClose
                    }
                    onSave={
                        handleDeviceSave
                    }
                />

            )}

        </>
    );
}


export default CustomerDetailsPage;