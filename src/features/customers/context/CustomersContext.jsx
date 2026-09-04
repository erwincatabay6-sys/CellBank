import {
    createContext,
    useContext,
    useState
} from "react";

import { mockCustomers }
    from "../data/mockCustomers.js";


const CustomersContext =
    createContext(null);


export function CustomersProvider({
    children
}) {

    // -----------------------------
    // SHARED CUSTOMER STATE
    // -----------------------------

    const [customers, setCustomers] =
        useState(mockCustomers);


    // -----------------------------
    // CUSTOMER OPERATIONS
    // -----------------------------

    function addCustomer(newCustomer) {

        const customerWithId = {
            ...newCustomer,

            // Temporary frontend ID.
            // PostgreSQL will generate this later.
            id: Date.now(),

            devices:
                newCustomer.devices ?? []
        };


        setCustomers((currentCustomers) => [
            ...currentCustomers,
            customerWithId
        ]);


        return customerWithId;
    }


    function updateCustomer(
        customerId,
        updatedFields
    ) {

        setCustomers((currentCustomers) =>
            currentCustomers.map(
                (customer) =>
                    customer.id === customerId
                        ? {
                            ...customer,
                            ...updatedFields
                        }
                        : customer
            )
        );
    }


    // -----------------------------
    // DEVICE OPERATIONS
    // -----------------------------

    function addDevice(
        customerId,
        newDevice
    ) {

        const deviceWithId = {
            ...newDevice,

            // Temporary frontend ID.
            id: Date.now()
        };


        setCustomers((currentCustomers) =>
            currentCustomers.map(
                (customer) => {

                    if (
                        customer.id !== customerId
                    ) {
                        return customer;
                    }


                    return {
                        ...customer,

                        devices: [
                            ...customer.devices,
                            deviceWithId
                        ]
                    };
                }
            )
        );


        return deviceWithId;
    }


    function updateDevice(
        customerId,
        deviceId,
        updatedFields
    ) {

        setCustomers((currentCustomers) =>
            currentCustomers.map(
                (customer) => {

                    if (
                        customer.id !== customerId
                    ) {
                        return customer;
                    }


                    return {
                        ...customer,

                        devices:
                            customer.devices.map(
                                (device) =>
                                    device.id === deviceId
                                        ? {
                                            ...device,
                                            ...updatedFields
                                        }
                                        : device
                            )
                    };
                }
            )
        );
    }


    // -----------------------------
    // CONTEXT VALUE
    // -----------------------------

    const value = {
        customers,

        addCustomer,
        updateCustomer,

        addDevice,
        updateDevice
    };


    return (
        <CustomersContext.Provider
            value={value}
        >
            {children}
        </CustomersContext.Provider>
    );
}


export function useCustomers() {

    const context =
        useContext(CustomersContext);


    if (!context) {

        throw new Error(
            "useCustomers must be used inside CustomersProvider."
        );
    }


    return context;
}