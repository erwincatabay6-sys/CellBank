export const mockPayments = [

    // =====================================================
    // REPAIR 1
    // CB-2026-00124
    // Partial payment / deposit
    // =====================================================
    {
        id: 1,

        repairId: 1,

        amount: 1000,

        recordedDate: "2026-09-02",

        recordedBy:
            "Miguel Santos",

        recordedAt:
            "September 2, 2026 - 2:30 PM",

        note:
            "Customer deposit."
    },


    // =====================================================
    // REPAIR 3
    // CB-2026-00126
    // Fully paid
    // =====================================================
    {
        id: 2,

        repairId: 3,

        amount: 3000,

        recordedDate: "2026-09-03",

        recordedBy:
            "Miguel Santos",

        recordedAt:
            "September 3, 2026 - 4:15 PM",

        note:
            "Full repair payment."
    },


    // =====================================================
    // REPAIR 4
    // CB-2026-00108
    // Historical completed repair
    // =====================================================
    {
        id: 3,

        repairId: 4,

        amount: 1500,

        recordedDate: "2026-08-20",

        recordedBy:
            "Miguel Santos",

        recordedAt:
            "August 20, 2026 - 3:40 PM",

        note:
            "Full payment upon device release."
    }

];