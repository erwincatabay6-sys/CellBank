import { useState } from "react";
import { X } from "lucide-react";

function CustomerRegistrationModal({
    onClose,
    onSave
}) {

    const [fullName, setFullName] = useState("");
    const [contactNumber, setContactNumber] = useState("");
    const [email, setEmail] = useState("");
    const [address, setAddress] = useState("");


    function handleSubmit(event) {

        event.preventDefault();

        const newCustomer = {
            name: fullName,
            contactNumber,
            email: email || null,
            address: address || null,
            devices: []
        };

        onSave(newCustomer);
    }


    return (
        <div className="modal-backdrop">

            <div className="device-modal">

                <div className="modal-header">

                    <div>
                        <h3>New Customer</h3>

                        <p>
                            Register a new Cellbank customer.
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


                <form
                    className="device-registration-form"
                    onSubmit={handleSubmit}
                >

                    <div className="repair-form-group">

                        <label htmlFor="new-customer-name">
                            Full Name
                        </label>

                        <input
                            id="new-customer-name"
                            type="text"
                            value={fullName}
                            onChange={(event) =>
                                setFullName(event.target.value)
                            }
                            placeholder="Enter full name"
                            required
                        />

                    </div>


                    <div className="repair-form-group">

                        <label htmlFor="new-customer-contact">
                            Contact Number
                        </label>

                        <input
                            id="new-customer-contact"
                            type="text"
                            value={contactNumber}
                            onChange={(event) =>
                                setContactNumber(event.target.value)
                            }
                            placeholder="Enter contact number"
                            required
                        />

                    </div>


                    <div className="modal-form-grid">

                        <div className="repair-form-group">

                            <label htmlFor="new-customer-email">
                                Email
                            </label>

                            <input
                                id="new-customer-email"
                                type="email"
                                value={email}
                                onChange={(event) =>
                                    setEmail(event.target.value)
                                }
                                placeholder="Optional"
                            />

                        </div>


                        <div className="repair-form-group">

                            <label htmlFor="new-customer-address">
                                Address
                            </label>

                            <input
                                id="new-customer-address"
                                type="text"
                                value={address}
                                onChange={(event) =>
                                    setAddress(event.target.value)
                                }
                                placeholder="Optional"
                            />

                        </div>

                    </div>


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
                            Register Customer
                        </button>

                    </div>

                </form>

            </div>

        </div>
    );
}

export default CustomerRegistrationModal;