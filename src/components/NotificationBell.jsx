import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../api/notificationApi.js";

const dateFormatter = new Intl.DateTimeFormat("en-PH", {
  timeZone: "Asia/Manila",
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function formatTimestamp(value) {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Time unavailable"
    : dateFormatter.format(date);
}

export default function NotificationBell() {
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const wrapperRef = useRef(null);
  const bellRef = useRef(null);
  const readControllerRef = useRef(null);
  const actionControllerRef = useRef(null);
  const busyRef = useRef(false);

  const loadNotifications = useCallback(async () => {
    if (busyRef.current) {
      return;
    }

    readControllerRef.current?.abort();

    const controller = new AbortController();
    readControllerRef.current = controller;

    setLoading(true);

    try {
      const result = await getNotifications({
        signal: controller.signal,
      });

      if (controller.signal.aborted) {
        return;
      }

      setData(result);
      setError("");
    } catch (requestError) {
      if (!controller.signal.aborted) {
        setError(requestError.message || "Could not load notifications.");
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadNotifications();

    function refreshWhenVisible() {
      if (document.visibilityState === "visible") {
        loadNotifications();
      }
    }

    const intervalId = window.setInterval(refreshWhenVisible, 30_000);

    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", refreshWhenVisible);

      readControllerRef.current?.abort();
      actionControllerRef.current?.abort();
    };
  }, [loadNotifications]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleOutsideClick(event) {
      if (!wrapperRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setOpen(false);
        bellRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function togglePanel() {
    if (!open) {
      loadNotifications();
    }

    setOpen(!open);
  }

  async function handleReadAction(notification = null) {
    if (busyRef.current) {
      return;
    }

    busyRef.current = true;
    setBusy(true);
    setError("");

    readControllerRef.current?.abort();
    setLoading(false);

    const controller = new AbortController();
    actionControllerRef.current = controller;

    let succeeded = false;

    try {
      if (notification) {
        if (!notification.read) {
          await markNotificationAsRead(notification.id, {
            signal: controller.signal,
          });
        }
      } else {
        await markAllNotificationsAsRead({
          signal: controller.signal,
        });
      }

      if (controller.signal.aborted) {
        return;
      }

      succeeded = true;

      if (notification?.repairJobId != null) {
        setOpen(false);
        navigate(`/repairs/${notification.repairJobId}`);
      }
    } catch (requestError) {
      if (!controller.signal.aborted) {
        setError(requestError.message || "Could not update notifications.");
      }
    } finally {
      busyRef.current = false;

      if (!controller.signal.aborted) {
        setBusy(false);

        if (succeeded) {
          loadNotifications();
        }
      }
    }
  }

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  return (
    <div className="notification-wrapper" ref={wrapperRef}>
      <button
        ref={bellRef}
        className="icon-button"
        type="button"
        aria-label={
          unreadCount > 0
            ? `Notifications, ${unreadCount} unread`
            : "Notifications"
        }
        aria-expanded={open}
        aria-controls="notification-panel"
        onClick={togglePanel}
      >
        <Bell size={20} />

        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          id="notification-panel"
          className="notification-panel"
          role="region"
          aria-label="Notifications"
        >
          <div className="notification-header">
            <strong>Notifications</strong>

            {unreadCount > 0 && (
              <button
                className="notification-mark-all"
                type="button"
                disabled={busy || loading}
                onClick={() => handleReadAction()}
              >
                <CheckCheck size={15} />
                Mark all read
              </button>
            )}
          </div>

          {error && (
            <div className="notification-feedback" role="alert">
              <span>{error}</span>
              <button
                type="button"
                onClick={loadNotifications}
                disabled={busy || loading}
              >
                Retry
              </button>
            </div>
          )}

          {(loading || busy) && (
            <div className="notification-status" role="status">
              {busy
                ? "Saving read status..."
                : data
                  ? "Refreshing..."
                  : "Loading notifications..."}
            </div>
          )}

          <div className="notification-list" aria-busy={loading || busy}>
            {notifications.map((notification) => (
              <button
                key={notification.id}
                className={`notification-item ${
                  notification.read ? "read" : "unread"
                }`}
                type="button"
                disabled={busy}
                onClick={() => handleReadAction(notification)}
              >
                <span className="notification-content">
                  <span className="notification-message">
                    {notification.message}
                  </span>

                  <time
                    className="notification-time"
                    dateTime={notification.createdAt}
                  >
                    {formatTimestamp(notification.createdAt)} PHT
                  </time>
                </span>

                {!notification.read && (
                  <span
                    className="notification-unread-dot"
                    aria-label="Unread"
                  />
                )}
              </button>
            ))}

            {data && notifications.length === 0 && !loading && !error && (
              <div className="notification-empty">No notifications yet.</div>
            )}
          </div>

          {notifications.length === 50 && (
            <div className="notification-status">
              Showing your latest 50 notifications.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
