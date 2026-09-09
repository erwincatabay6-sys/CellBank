import { useState } from "react";
import { UserPlus, Smartphone } from "lucide-react";
import { useNavigate } from "react-router-dom";

import DeviceRegistrationModal
    from "../../customers/components/DeviceRegistrationModal.jsx";

import CustomerRegistrationModal
    from "../../customers/components/CustomerRegistrationModal.jsx";

import { useCustomers }
    from "../../customers/context/CustomersContext.jsx";

import { mockRepairs }
    from "../data/mockRepairs.js";

import { mockTechnicians }
    from "../../technicians/data/mockTechnicians.js";

import "../repairs.css";


function getDeviceLabel(device) {

    if (device.imei) {
        return (
            `${device.brand} ${device.model}` +
            ` — IMEI ••••${device.imei.slice(-4)}`
        );
    }

    if (device.serialNumber) {
        return (
            `${device.brand} ${device.model}` +
            ` — S/N ••••${device.serialNumber.slice(-4)}`
        );
    }

    return `${device.brand} ${device.model}`;
}


function NewRepairPage() {

    const navigate = useNavigate();


    // SHARED CUSTOMER DATA
    const {
        customers,
        addCustomer,
        addDevice
    } = useCustomers();


    // MODALS
    const [customerModalOpen, setCustomerModalOpen] =
        useState(false);

    const [deviceModalOpen, setDeviceModalOpen] =
        useState(false);


    // SELECTIONS
    const [selectedCustomerId, setSelectedCustomerId] =
        useState("");

    const [selectedDeviceId, setSelectedDeviceId] =
        useState("");

    const [isSubmitting, setIsSubmitting] =
    useState(false);

    const [submitMessage, setSubmitMessage] =
    useState("");


    // DERIVED DATA
    const selectedCustomer = customers.find(
        (customer) =>
            customer.id === Number(selectedCustomerId)
    );

    const selectedDevice = selectedCustomer?.devices.find(
        (device) =>
            device.id === Number(selectedDeviceId)
    );


    const selectedDevicePreviousRepairs =
        selectedDevice
            ? mockRepairs.filter(
                (repair) =>
                    repair.deviceId ===
                        selectedDevice.id
            ).length
            : 0;


    function handleCustomerChange(event) {

        setSelectedCustomerId(event.target.value);

        // Clear the previous customer's device.
        setSelectedDeviceId("");
    }


    function handleNewCustomer(newCustomer) {

        const registeredCustomer =
            addCustomer(
                newCustomer
            );


        setSelectedCustomerId(
            String(registeredCustomer.id)
        );

        setSelectedDeviceId("");
        setCustomerModalOpen(false);
    }


    function handleNewDevice(newDevice) {

        if (!selectedCustomer) {
            return;
        }


        const registeredDevice =
            addDevice(
                selectedCustomer.id,
                newDevice
            );


        setSelectedDeviceId(
            String(registeredDevice.id)
        );

        setDeviceModalOpen(false);
    }


    function handleSubmit(event) {

    event.preventDefault();

    setIsSubmitting(true);
    setSubmitMessage("");

    // Temporary frontend simulation.
    // This will later be replaced by POST /api/repairs.
    setTimeout(() => {

        setIsSubmitting(false);

        setSubmitMessage(
            "Repair information validated successfully."
        );

    }, 700);
}


    return (
        <>

            <section className="page-header">
                <h2>New Repair</h2>

                <p>
                    Create a new Cellbank repair job.
                </p>
            </section>


            <form
                className="repair-form"
                onSubmit={handleSubmit}
            >

                {/* CUSTOMER */}
                <section className="repair-form-section">

                    <div className="repair-form-section-header">

                        <div>
                            <h3>Customer</h3>

                            <p>
                                Select an existing customer
                                or register a new one.
                            </p>
                        </div>

                        <button
                            className="secondary-repair-button"
                            type="button"
                            onClick={() =>
                                setCustomerModalOpen(true)
                            }
                        >
                            <UserPlus size={18} />
                            <span>New Customer</span>
                        </button>

                    </div>


                    <div className="repair-form-grid">

                        <div className="repair-form-group">

                            <label htmlFor="customer">
                                Customer
                            </label>

                            <select
                                id="customer"
                                name="customer"
                                value={selectedCustomerId}
                                onChange={handleCustomerChange}
                                required
                            >
                                <option value="">
                                    Select customer
                                </option>

                                {customers.map((customer) => (
                                    <option
                                        key={customer.id}
                                        value={customer.id}
                                    >
                                        {customer.name}
                                    </option>
                                ))}
                            </select>

                        </div>

                    </div>

                </section>


                {/* DEVICE */}
                <section className="repair-form-section">

                    <div className="repair-form-section-header">

                        <div>
                            <h3>Device</h3>

                            <p>
                                Select one of the customer's
                                registered devices or register
                                a new device.
                            </p>
                        </div>

                        <button
                            className="secondary-repair-button"
                            type="button"
                            disabled={!selectedCustomer}
                            onClick={() =>
                                setDeviceModalOpen(true)
                            }
                            title={
                                selectedCustomer
                                    ? "Register a new device"
                                    : "Select a customer first"
                            }
                        >
                            <Smartphone size={18} />
                            <span>New Device</span>
                        </button>

                    </div>


                    <div className="repair-form-grid">

                        <div className="repair-form-group">

                            <label htmlFor="device">
                                Device
                            </label>

                            <select
                                id="device"
                                name="device"
                                value={selectedDeviceId}
                                disabled={!selectedCustomer}
                                onChange={(event) =>
                                    setSelectedDeviceId(
                                        event.target.value
                                    )
                                }
                                required
                            >
                                <option value="">
                                    {!selectedCustomer
                                        ? "Select customer first"
                                        : selectedCustomer.devices.length === 0
                                            ? "No registered devices"
                                            : "Select device"
                                    }
                                </option>

                                {selectedCustomer?.devices.map(
                                    (device) => (
                                        <option
                                            key={device.id}
                                            value={device.id}
                                        >
                                            {getDeviceLabel(device)}
                                        </option>
                                    )
                                )}
                            </select>

                        </div>

                    </div>


                    {/* READ-ONLY DEVICE DETAILS */}
                    {selectedDevice && (

                        <div className="selected-device-summary">

                            <h4>Selected Device</h4>

                            <div className="selected-device-grid">

                                <div>
                                    <span>Device Type</span>
                                    <strong>
                                        {selectedDevice.type}
                                    </strong>
                                </div>

                                <div>
                                    <span>Device</span>
                                    <strong>
                                        {selectedDevice.brand}{" "}
                                        {selectedDevice.model}
                                    </strong>
                                </div>

                                <div>
                                    <span>Serial Number</span>
                                    <strong>
                                        {
                                            selectedDevice.serialNumber
                                            ?? "Not recorded"
                                        }
                                    </strong>
                                </div>

                                <div>
                                    <span>IMEI</span>
                                    <strong>
                                        {
                                            selectedDevice.imei
                                            ?? "Not recorded"
                                        }
                                    </strong>
                                </div>

                                <div>
                                    <span>Previous Repairs</span>
                                    <strong>
                                        {
                                            selectedDevicePreviousRepairs
                                        }
                                    </strong>
                                </div>

                                <div>
                                    <span>Notes</span>
                                    <strong>
                                        {
                                            selectedDevice.notes
                                            ?? "Not recorded"
                                        }
                                    </strong>
                                </div>

                            </div>

                        </div>

                    )}

                </section>


                {/* REPAIR INFORMATION */}
                <section className="repair-form-section">

                    <div className="repair-form-section-header">

                        <div>
                            <h3>Repair Information</h3>

                            <p>
                                Record the reported issue
                                and repair intake details.
                            </p>
                        </div>

                    </div>


                    <div className="repair-form-grid">

                        <div className="repair-form-group repair-form-full">

                            <label htmlFor="reported-problem">
                                Reported Problem
                            </label>

                            <textarea
                                id="reported-problem"
                                name="reported-problem"
                                rows="4"
                                placeholder={
                                    "Describe the problem " +
                                    "reported by the customer"
                                    
                                }
                                required
                            />

                        </div>


                        <div className="repair-form-group">

                            <label htmlFor="service-type">
                                Service Type
                            </label>

                            <select
                                id="service-type"
                                name="service-type"
                                defaultValue=""
                                required
                            >
                                <option
                                    value=""
                                    disabled
                                >
                                    Select service type
                                </option>

                                <option value="DIAGNOSTIC">
                                    Diagnostic
                                </option>

                                <option value="HARDWARE_REPAIR">
                                    Hardware Repair
                                </option>

                                <option value="SOFTWARE_REPAIR">
                                    Software Repair
                                </option>

                                <option value="MAINTENANCE">
                                    Maintenance / Cleaning
                                </option>

                                <option value="OTHER">
                                    Other
                                </option>
                            </select>

                        </div>


                        <div className="repair-form-group">

                            <label htmlFor="accessories-received">
                                Accessories Received
                            </label>

                            <input
                                type="text"
                                id="accessories-received"
                                name="accessories-received"
                                placeholder="e.g. Charger, laptop bag"
                            />

                        </div>


                        <div className="repair-form-group repair-form-full">

                            <label htmlFor="intake-notes">
                                Intake Notes
                            </label>

                            <textarea
                                id="intake-notes"
                                name="intake-notes"
                                rows="3"
                                placeholder="Optional additional intake notes"
                            />

                        </div>

                    </div>

                </section>


                {/* ASSIGNMENT & ESTIMATE */}
                <section className="repair-form-section">

                    <div className="repair-form-section-header">

                        <div>
                            <h3>Assignment & Estimate</h3>

                            <p>
                                Optionally assign a technician
                                and record an initial estimate.
                            </p>
                        </div>

                    </div>


                    <div className="repair-form-grid">

                        <div className="repair-form-group">

                            <label htmlFor="assigned-technician">
                                Assigned Technician
                            </label>

                            <select
                                id="assigned-technician"
                                name="assigned-technician"
                                defaultValue=""
                            >
                                <option value="">
                                    Assign later
                                </option>

                                {mockTechnicians
                                    .filter(
                                        (technician) =>
                                            technician.status ===
                                                "ACTIVE"
                                    )
                                    .map((technician) => (

                                        <option
                                            key={technician.id}
                                            value={technician.id}
                                        >
                                            {technician.name}
                                        </option>

                                    ))}
                            </select>

                        </div>


                        <div className="repair-form-group">

                            <label htmlFor="estimated-cost">
                                Estimated Cost
                            </label>

                            <input
                                type="number"
                                id="estimated-cost"
                                name="estimated-cost"
                                min="0"
                                step="0.01"
                                placeholder="Optional"
                            />

                        </div>

                    </div>

                </section>

                {submitMessage && (
                <div className="repair-submit-message">
                    {submitMessage}
                </div>
                )}

                {/* ACTIONS */}
                <div className="repair-form-actions">

                    <button
                        className="cancel-repair-button"
                        type="button"
                        onClick={() =>
                            navigate("/repairs")
                        }
                    >
                        Cancel
                    </button>

                    <button
                        className="create-repair-button"
                        type="submit"
                        disabled={isSubmitting}
                    >
                        {isSubmitting
                        ? "Creating Repair..."
                        : "Create Repair"
                        }
                        
                    </button>

                </div>

            </form>


            {/* CUSTOMER MODAL */}
            {customerModalOpen && (
                <CustomerRegistrationModal
                    onClose={() =>
                        setCustomerModalOpen(false)
                    }
                    onSave={handleNewCustomer}
                />
            )}


            {/* DEVICE MODAL */}
            {deviceModalOpen && selectedCustomer && (
                <DeviceRegistrationModal
                    customerName={selectedCustomer.name}
                    onClose={() =>
                        setDeviceModalOpen(false)
                    }
                    onSave={handleNewDevice}
                />
            )}

        </>
    );
}


export default NewRepairPage;