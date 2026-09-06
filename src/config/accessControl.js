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
// VALID ROLE NAMES
// =====================================================

export const VALID_ROLES = [
    "ADMIN",
    "TECHNICIAN",
    "FRONT_DESK"
];


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
// NORMALIZE ROLES
// Supports both:
// "TECHNICIAN"
// ["TECHNICIAN", "FRONT_DESK"]
// =====================================================

export function normalizeRoles(roles) {

    if (typeof roles === "string") {

        return [
            roles
        ];
    }


    if (!Array.isArray(roles)) {

        return [];
    }


    return [
        ...new Set(roles)
    ];
}


// =====================================================
// VALID ROLE COMBINATION CHECK
// =====================================================

export function isValidRoleCombination(roles) {

    const normalizedRoles =
        normalizeRoles(roles);


    if (normalizedRoles.length === 0) {

        return false;
    }


    const containsOnlyValidRoles =
        normalizedRoles.every(
            (role) =>
                VALID_ROLES.includes(
                    role
                )
        );


    if (!containsOnlyValidRoles) {

        return false;
    }


    // -----------------------------
    // ADMIN IS EXCLUSIVE
    // -----------------------------

    if (
        normalizedRoles.includes(
            "ADMIN"
        )
    ) {

        return (
            normalizedRoles.length === 1
        );
    }


    // -----------------------------
    // SINGLE OPERATIONAL ROLE
    // -----------------------------

    if (
        normalizedRoles.length === 1
    ) {

        return (
            normalizedRoles[0] ===
                "TECHNICIAN" ||

            normalizedRoles[0] ===
                "FRONT_DESK"
        );
    }


    // -----------------------------
    // ONLY ALLOWED MULTI-ROLE
    // TECHNICIAN + FRONT DESK
    // -----------------------------

    if (
        normalizedRoles.length === 2
    ) {

        return (
            normalizedRoles.includes(
                "TECHNICIAN"
            ) &&

            normalizedRoles.includes(
                "FRONT_DESK"
            )
        );
    }


    return false;
}


// =====================================================
// ROLE CHECK
// =====================================================

export function hasRole(
    roles,
    role
) {

    const normalizedRoles =
        normalizeRoles(roles);


    if (
        !isValidRoleCombination(
            normalizedRoles
        )
    ) {

        return false;
    }


    return normalizedRoles.includes(
        role
    );
}


// =====================================================
// GENERAL PERMISSION CHECK
// =====================================================

export function hasAccess(
    roles,
    permission
) {

    const normalizedRoles =
        normalizeRoles(roles);


    if (
        !isValidRoleCombination(
            normalizedRoles
        )
    ) {

        return false;
    }


    return normalizedRoles.some(
        (role) =>
            ROLE_ACCESS[role]?.[
                permission
            ] === true
    );
}


// =====================================================
// REPAIR STATUS CHECK
// =====================================================

export function canChangeRepairStatus(
    roles,
    status
) {

    const normalizedRoles =
        normalizeRoles(roles);


    if (
        !isValidRoleCombination(
            normalizedRoles
        )
    ) {

        return false;
    }


    return normalizedRoles.some(
        (role) =>
            REPAIR_STATUS_ACCESS[role]
                ?.includes(status) ===
                    true
    );
}