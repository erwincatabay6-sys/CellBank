import { useState } from "react";

import { X } from "lucide-react";


function DeviceRegistrationModal({
    customerName,
    initialDevice = null,
    onClose,
    onSave
}) {

    // -----------------------------
    // MODE
    // -----------------------------

    const isEditing =
        initialDevice != null;


    // -----------------------------
    // FORM STATE
    // -----------------------------

    const [deviceType, setDeviceType] =
        useState(
            initialDevice?.type ?? ""
        );

    const [brand, setBrand] =
        useState(
            initialDevice?.brand ?? ""
        );

    const [model, setModel] =
        useState(
            initialDevice?.model ?? ""
        );

    const [serialNumber, setSerialNumber] =
        useState(
            initialDevice?.serialNumber ?? ""
        );

    const [imei, setImei] =
        useState(
            initialDevice?.imei ?? ""
        );

    const [notes, setNotes] =
        useState(
            initialDevice?.notes ?? ""
        );


    // -----------------------------
    // SUBMISSION
    // -----------------------------

    function handleSubmit(event) {

        event.preventDefault();


        const deviceData = {
            type:
                deviceType,

            brand:
                brand.trim(),

            model:
                model.trim(),

            serialNumber:
                serialNumber.trim() || null,

            imei:
                imei.trim() || null,

            notes:
                notes.trim() || null
        };


        onSave(deviceData);
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
                                ? "Edit Device"
                                : "New Device"
                            }
                        </h3>

                        <p>
                            {isEditing
                                ? `Update device information for ${customerName}.`
                                : `Register a device for ${customerName}.`
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
                    DEVICE FORM
                ========================== */}
                <form
                    className="device-registration-form"
                    onSubmit={handleSubmit}
                >

                    {/* DEVICE TYPE */}
                    <div className="repair-form-group">

                        <label htmlFor="device-type">
                            Device Type
                        </label>

                        <select
                            id="device-type"
                            value={deviceType}
                            onChange={(event) =>
                                setDeviceType(
                                    event.target.value
                                )
                            }
                            required
                        >
                            <option value="">
                                Select device type
                            </option>

                            <option value="Mobile Phone">
                                Mobile Phone
                            </option>

                            <option value="Laptop">
                                Laptop
                            </option>

                            <option value="Desktop Computer">
                                Desktop Computer
                            </option>

                            <option value="Tablet">
                                Tablet
                            </option>

                            <option value="Other">
                                Other
                            </option>

                        </select>

                    </div>


                    <div className="modal-form-grid">

                        {/* BRAND */}
                        <div className="repair-form-group">

                            <label htmlFor="device-brand">
                                Brand
                            </label>

                            <input
                                id="device-brand"
                                type="text"
                                value={brand}
                                onChange={(event) =>
                                    setBrand(
                                        event.target.value
                                    )
                                }
                                placeholder="Enter brand"
                                required
                            />

                        </div>


                        {/* MODEL */}
                        <div className="repair-form-group">

                            <label htmlFor="device-model">
                                Model
                            </label>

                            <input
                                id="device-model"
                                type="text"
                                value={model}
                                onChange={(event) =>
                                    setModel(
                                        event.target.value
                                    )
                                }
                                placeholder="Enter model"
                                required
                            />

                        </div>


                        {/* SERIAL NUMBER */}
                        <div className="repair-form-group">

                            <label htmlFor="device-serial">
                                Serial Number
                            </label>

                            <input
                                id="device-serial"
                                type="text"
                                value={serialNumber}
                                onChange={(event) =>
                                    setSerialNumber(
                                        event.target.value
                                    )
                                }
                                placeholder="Optional"
                            />

                        </div>


                        {/* IMEI */}
                        <div className="repair-form-group">

                            <label htmlFor="device-imei">
                                IMEI
                            </label>

                            <input
                                id="device-imei"
                                type="text"
                                value={imei}
                                onChange={(event) =>
                                    setImei(
                                        event.target.value
                                    )
                                }
                                placeholder="Optional"
                            />

                        </div>

                    </div>


                    {/* NOTES */}
                    <div className="repair-form-group">

                        <label htmlFor="device-notes">
                            Notes
                        </label>

                        <textarea
                            id="device-notes"
                            value={notes}
                            onChange={(event) =>
                                setNotes(
                                    event.target.value
                                )
                            }
                            placeholder="Optional identifying notes"
                            rows="3"
                        />

                    </div>


                    {/* ACTIONS */}
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
                                : "Register Device"
                            }
                        </button>

                    </div>

                </form>

            </div>

        </div>
    );
}


export default DeviceRegistrationModal;