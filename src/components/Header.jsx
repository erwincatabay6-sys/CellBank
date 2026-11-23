import PendingAction from "./PendingAction.jsx";
import { useEffect, useRef, useState } from "react";
import { LogOut, Menu } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { RequestError } from "../api/http.js";

import useFeedbackState from "../hooks/useFeedbackState.js";
import FeedbackNotice from "./FeedbackNotice.jsx";

import { useAuth } from "../features/auth/context/AuthContext.jsx";

import Brand from "./Brand.jsx";
import MobileStaffDrawer from "./MobileStaffDrawer.jsx";
import NotificationBell from "./NotificationBell.jsx";
import ThemeToggle from "./ThemeToggle.jsx";

function Header({ currentRoles, currentUserName }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const menuRef = useRef(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError, logoutErrorVersion, logoutErrorInline] =
    useFeedbackState("");

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.key]);

  useEffect(() => {
    const mobile = window.matchMedia("(max-width: 650px), (max-width: 950px) and (max-height: 500px) and (pointer: coarse)");
    function handleBreakpoint(event) {
      if (!event.matches) setDrawerOpen(false);
    }
    mobile.addEventListener("change", handleBreakpoint);
    return () => mobile.removeEventListener("change", handleBreakpoint);
  }, []);

  async function handleLogout() {
    if (loggingOut) {
      return;
    }

    setLoggingOut(true);
    setLogoutError("");

    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      setLogoutError(
        error instanceof RequestError
          ? error.outcomeUncertain
            ? "Could not confirm sign-out because the connection was interrupted. " +
              "Refresh the page to check your session."
            : error.message
          : error.message || "Could not sign out. Please try again.",
        {
          toast: drawerOpen || error.outcomeUncertain
            ? false
            : { variant: "error", title: "Unable to sign out" },
        },
      );
    } finally {
      setLoggingOut(false);
    }
  }

  const sessionNotice = logoutError && logoutErrorInline && (
    <FeedbackNotice
      title="Check your session"
      role="alert"
      resetKey={[logoutError, logoutErrorVersion]}
    >
      {logoutError}
    </FeedbackNotice>
  );

  const logoutButton = (
    <button
      className="logout-button"
      type="button"
      onClick={handleLogout}
      disabled={loggingOut}
    >
      <PendingAction pending={loggingOut} label="Logout" pendingLabel="Signing out" icon={<LogOut size={18} aria-hidden="true" />} />
    </button>
  );

  return (
    <>
      <header className="app-header">
        <button
          ref={menuRef}
          className="icon-button staff-menu-button"
          type="button"
          aria-label="Open navigation menu"
          aria-haspopup="dialog"
          aria-expanded={drawerOpen}
          aria-controls={drawerOpen ? "staff-navigation-drawer" : undefined}
          onClick={() => setDrawerOpen(true)}
        >
          <Menu size={22} aria-hidden="true" />
        </button>
        <Brand />

        <div className="header-actions">
          {user?.id != null && <NotificationBell key={user.id} drawerOpen={drawerOpen} />}
          <ThemeToggle />
          {sessionNotice}
          {logoutButton}
        </div>
      </header>
      {drawerOpen && (
        <MobileStaffDrawer
          opener={menuRef.current}
          onDismiss={() => setDrawerOpen(false)}
          currentRoles={currentRoles}
          currentUserName={currentUserName}
        >
          <ThemeToggle drawer />
          {sessionNotice}
          {logoutButton}
        </MobileStaffDrawer>
      )}
    </>
  );
}

export default Header;
