import { useState } from "react";

import {
    useNavigate,
    useParams
} from "react-router-dom";


import StatusBadge
    from "../../../components/StatusBadge.jsx";

import DeviceRegistrationModal
    from "../components/DeviceRegistrationModal.jsx";

import { useCustomers }
    from "../context/CustomersContext.jsx";

import { mockRepairs }
    from "../../repairs/data/mockRepairs.js";


function DeviceDetailsPage() {

    const {
        customerId,
        deviceId
    } = useParams();

    const navigate =
        useNavigate();


    // -----------------------------
    // SHARED CUSTOMER STATE
    // -----------------------------

    const {
        customers,
        updateDevice
    } = useCustomers();


    // -----------------------------
    // PAGE STATE
    // -----------------------------

    const [
        deviceEditOpen,
        setDeviceEditOpen
    ] = useState(false);


    // -----------------------------
    // CUSTOMER
    // -----------------------------

    const customer = customers.find(
        (customer) =>
            customer.id === Number(customerId)
    );


    // -----------------------------
    // DEVICE
    // -----------------------------

    const device = customer?.devices.find(
        (device) =>
            device.id === Number(deviceId)
    );


    // -----------------------------
    // DEVICE REPAIR HISTORY
    // -----------------------------

    const repairHistory = device
        ? mockRepairs.filter(
            (repair) =>
                repair.deviceId === device.id
        )
        : [];


    // -----------------------------
    // PREVIOUS REPAIR CONTEXT
    // -----------------------------

    const previousRepairContext =
        repairHistory.flatMap(
            (repair) =>
                repair.previousRepairs ?? []
        );


    // -----------------------------
    // REPEATED PROBLEM ANALYSIS
    // -----------------------------

    const problemCounts =
        previousRepairContext.reduce(
            (counts, previousRepair) => {

                const category =
                    previousRepair.problemCategory;


                if (!category) {
                    return counts;
                }


                counts[category] =
                    (counts[category] || 0) + 1;


                return counts;

            },
            {}
        );


    const repeatedProblems =
        Object.entries(problemCounts)
            .filter(([, count]) =>
                count > 1
            );


    // -----------------------------
    // DEVICE NOT FOUND
    // -----------------------------

    if (!customer || !device) {

        return (
            <>

                <section className="page-header">

                    <h2>
                        Device Not Found
                    </h2>

                    <p>
                        The requested device record
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
    // DEVICE EDITING
    // -----------------------------

    function handleEditDevice() {

        setDeviceEditOpen(true);
    }


    function handleDeviceUpdate(
        updatedDevice
    ) {

        updateDevice(
            customer.id,
            device.id,
            updatedDevice
        );


        setDeviceEditOpen(false);
    }


    function handleDeviceEditClose() {

        setDeviceEditOpen(false);
    }


    // -----------------------------
    // REPAIR NAVIGATION
    // -----------------------------

    function handleRepairClick(repairId) {

        navigate(
            `/repairs/${repairId}`
        );
    }


    return (
        <>

            {/* =========================
                PAGE HEADER
            ========================== */}
            <section className="page-header">

                <h2>
                    {device.brand} {device.model}
                </h2>

                <p>
                    Device registered under{" "}
                    {customer.name}.
                </p>

            </section>


            {/* =========================
                DEVICE INFORMATION
            ========================== */}
            <section className="page-content">

                <div className="workspace-section-header">

                    <div>

                        <h3>
                            Device Information
                        </h3>

                        <p className="workspace-section-description">
                            Identification and device
                            information for this record.
                        </p>

                    </div>


                    <button
                        className="secondary-repair-button"
                        type="button"
                        onClick={handleEditDevice}
                    >
                        Edit Device
                    </button>

                </div>


                <div className="device-info-grid">

                    {/* DEVICE TYPE */}
                    <div>

                        <span>
                            Device Type
                        </span>

                        <strong>
                            {device.type}
                        </strong>

                    </div>


                    {/* BRAND */}
                    <div>

                        <span>
                            Brand
                        </span>

                        <strong>
                            {device.brand}
                        </strong>

                    </div>


                    {/* MODEL */}
                    <div>

                        <span>
                            Model
                        </span>

                        <strong>
                            {device.model}
                        </strong>

                    </div>


                    {/* IMEI */}
                    <div>

                        <span>
                            IMEI
                        </span>

                        <strong>
                            {device.imei
                                ?? "Not recorded"
                            }
                        </strong>

                    </div>


                    {/* SERIAL NUMBER */}
                    <div>

                        <span>
                            Serial Number
                        </span>

                        <strong>
                            {device.serialNumber
                                ?? "Not recorded"
                            }
                        </strong>

                    </div>


                    {/* NOTES */}
                    <div>

                        <span>
                            Notes
                        </span>

                        <strong>
                            {device.notes
                                ?? "None recorded"
                            }
                        </strong>

                    </div>

                </div>

            </section>


            {/* =========================
                REPAIR HISTORY
            ========================== */}
            <section className="page-content">

                <div className="workspace-section-header">

                    <div>

                        <h3>
                            Repair History
                        </h3>

                        <p className="workspace-section-description">
                            Previous and current repair
                            records for this device.
                        </p>

                    </div>

                </div>


                {/* =========================
                    REPEATED PROBLEM CONTEXT
                ========================== */}
                {repeatedProblems.length > 0 && (

                    <div className="device-repeat-alert">

                        <div>

                            <strong>
                                Repeated Problem Detected
                            </strong>

                            <p>
                                Previous repair records
                                show recurring problems
                                for this device.
                            </p>

                        </div>


                        <div className="device-repeat-list">

                            {repeatedProblems.map(
                                ([problem, count]) => (

                                    <span key={problem}>
                                        {problem}:{" "}
                                        {count} previous repairs
                                    </span>

                                )
                            )}

                        </div>

                    </div>

                )}


                {/* =========================
                    REPAIR RECORDS
                ========================== */}
                {repairHistory.length > 0 ? (

                    <div className="device-repair-history">

                        {repairHistory.map((repair) => (

                            <button
                                key={repair.id}
                                className="device-repair-item"
                                type="button"
                                onClick={() =>
                                    handleRepairClick(
                                        repair.id
                                    )
                                }
                            >

                                {/* REFERENCE */}
                                <div>

                                    <span>
                                        Repair Reference
                                    </span>

                                    <strong>
                                        {repair.reference}
                                    </strong>

                                </div>


                                {/* REPORTED PROBLEM */}
                                <div>

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


                                {/* STATUS */}
                                <div>

                                    <span>
                                        Status
                                    </span>

                                    <StatusBadge
                                        status={
                                            repair.status
                                        }
                                    />

                                </div>

                            </button>

                        ))}

                    </div>

                ) : (

                    <div className="workspace-empty-state">

                        <strong>
                            No repair history
                        </strong>

                        <p>
                            Repair jobs created for this
                            device will appear here.
                        </p>

                    </div>

                )}

            </section>


            {/* =========================
                EDIT DEVICE MODAL
            ========================== */}
            {deviceEditOpen && (

                <DeviceRegistrationModal
                    customerName={
                        customer.name
                    }
                    initialDevice={
                        device
                    }
                    onClose={
                        handleDeviceEditClose
                    }
                    onSave={
                        handleDeviceUpdate
                    }
                />

            )}

        </>
    );
}


export default DeviceDetailsPage;