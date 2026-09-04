import { Plus } from "lucide-react";


function CustomerDeviceList({
    devices,
    onDeviceClick,
    onNewDevice
}) {

    return (
        <section className="customer-devices-section">

            {/* HEADER */}
            <div className="workspace-section-header">

                <div>

                    <h3>
                        Registered Devices
                    </h3>

                    <p className="workspace-section-description">
                        Devices registered under this customer.
                    </p>

                </div>


                <button
                    className="secondary-repair-button"
                    type="button"
                    onClick={onNewDevice}
                >
                    <Plus size={18} />

                    <span>
                        New Device
                    </span>
                </button>

            </div>


            {/* DEVICE LIST */}
            {devices.length > 0 ? (

                <div className="customer-device-list">

                    {devices.map((device) => (

                        <button
                            key={device.id}
                            className="customer-device-card"
                            type="button"
                            onClick={() =>
                                onDeviceClick(device.id)
                            }
                        >

                            <div>

                                <span>
                                    Device
                                </span>

                                <strong>
                                    {device.brand} {device.model}
                                </strong>

                            </div>


                            <div>

                                <span>
                                    Type
                                </span>

                                <strong>
                                    {device.type}
                                </strong>

                            </div>


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

                        </button>

                    ))}

                </div>

            ) : (

                <div className="workspace-empty-state">

                    <strong>
                        No devices registered
                    </strong>

                    <p>
                        Register a device for this customer
                        to begin building repair history.
                    </p>

                </div>

            )}

        </section>
    );
}


export default CustomerDeviceList;