export const mockRepairs = [
    {
        id: 1,

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

                problemCategory: "Charging",

                problem:
                    "Phone only charges when cable is positioned at an angle."
            },

            {
                id: 102,

                date: "2026-06-18",

                problemCategory: "Charging",

                problem:
                    "Intermittent charging connection."
            },

            {
                id: 103,

                date: "2026-07-29",

                problemCategory: "Battery",

                problem:
                    "Battery drains faster than normal."
            }
        ]
    },


    {
        id: 2,

        reference: "CB-2026-00125",

        customer: "Maria Reyes",

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

                problemCategory: "Cooling",

                problem:
                    "Laptop temperature becomes unusually high during extended use."
            }
        ]
    },


    {
        id: 3,

        reference: "CB-2026-00126",

        customer: "Ana Santos",

        device: "iPhone 13",

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
    }
];