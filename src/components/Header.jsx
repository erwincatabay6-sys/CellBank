import { useState } from "react";
import { Bell, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

function Header() {

    const navigate = useNavigate();

    const [notificationsOpen, setNotificationsOpen] =
    useState(false);

     const notifications = [
        {
            id: 1,
            message: "Repair CB-2026-00124 was assigned to you.",
            target: "/repairs"
        },
        {
            id: 2,
            message: "A repair is ready for release.",
            target: "/repairs"
        },
        {
            id: 3,
            message: "A repair is awaiting parts.",
            target: "/repairs"
        }
    ];

    return (
    <header className="app-header">

        <div className="header-brand">
            <h1>Cellbank</h1>
        </div>

        <div className="header-actions">

            <div className="notification-wrapper">

                <button
                    className="icon-button"
                    type="button"
                    aria-label="Notifications"
                    onClick={() =>
                        setNotificationsOpen(!notificationsOpen)
                    }
                >
                    <Bell size={20} />

                    {notifications.length > 0 && (
                        <span className="notification-badge">
                            {notifications.length}
                        </span>
                    )}
                </button>

                {notificationsOpen && (
                    <div className="notification-panel">

                        <div className="notification-header">
                            <strong>Notifications</strong>
                        </div>

                        <div className="notification-list">

                            {notifications.map((notification) => (
                                <button
                                    key={notification.id}
                                    className="notification-item"
                                    type="button"
                                    onClick={() => {
                                        navigate(notification.target);
                                        setNotificationsOpen(false);
                                    }}
                                >
                                    {notification.message}
                                </button>
                            ))}

                        </div>

                    </div>
                )}

            </div>

            <button
                className="logout-button"
                type="button"
                onClick={() => navigate("/login")}
            >
                <LogOut size={18} />
                <span>Logout</span>
            </button>

        </div>

    </header>
);
}
export default Header;