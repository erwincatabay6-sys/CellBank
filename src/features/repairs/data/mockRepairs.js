export const mockRepairs = [

    // =====================================================
    // REPAIR 1
    // Samsung Galaxy A54
    // Juan Cruz
    // Miguel Santos
    // =====================================================
    {
        id: 1,

        deviceId: 1,
        technicianId: 1,

        reference: "CB-2026-00124",

        customer: "Juan Cruz",

        device: "Samsung Galaxy A54",

        technician: "Miguel Santos",

        status: "AWAITING_PARTS",

        reportedProblem:
            "Device is not charging consistently.",

        serviceType:
            "Hardware Repair",

        accessoriesReceived:
            "USB-C charger",

        intakeNotes:
            "Minor scratches on the rear cover.",

        estimatedCost: 2500,

        agreedPrice: 2500,

        previousRepairs: [
            {
                id: 101,

                date: "2026-04-12",

                problemCategory:
                    "Charging",

                problem:
                    "Phone only charges when the cable is positioned at an angle."
            },

            {
                id: 102,

                date: "2026-06-18",

                problemCategory:
                    "Charging",

                problem:
                    "Intermittent charging connection."
            },

            {
                id: 103,

                date: "2026-07-29",

                problemCategory:
                    "Battery",

                problem:
                    "Battery drains faster than normal."
            }
        ]
    },


    // =====================================================
    // REPAIR 2
    // Acer Aspire 5
    // Juan Cruz
    // Carlo Mendoza
    // =====================================================
    {
        id: 2,

        deviceId: 2,
        technicianId: 2,

        reference: "CB-2026-00125",

        customer: "Juan Cruz",

        device: "Acer Aspire 5",

        technician: "Carlo Mendoza",

        status: "IN_PROGRESS",

        reportedProblem:
            "Laptop overheats and shuts down.",

        serviceType:
            "Maintenance / Cleaning",

        accessoriesReceived:
            "Laptop charger and carrying bag",

        intakeNotes:
            "Device has visible dust buildup near the cooling vents.",

        estimatedCost: 1800,

        agreedPrice: null,

        previousRepairs: [
            {
                id: 201,

                date: "2026-05-16",

                problemCategory:
                    "Cooling",

                problem:
                    "Laptop temperature becomes unusually high during extended use."
            }
        ]
    },


    // =====================================================
    // REPAIR 3
    // Apple iPhone 13
    // Maria Reyes
    // Miguel Santos
    // =====================================================
    {
        id: 3,

        deviceId: 3,
        technicianId: 1,

        reference: "CB-2026-00126",

        customer: "Maria Reyes",

        device: "Apple iPhone 13",

        technician: "Miguel Santos",

        status: "READY_FOR_RELEASE",

        reportedProblem:
            "Cracked display and intermittent touch response.",

        serviceType:
            "Hardware Repair",

        accessoriesReceived: null,

        intakeNotes:
            "Cracked front glass observed during intake.",

        estimatedCost: 3200,

        agreedPrice: 3000,

        previousRepairs: []
    },


    // =====================================================
    // REPAIR 4
    // HISTORICAL COMPLETED REPAIR
    // Samsung Galaxy A54
    // Juan Cruz
    // Miguel Santos
    // =====================================================
    {
        id: 4,

        deviceId: 1,
        technicianId: 1,

        reference: "CB-2026-00108",

        customer: "Juan Cruz",

        device: "Samsung Galaxy A54",

        technician: "Miguel Santos",

        status: "COMPLETED",

        reportedProblem:
            "Battery drains unusually fast.",

        serviceType:
            "Hardware Repair",

        accessoriesReceived:
            "USB-C charger",

        intakeNotes:
            "Battery performance checked during intake.",

        estimatedCost: 1500,

        agreedPrice: 1500,

        previousRepairs: []
    },


    // =====================================================
    // REPAIR 5
    // HISTORICAL CANCELLED REPAIR
    // Acer Aspire 5
    // Juan Cruz
    // Carlo Mendoza
    // =====================================================
    {
        id: 5,

        deviceId: 2,
        technicianId: 2,

        reference: "CB-2026-00097",

        customer: "Juan Cruz",

        device: "Acer Aspire 5",

        technician: "Carlo Mendoza",

        status: "CANCELLED",

        reportedProblem:
            "Laptop keyboard has several unresponsive keys.",

        serviceType:
            "Hardware Repair",

        accessoriesReceived:
            "Laptop charger",

        intakeNotes:
            "Customer decided not to proceed with repair.",

        estimatedCost: 2200,

        agreedPrice: null,

        previousRepairs: []
    }
];