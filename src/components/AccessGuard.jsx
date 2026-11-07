import { Navigate } from "react-router-dom";
import { hasAccess } from "../config/accessControl.js";
import { useAuth } from "../features/auth/context/AuthContext.jsx";

import FeedbackNotice from "./FeedbackNotice.jsx";

export default function AccessGuard({ permission, children }) {
  const { user, loading, authError, refreshSession } = useAuth();

  if (loading) {
    return <p role="status">Checking your session...</p>;
  }

  if (authError) {
    return (
      <FeedbackNotice
        title="Unable to check your session"
        role="alert"
        resetKey={[authError]}
        actions={
          <button type="button" onClick={() => void refreshSession()}>
            Try again
          </button>
        }
      >
        <p>{authError}</p>
      </FeedbackNotice>
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
