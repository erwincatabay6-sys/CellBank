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

    const navItems = [
        {
            label: "Dashboard",
            icon: LayoutDashboard
        },
        {
            label: "Repairs",
            icon: Wrench
        },
        {
            label: "Customers",
            icon: Users
        },
        {
            label: "Technicians",
            icon: UserCog
        },
        {
            label: "Reports",
            icon: BarChart3
        },
        {
            label: "Administration",
            icon: Shield
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
                            className="nav-item"
                            type="button"
                            key={item.label}
                            title={collapsed ? item.label : undefined}
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
                    <>
                        <div className="profile-details">
                            <strong>Miguel Santos</strong>
                            <span>Technician</span>
                        </div>

                        <button
                            className="account-settings"
                            type="button"
                            aria-label="Account Settings"
                        >
                            <Settings size={18} />
                        </button>
                    </>
                )}

            </div>

        </aside>
    );
}

export default Sidebar;