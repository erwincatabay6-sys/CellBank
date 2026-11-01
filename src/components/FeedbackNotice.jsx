import { useState } from "react";
import { X } from "lucide-react";

import "./FeedbackNotice.css";

function Notice({
  children,
  actions,
  className = "",
  role = "alert",
  ...props
}) {
  const [dismissed, setDismissed] = useState(false);

  return (
    <div className="feedback-container">
      {!dismissed && (
        <div
          {...props}
          className={`feedback-notice ${className}`}
          role={role}
          aria-atomic="true"
        >
          <div className="feedback-notice-content">{children}</div>
          <button
            className="feedback-dismiss"
            type="button"
            aria-label={
              role === "alert"
                ? "Dismiss error message"
                : "Dismiss feedback message"
            }
            onClick={() => setDismissed(true)}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
      )}
      {actions && <div className="feedback-actions">{actions}</div>}
    </div>
  );
}

export default function FeedbackNotice({ resetKey = null, ...props }) {
  // Only remount the notice, never its owning form or the operation state.
  return <Notice key={JSON.stringify(resetKey)} {...props} />;
}
