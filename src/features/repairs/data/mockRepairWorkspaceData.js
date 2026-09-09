// =====================================================
// TEMPORARY REPAIR WORKSPACE DATA
// =====================================================
// These records keep mock findings, status history, and
// parts isolated per repair until the Spring Boot API and
// PostgreSQL become the real source of truth.

export const mockFindingsByRepairId = {
    1: [
        {
            id: 101,
            finding:
                "Charging port shows signs of wear and intermittent contact.",
            diagnosis:
                "Possible damaged charging port.",
            actionTaken:
                "Charging port inspected and connection tested.",
            recordedBy:
                "Miguel Santos"
        },
        {
            id: 102,
            finding:
                "Battery health is within acceptable range.",
            diagnosis:
                "Battery is unlikely to be the primary cause.",
            actionTaken:
                "Battery health test completed.",
            recordedBy:
                "Miguel Santos"
        }
    ],

    2: [
        {
            id: 201,
            finding:
                "Cooling vents and fan assembly contain heavy dust buildup.",
            diagnosis:
                "Restricted airflow is contributing to overheating.",
            actionTaken:
                "Cooling system inspected and prepared for cleaning.",
            recordedBy:
                "Carlo Mendoza"
        }
    ],

    3: [
        {
            id: 301,
            finding:
                "Display glass is cracked and touch response is intermittent.",
            diagnosis:
                "Display assembly requires replacement.",
            actionTaken:
                "Replacement display installed and touch response tested.",
            recordedBy:
                "Miguel Santos"
        }
    ],

    4: [
        {
            id: 401,
            finding:
                "Battery capacity is below normal operating range.",
            diagnosis:
                "Battery degradation caused the reported rapid drain.",
            actionTaken:
                "Battery replaced and charging cycle tested.",
            recordedBy:
                "Miguel Santos"
        }
    ],

    5: []
};


export const mockStatusHistoryByRepairId = {
    1: [
        {
            id: 1001,
            status: "RECEIVED",
            changedBy: "Angela Reyes",
            changedAt: "September 1, 2026 - 9:15 AM",
            note: "Device received for inspection."
        },
        {
            id: 1002,
            status: "AWAITING_APPROVAL",
            changedBy: "Miguel Santos",
            changedAt: "September 1, 2026 - 10:30 AM",
            note: "Inspection completed. Awaiting customer approval."
        },
        {
            id: 1003,
            status: "IN_PROGRESS",
            changedBy: "Miguel Santos",
            changedAt: "September 2, 2026 - 9:10 AM",
            note: "Customer approved the repair."
        },
        {
            id: 1004,
            status: "AWAITING_PARTS",
            changedBy: "Miguel Santos",
            changedAt: "September 2, 2026 - 11:45 AM",
            note: "Replacement charging port is required."
        }
    ],

    2: [
        {
            id: 2001,
            status: "RECEIVED",
            changedBy: "Angela Reyes",
            changedAt: "September 2, 2026 - 8:40 AM",
            note: "Laptop received with charger and carrying bag."
        },
        {
            id: 2002,
            status: "AWAITING_APPROVAL",
            changedBy: "Carlo Mendoza",
            changedAt: "September 2, 2026 - 10:05 AM",
            note: "Cooling-system service recommended."
        },
        {
            id: 2003,
            status: "IN_PROGRESS",
            changedBy: "Carlo Mendoza",
            changedAt: "September 3, 2026 - 1:20 PM",
            note: "Cooling system cleaning and thermal inspection started."
        }
    ],

    3: [
        {
            id: 3001,
            status: "RECEIVED",
            changedBy: "Angela Reyes",
            changedAt: "September 2, 2026 - 2:15 PM",
            note: "Phone received with cracked front glass."
        },
        {
            id: 3002,
            status: "AWAITING_APPROVAL",
            changedBy: "Miguel Santos",
            changedAt: "September 2, 2026 - 3:00 PM",
            note: "Display replacement quoted to customer."
        },
        {
            id: 3003,
            status: "IN_PROGRESS",
            changedBy: "Miguel Santos",
            changedAt: "September 3, 2026 - 9:30 AM",
            note: "Display replacement started."
        },
        {
            id: 3004,
            status: "READY_FOR_RELEASE",
            changedBy: "Miguel Santos",
            changedAt: "September 3, 2026 - 3:50 PM",
            note: "Display replacement completed and tested."
        }
    ],

    4: [
        {
            id: 4001,
            status: "RECEIVED",
            changedBy: "Angela Reyes",
            changedAt: "August 19, 2026 - 9:05 AM",
            note: "Device received for battery diagnosis."
        },
        {
            id: 4002,
            status: "AWAITING_APPROVAL",
            changedBy: "Miguel Santos",
            changedAt: "August 19, 2026 - 10:10 AM",
            note: "Battery replacement recommended."
        },
        {
            id: 4003,
            status: "IN_PROGRESS",
            changedBy: "Miguel Santos",
            changedAt: "August 20, 2026 - 9:00 AM",
            note: "Battery replacement started."
        },
        {
            id: 4004,
            status: "READY_FOR_RELEASE",
            changedBy: "Miguel Santos",
            changedAt: "August 20, 2026 - 1:45 PM",
            note: "Device passed charging and battery tests."
        },
        {
            id: 4005,
            status: "COMPLETED",
            changedBy: "Angela Reyes",
            changedAt: "August 20, 2026 - 3:40 PM",
            note: "Device released to customer."
        }
    ],

    5: [
        {
            id: 5001,
            status: "RECEIVED",
            changedBy: "Angela Reyes",
            changedAt: "August 8, 2026 - 10:25 AM",
            note: "Laptop received for keyboard inspection."
        },
        {
            id: 5002,
            status: "CANCELLED",
            changedBy: "Angela Reyes",
            changedAt: "August 8, 2026 - 2:10 PM",
            note: "Customer decided not to proceed with repair."
        }
    ]
};


export const mockPartsByRepairId = {
    1: [],

    2: [
        {
            id: 201,
            name: "Thermal Paste",
            quantity: 1,
            unitCost: 250
        }
    ],

    3: [
        {
            id: 301,
            name: "Replacement Display Assembly",
            quantity: 1,
            unitCost: 2400
        }
    ],

    4: [
        {
            id: 401,
            name: "Replacement Battery",
            quantity: 1,
            unitCost: 900
        }
    ],

    5: []
};


export function getMockFindings(repairId) {
    return [
        ...(mockFindingsByRepairId[repairId] ?? [])
    ];
}


export function getMockStatusHistory(repairId) {
    return [
        ...(mockStatusHistoryByRepairId[repairId] ?? [])
    ];
}


export function getMockParts(repairId) {
    return [
        ...(mockPartsByRepairId[repairId] ?? [])
    ];
}
