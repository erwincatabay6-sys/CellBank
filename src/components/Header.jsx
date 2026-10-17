import { useState } from "react";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { RequestError } from "../api/http.js";

import { useAuth } from "../features/auth/context/AuthContext.jsx";

import Brand from "./Brand.jsx";
import NotificationBell from "./NotificationBell.jsx";
import ThemeToggle from "./ThemeToggle.jsx";

function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();


  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

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
      );
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <header className="app-header">
      <Brand />
      

      <div className="header-actions">
        {user?.id != null && <NotificationBell key={user.id} />}
        <ThemeToggle />

        {logoutError && <span role="alert">{logoutError}</span>}

        <button
          className="logout-button"
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
        >
          <LogOut size={18} />
          <span>{loggingOut ? "Signing out..." : "Logout"}</span>
        </button>
      </div>
    </header>
  );
}

export default Header;
