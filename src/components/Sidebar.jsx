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

function Sidebar({ collapsed, onToggle }) {

    const navigate = useNavigate();
    const location = useLocation();

    const navItems = [
        {
            label: "Dashboard",
            icon: LayoutDashboard,
            path: "/dashboard"
        },

        {
            label: "Repairs",
            icon: Wrench,
            path: "/repairs"
        },

        {
            label: "Customers",
            icon: Users,
            path: "/customers"
        },
        {
            label: "Technicians",
            icon: UserCog,
            path: "/technicians"
        },
        {
            label: "Reports",
            icon: BarChart3,
            path: "/reports"

        },
        {
            label: "Administration",
            icon: Shield,
            path: "/administration"
        }
    ];

    return (
        <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>

            <div className="sidebar-top">

                <button
                    className="sidebar-toggle"
                    type="button"
                    onClick={onToggle}
                    aria-label={
                        collapsed
                            ? "Expand sidebar"
                            : "Collapse sidebar"
                    }
                >
                    {collapsed
                        ? <ChevronRight size={20} />
                        : <ChevronLeft size={20} />
                    }
                </button>

            </div>

            <nav className="sidebar-nav">

                {navItems.map((item) => {

                    const Icon = item.icon;

                    return (
                        <button
                            className={
                                `nav-item ${
                                location.pathname === item.path
                                ? "active"
                                : ""
                            }`
                        }
                            type="button"
                            key={item.label}
                            title={collapsed ? item.label : undefined}
                            onClick={() => navigate(item.path)}
                        >
                            <Icon size={20} />

                            {!collapsed && (
                                <span>{item.label}</span>
                            )}
                        </button>
                    );
                })}

            </nav>

            <div className="sidebar-profile">

    <UserCircle
        className="profile-icon"
        size={34}
    />

    {!collapsed && (
        <div className="profile-details">
            <strong>Miguel Santos</strong>
            <span>Technician</span>
        </div>
    )}

    <button
        className={
            `account-settings ${
                location.pathname === "/account"
                    ? "active"
                    : ""
            }`
        }
        type="button"
        aria-label="Account Settings"
        title={collapsed ? "Account Settings" : undefined}
        onClick={() => navigate("/account")}
    >
        <Settings size={18} />
    </button>

        </div>

        </aside>
    );
}

export default Sidebar;