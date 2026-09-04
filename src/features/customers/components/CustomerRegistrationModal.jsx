import { useState } from "react";

import { X } from "lucide-react";


function CustomerRegistrationModal({
    initialCustomer = null,
    onClose,
    onSave
}) {

    // -----------------------------
    // MODE
    // -----------------------------

    const isEditing =
        initialCustomer != null;


    // -----------------------------
    // FORM STATE
    // -----------------------------

    const [name, setName] =
        useState(
            initialCustomer?.name ?? ""
        );

    const [phone, setPhone] =
        useState(
            initialCustomer?.phone ?? ""
        );

    const [email, setEmail] =
        useState(
            initialCustomer?.email ?? ""
        );

    const [address, setAddress] =
        useState(
            initialCustomer?.address ?? ""
        );


    // -----------------------------
    // SUBMISSION
    // -----------------------------

    function handleSubmit(event) {

        event.preventDefault();


        const customerData = {
            name:
                name.trim(),

            phone:
                phone.trim(),

            email:
                email.trim(),

            address:
                address.trim()
        };


        onSave(customerData);
    }


    return (
        <div className="modal-backdrop">

            <div className="device-modal">

                {/* =========================
                    MODAL HEADER
                ========================== */}
                <div className="modal-header">

                    <div>

                        <h3>
                            {isEditing
                                ? "Edit Customer"
                                : "New Customer"
                            }
                        </h3>

                        <p>
                            {isEditing
                                ? "Update customer information."
                                : "Register a new customer in the system."
                            }
                        </p>

                    </div>


                    <button
                        className="modal-close-button"
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                    >
                        <X size={20} />
                    </button>

                </div>


                {/* =========================
                    CUSTOMER FORM
                ========================== */}
                <form
                    className="device-registration-form"
                    onSubmit={handleSubmit}
                >

                    {/* FULL NAME */}
                    <div className="repair-form-group">

                        <label htmlFor="customer-name">
                            Full Name
                        </label>

                        <input
                            id="customer-name"
                            type="text"
                            value={name}
                            onChange={(event) =>
                                setName(
                                    event.target.value
                                )
                            }
                            placeholder="Enter customer name"
                            required
                        />

                    </div>


                    {/* PHONE */}
                    <div className="repair-form-group">

                        <label htmlFor="customer-phone">
                            Phone Number
                        </label>

                        <input
                            id="customer-phone"
                            type="tel"
                            value={phone}
                            onChange={(event) =>
                                setPhone(
                                    event.target.value
                                )
                            }
                            placeholder="Enter phone number"
                            required
                        />

                    </div>


                    {/* EMAIL */}
                    <div className="repair-form-group">

                        <label htmlFor="customer-email">
                            Email Address
                        </label>

                        <input
                            id="customer-email"
                            type="email"
                            value={email}
                            onChange={(event) =>
                                setEmail(
                                    event.target.value
                                )
                            }
                            placeholder="Optional email address"
                        />

                    </div>


                    {/* ADDRESS */}
                    <div className="repair-form-group">

                        <label htmlFor="customer-address">
                            Address
                        </label>

                        <textarea
                            id="customer-address"
                            value={address}
                            onChange={(event) =>
                                setAddress(
                                    event.target.value
                                )
                            }
                            placeholder="Optional customer address"
                            rows="3"
                        />

                    </div>


                    {/* =========================
                        FORM ACTIONS
                    ========================== */}
                    <div className="modal-actions">

                        <button
                            className="cancel-repair-button"
                            type="button"
                            onClick={onClose}
                        >
                            Cancel
                        </button>


                        <button
                            className="create-repair-button"
                            type="submit"
                        >
                            {isEditing
                                ? "Save Changes"
                                : "Register Customer"
                            }
                        </button>

                    </div>

                </form>

            </div>

        </div>
    );
}


export default CustomerRegistrationModal;