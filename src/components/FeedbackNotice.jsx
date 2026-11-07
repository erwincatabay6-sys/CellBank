import { useState } from "react";
import { CircleCheck, CircleAlert, TriangleAlert, Info, X } from "lucide-react";

import "./FeedbackNotice.css";

const variants = {
  success: { Icon: CircleCheck, title: "Changes saved", role: "status" },
  error: {
    Icon: CircleAlert,
    title: "Unable to complete action",
    role: "alert",
  },
  warning: {
    Icon: TriangleAlert,
    title: "Please check before continuing",
    role: "alert",
  },
  info: { Icon: Info, title: "Information", role: "status" },
};

export function FeedbackCard({
  children,
  actions,
  variant = "error",
  title,
  className = "",
  role,
  onDismiss,
  ...props
}) {
  const status = variants[variant] || variants.error;
  const { Icon } = status;
  const heading = title || status.title;

  return (
    <div
      {...props}
      className={`feedback-notice feedback-${variant} ${className}`}
      role={role || status.role}
      aria-atomic="true"
    >
      <Icon className="feedback-status-icon" size={21} aria-hidden="true" />
      <div className="feedback-details">
        <p className="feedback-title">{heading}</p>
        <div className="feedback-notice-content">{children}</div>
        {actions && <div className="feedback-actions">{actions}</div>}
      </div>
      {onDismiss && (
        <button
          className="feedback-dismiss"
          type="button"
          aria-label={`Dismiss ${heading}`}
          onClick={onDismiss}
        >
          <X size={18} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

function Notice({ dismissible = false, ...props }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  return (
    <FeedbackCard
      {...props}
      onDismiss={dismissible ? () => setDismissed(true) : undefined}
    />
  );
}

// Inline recovery and blocking explanations remain visible by default.
export default function FeedbackNotice({
  resetKey = null,
  role,
  variant,
  ...props
}) {
  return (
    <Notice
      key={JSON.stringify(resetKey)}
      variant={variant || (role === "status" ? "info" : "error")}
      role={role}
      {...props}
    />
  );
}
