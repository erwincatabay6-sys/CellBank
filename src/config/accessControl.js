export const ROLE_ACCESS = {

    // =====================================================
    // ADMIN
    // Full system access
    // =====================================================
    ADMIN: {

        // Main modules
        dashboard: true,
        repairs: true,
        customers: true,
        technicians: true,
        reports: true,
        administration: true,
        accountSettings: true,

        // Repair intake
        createRepair: true,

        // Technical repair work
        technicalFindings: true,
        aiTroubleshooting: true,
        editEstimatedCost: true,
        editPartsCosts: true,

        // Customer-facing financial work
        editAgreedPrice: true,
        recordPayments: true,

        // Administration
        staffManagement: true
    },


    // =====================================================
    // TECHNICIAN
    // Technical repair operations
    // =====================================================
    TECHNICIAN: {

        // Main modules
        dashboard: true,
        repairs: true,
        customers: true,
        technicians: true,
        reports: false,
        administration: false,
        accountSettings: true,

        // Repair intake
        createRepair: false,

        // Technical repair work
        technicalFindings: true,
        aiTroubleshooting: true,
        editEstimatedCost: true,
        editPartsCosts: true,

        // Customer-facing financial work
        editAgreedPrice: false,
        recordPayments: false,

        // Administration
        staffManagement: false
    },


    // =====================================================
    // FRONT DESK
    // Customer-facing operational work
    // =====================================================
    FRONT_DESK: {

        // Main modules
        dashboard: true,
        repairs: true,
        customers: true,
        technicians: true,
        reports: false,
        administration: false,
        accountSettings: true,

        // Repair intake
        createRepair: true,

        // Technical repair work
        technicalFindings: false,
        aiTroubleshooting: false,
        editEstimatedCost: false,
        editPartsCosts: false,

        // Customer-facing financial work
        editAgreedPrice: true,
        recordPayments: true,

        // Administration
        staffManagement: false
    }
};


// =====================================================
// REPAIR STATUS PERMISSIONS
// =====================================================

export const REPAIR_STATUS_ACCESS = {

    ADMIN: [
        "RECEIVED",
        "AWAITING_APPROVAL",
        "IN_PROGRESS",
        "AWAITING_PARTS",
        "READY_FOR_RELEASE",
        "COMPLETED",
        "CANCELLED"
    ],


    TECHNICIAN: [
        "AWAITING_APPROVAL",
        "IN_PROGRESS",
        "AWAITING_PARTS",
        "READY_FOR_RELEASE"
    ],


    FRONT_DESK: [
        "RECEIVED",
        "AWAITING_APPROVAL",
        "COMPLETED",
        "CANCELLED"
    ]

};


// =====================================================
// GENERAL PERMISSION CHECK
// =====================================================

export function hasAccess(
    role,
    permission
) {

    return (
        ROLE_ACCESS[role]?.[permission] ??
        false
    );
}


// =====================================================
// REPAIR STATUS CHECK
// =====================================================

export function canChangeRepairStatus(
    role,
    status
) {

    return (
        REPAIR_STATUS_ACCESS[role]
            ?.includes(status) ??
        false
    );
}