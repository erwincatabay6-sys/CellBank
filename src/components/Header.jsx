import {
    useEffect,
    useMemo,
    useState
} from "react";

import {
    Bell,
    CheckCheck,
    LogOut
} from "lucide-react";

import { useNavigate }
    from "react-router-dom";

import { hasRole }
    from "../config/accessControl.js";


const notifications = [
    {
        id: 1,
        message:
            "Repair CB-2026-00124 was assigned to you.",
        target:
            "/repairs/1",
        roles: [
            "TECHNICIAN"
        ],
        userName:
            "Miguel Santos"
    },
    {
        id: 2,
        message:
            "Repair CB-2026-00126 is ready for release.",
        target:
            "/repairs/3",
        roles: [
            "ADMIN",
            "FRONT_DESK"
        ]
    },
    {
        id: 3,
        message:
            "Repair CB-2026-00124 is awaiting parts.",
        target:
            "/repairs/1",
        roles: [
            "ADMIN",
            "TECHNICIAN"
        ],
        userName:
            "Miguel Santos"
    }
];


function getStoredReadNotificationIds(
    userName
) {

    if (typeof sessionStorage === "undefined") {
        return [];
    }


    try {

        const storedValue =
            sessionStorage.getItem(
                `cellbank-read-notifications:${
                    userName || "unknown"
                }`
            );


        const parsedValue =
            storedValue
                ? JSON.parse(storedValue)
                : [];


        return Array.isArray(parsedValue)
            ? parsedValue
            : [];

    }
    catch {
        return [];
    }
}


function Header({
    currentRoles,
    currentUserName
}) {

    const navigate =
        useNavigate();


    const [
        notificationsOpen,
        setNotificationsOpen
    ] = useState(false);


    const [
        readNotificationIds,
        setReadNotificationIds
    ] = useState(() =>
        getStoredReadNotificationIds(
            currentUserName
        )
    );


    // -----------------------------
    // READ-STATE PERSISTENCE
    // -----------------------------

    useEffect(() => {

        if (typeof sessionStorage === "undefined") {
            return;
        }


        sessionStorage.setItem(
            `cellbank-read-notifications:${
                currentUserName || "unknown"
            }`,
            JSON.stringify(
                readNotificationIds
            )
        );

    }, [
        currentUserName,
        readNotificationIds
    ]);


    // -----------------------------
    // ROLE-AWARE NOTIFICATIONS
    // -----------------------------

    const visibleNotifications =
        useMemo(
            () =>
                notifications.filter(
                    (notification) => {

                        const roleAllowed =
                            notification.roles.some(
                                (role) =>
                                    hasRole(
                                        currentRoles,
                                        role
                                    )
                            );


                        const userAllowed =
                            !notification.userName ||
                            notification.userName ===
                                currentUserName ||
                            hasRole(
                                currentRoles,
                                "ADMIN"
                            );


                        return (
                            roleAllowed &&
                            userAllowed
                        );
                    }
                ),
            [
                currentRoles,
                currentUserName
            ]
        );


    const unreadCount =
        visibleNotifications.filter(
            (notification) =>
                !readNotificationIds.includes(
                    notification.id
                )
        ).length;


    // -----------------------------
    // NOTIFICATION ACTIONS
    // -----------------------------

    function markAsRead(notificationId) {

        setReadNotificationIds(
            (currentIds) =>
                currentIds.includes(
                    notificationId
                )
                    ? currentIds
                    : [
                        ...currentIds,
                        notificationId
                    ]
        );
    }


    function handleNotificationClick(
        notification
    ) {

        markAsRead(
            notification.id
        );

        setNotificationsOpen(false);

        navigate(
            notification.target
        );
    }


    function handleMarkAllRead() {

        setReadNotificationIds(
            (currentIds) => [
                ...new Set([
                    ...currentIds,
                    ...visibleNotifications.map(
                        (notification) =>
                            notification.id
                    )
                ])
            ]
        );
    }


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
                        aria-expanded={notificationsOpen}
                        onClick={() =>
                            setNotificationsOpen(
                                !notificationsOpen
                            )
                        }
                    >
                        <Bell size={20} />

                        {unreadCount > 0 && (

                            <span className="notification-badge">
                                {unreadCount}
                            </span>

                        )}
                    </button>


                    {notificationsOpen && (

                        <div className="notification-panel">

                            <div className="notification-header">

                                <strong>
                                    Notifications
                                </strong>

                                {unreadCount > 0 && (

                                    <button
                                        className="notification-mark-all"
                                        type="button"
                                        onClick={handleMarkAllRead}
                                    >
                                        <CheckCheck size={15} />
                                        Mark all read
                                    </button>

                                )}

                            </div>


                            <div className="notification-list">

                                {visibleNotifications.length > 0 ? (

                                    visibleNotifications.map(
                                        (notification) => {

                                            const isRead =
                                                readNotificationIds.includes(
                                                    notification.id
                                                );


                                            return (
                                                <button
                                                    key={notification.id}
                                                    className={
                                                        `notification-item ${
                                                            isRead
                                                                ? "read"
                                                                : "unread"
                                                        }`
                                                    }
                                                    type="button"
                                                    onClick={() =>
                                                        handleNotificationClick(
                                                            notification
                                                        )
                                                    }
                                                >
                                                    <span className="notification-message">
                                                        {notification.message}
                                                    </span>

                                                    {!isRead && (
                                                        <span
                                                            className="notification-unread-dot"
                                                            aria-label="Unread"
                                                        />
                                                    )}
                                                </button>
                                            );
                                        }
                                    )

                                ) : (

                                    <div className="notification-empty">
                                        No notifications available.
                                    </div>

                                )}

                            </div>

                        </div>

                    )}

                </div>


                <button
                    className="logout-button"
                    type="button"
                    onClick={() =>
                        navigate(
                            "/login"
                        )
                    }
                >
                    <LogOut size={18} />
                    <span>Logout</span>
                </button>

            </div>

        </header>
    );
}


export default Header;
