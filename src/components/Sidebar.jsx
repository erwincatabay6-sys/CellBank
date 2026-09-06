import {
    useLocation,
    useNavigate
} from "react-router-dom";

import {
    LayoutDashboard,
    Wrench,
    Users,
    UserCog,
    BarChart3,
    Shield,
    Settings,
    UserCircle,
    ChevronLeft,
    ChevronRight
} from "lucide-react";

import {
    hasAccess,
    normalizeRoles,
    isValidRoleCombination
} from "../config/accessControl.js";


const navItems = [
    {
        label: "Dashboard",
        icon: LayoutDashboard,
        path: "/dashboard",
        permission: "dashboard"
    },
    {
        label: "Repairs",
        icon: Wrench,
        path: "/repairs",
        permission: "repairs"
    },
    {
        label: "Customers",
        icon: Users,
        path: "/customers",
        permission: "customers"
    },
    {
        label: "Technicians",
        icon: UserCog,
        path: "/technicians",
        permission: "technicians"
    },
    {
        label: "Reports",
        icon: BarChart3,
        path: "/reports",
        permission: "reports"
    },
    {
        label: "Administration",
        icon: Shield,
        path: "/administration",
        permission: "administration"
    }
];


function Sidebar({
    collapsed,
    onToggle,
    currentRoles,
    currentUserName
}) {

    const navigate =
        useNavigate();

    const location =
        useLocation();


    // -----------------------------
    // NORMALIZED ROLES
    // -----------------------------

    const normalizedRoles =
        normalizeRoles(
            currentRoles
        );


    const validRoleCombination =
        isValidRoleCombination(
            normalizedRoles
        );


    // -----------------------------
    // VISIBLE NAVIGATION
    // -----------------------------

    const visibleNavItems =
        navItems.filter(
            (item) =>
                hasAccess(
                    currentRoles,
                    item.permission
                )
        );


    // -----------------------------
    // ACTIVE ROUTE
    // -----------------------------

    function isActivePath(path) {

        if (
            location.pathname === path
        ) {
            return true;
        }


        return location.pathname.startsWith(
            `${path}/`
        );
    }


    // -----------------------------
    // DISPLAYED USER INFORMATION
    // -----------------------------

    const displayUserName =
        currentUserName ||
        "Unknown User";


    let currentRoleLabel =
        "No Role";


    if (validRoleCombination) {

        if (
            normalizedRoles.includes(
                "ADMIN"
            )
        ) {

            currentRoleLabel =
                "Administrator";

        }
        else if (
            normalizedRoles.includes(
                "TECHNICIAN"
            ) &&
            normalizedRoles.includes(
                "FRONT_DESK"
            )
        ) {

            currentRoleLabel =
                "Technician / Front Desk";

        }
        else if (
            normalizedRoles.includes(
                "TECHNICIAN"
            )
        ) {

            currentRoleLabel =
                "Technician";

        }
        else if (
            normalizedRoles.includes(
                "FRONT_DESK"
            )
        ) {

            currentRoleLabel =
                "Front Desk";

        }

    }


    return (
        <aside
            className={
                `sidebar ${
                    collapsed
                        ? "collapsed"
                        : ""
                }`
            }
        >

            {/* =========================
                SIDEBAR TOGGLE
            ========================== */}
            <div className="sidebar-top">

                <button
                    className="sidebar-toggle"
                    type="button"
                    onClick={
                        onToggle
                    }
                    aria-label={
                        collapsed
                            ? "Expand sidebar"
                            : "Collapse sidebar"
                    }
                >

                    {collapsed
                        ? (
                            <ChevronRight
                                size={20}
                            />
                        )
                        : (
                            <ChevronLeft
                                size={20}
                            />
                        )
                    }

                </button>

            </div>


            {/* =========================
                NAVIGATION
            ========================== */}
            <nav className="sidebar-nav">

                {visibleNavItems.map(
                    (item) => {

                        const Icon =
                            item.icon;


                        return (
                            <button
                                key={
                                    item.label
                                }
                                className={
                                    `nav-item ${
                                        isActivePath(
                                            item.path
                                        )
                                            ? "active"
                                            : ""
                                    }`
                                }
                                type="button"
                                title={
                                    collapsed
                                        ? item.label
                                        : undefined
                                }
                                onClick={() =>
                                    navigate(
                                        item.path
                                    )
                                }
                            >

                                <Icon
                                    size={20}
                                />


                                {!collapsed && (

                                    <span>
                                        {
                                            item.label
                                        }
                                    </span>

                                )}

                            </button>
                        );
                    }
                )}

            </nav>


            {/* =========================
                USER PROFILE
            ========================== */}
            <div className="sidebar-profile">

                <UserCircle
                    className="profile-icon"
                    size={34}
                />


                {!collapsed && (

                    <div className="profile-details">

                        <strong>
                            {
                                displayUserName
                            }
                        </strong>

                        <span>
                            {
                                currentRoleLabel
                            }
                        </span>

                    </div>

                )}


                {hasAccess(
                    currentRoles,
                    "accountSettings"
                ) && (

                    <button
                        className={
                            `account-settings ${
                                location.pathname ===
                                    "/account"
                                    ? "active"
                                    : ""
                            }`
                        }
                        type="button"
                        aria-label="Account Settings"
                        title={
                            collapsed
                                ? "Account Settings"
                                : undefined
                        }
                        onClick={() =>
                            navigate(
                                "/account"
                            )
                        }
                    >

                        <Settings
                            size={18}
                        />

                    </button>

                )}

            </div>

        </aside>
    );
}


export default Sidebar;