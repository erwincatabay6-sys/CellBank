import { Navigate } from "react-router-dom";
import { hasAccess } from "../config/accessControl.js";
import { useAuth } from "../features/auth/context/AuthContext.jsx";

export default function AccessGuard({ permission, children }) {
  const { user, loading, authError, refreshSession } = useAuth();

  if (loading) {
    return <p role="status">Checking your session...</p>;
  }

  if (authError) {
    return (
      <div role="alert">
        <p>{authError}</p>
        <button type="button" onClick={() => void refreshSession()}>
          Try again
        </button>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!hasAccess(user.roles, permission)) {
    return <Navigate to="/access-denied" replace />;
  }

  return children;
}
