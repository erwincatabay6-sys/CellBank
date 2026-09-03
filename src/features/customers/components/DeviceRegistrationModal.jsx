import { useState } from "react";
import { X } from "lucide-react";

function DeviceRegistrationModal({
    customerName,
    onClose,
    onSave
}) {

    const [deviceType, setDeviceType] = useState("");
    const [brand, setBrand] = useState("");
    const [model, setModel] = useState("");
    const [serialNumber, setSerialNumber] = useState("");
    const [imei, setImei] = useState("");
    const [notes, setNotes] = useState("");


    function handleSubmit(event) {

        event.preventDefault();

        const newDevice = {
            type: deviceType,
            brand,
            model,
            serialNumber: serialNumber || null,
            imei: imei || null,
            notes: notes || null,
            previousRepairs: 0
        };

        onSave(newDevice);
    }


    return (
        <div className="modal-backdrop">

            <div className="device-modal">

                <div className="modal-header">

                    <div>
                        <h3>New Device</h3>

                        <p>
                            Register a device for {customerName}.
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

                        <label htmlFor="new-device-type">
                            Device Type
                        </label>

                        <select
                            id="new-device-type"
                            value={deviceType}
                            onChange={(event) =>
                                setDeviceType(event.target.value)
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

                        <div className="repair-form-group">

                            <label htmlFor="new-device-brand">
                                Brand
                            </label>

                            <input
                                id="new-device-brand"
                                type="text"
                                value={brand}
                                onChange={(event) =>
                                    setBrand(event.target.value)
                                }
                                placeholder="Enter brand"
                                required
                            />

                        </div>


                        <div className="repair-form-group">

                            <label htmlFor="new-device-model">
                                Model
                            </label>

                            <input
                                id="new-device-model"
                                type="text"
                                value={model}
                                onChange={(event) =>
                                    setModel(event.target.value)
                                }
                                placeholder="Enter model"
                                required
                            />

                        </div>


                        <div className="repair-form-group">

                            <label htmlFor="new-device-serial">
                                Serial Number
                            </label>

                            <input
                                id="new-device-serial"
                                type="text"
                                value={serialNumber}
                                onChange={(event) =>
                                    setSerialNumber(event.target.value)
                                }
                                placeholder="Optional"
                            />

                        </div>


                        <div className="repair-form-group">

                            <label htmlFor="new-device-imei">
                                IMEI
                            </label>

                            <input
                                id="new-device-imei"
                                type="text"
                                value={imei}
                                onChange={(event) =>
                                    setImei(event.target.value)
                                }
                                placeholder="Optional"
                            />

                        </div>

                    </div>


                    <div className="repair-form-group">

                        <label htmlFor="new-device-notes">
                            Notes
                        </label>

                        <textarea
                            id="new-device-notes"
                            value={notes}
                            onChange={(event) =>
                                setNotes(event.target.value)
                            }
                            placeholder="Optional identifying notes"
                            rows="3"
                        />

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
                            Register Device
                        </button>

                    </div>

                </form>

            </div>

        </div>
    );
}

export default DeviceRegistrationModal;