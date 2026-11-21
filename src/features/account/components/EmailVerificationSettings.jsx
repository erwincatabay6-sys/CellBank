import { useRef, useState } from "react";
import { MailCheck } from "lucide-react";

import {
  confirmPendingEmailChange,
  getPendingEmailChange,
  resendPendingEmailCode,
} from "../../../api/authApi.js";
import { useAuth } from "../../auth/context/AuthContext.jsx";
import useEmailStatus from "../../auth/useEmailStatus.js";
import EmailChangeDialog from "./EmailChangeDialog.jsx";

export default function EmailVerificationSettings({ user }) {
  const { refreshUser } = useAuth();
  const { status, statusError, refreshStatus } = useEmailStatus(getPendingEmailChange);
  const [trigger, setTrigger] = useState(null);
  const [action, setAction] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [retryDeadline, setRetryDeadline] = useState(0);
  const [profileRefreshNeeded, setProfileRefreshNeeded] = useState(false);
  const busy = useRef(false);
  const headingRef = useRef(null);

  async function changeEmail(nextAction, code) {
    if (busy.current) return false;
    busy.current = true;
    setAction(nextAction);
    setError("");
    setNotice("");
    try {
      if (nextAction === "confirm") {
        await confirmPendingEmailChange(code);
        setProfileRefreshNeeded(true);
      } else if (nextAction === "resend") {
        await resendPendingEmailCode();
        setNotice("A new code was sent. Check your inbox.");
      }

      if (nextAction === "confirm" || nextAction === "refresh") {
        try {
          await refreshUser();
          setProfileRefreshNeeded(false);
          setNotice("Your new email is confirmed.");
        } catch {
          setNotice("Your email was confirmed. Refresh your account to see the active address.");
        }
      }
      await refreshStatus();
      return true;
    } catch (failure) {
      if (failure.retryAfterSeconds) {
        setRetryDeadline(Date.now() + failure.retryAfterSeconds * 1000);
      }
      if (failure.outcomeUncertain && nextAction === "confirm") {
        try {
          await refreshUser();
        } catch {
          // Keep the request error visible when the profile cannot be reconciled.
        }
      }
      // The fifth wrong code can remove the proposal even when the response is 400.
      await refreshStatus();
      setError(
        failure.status === 429
          ? "Please wait before requesting another code."
          : failure.message,
      );
      return false;
    } finally {
      busy.current = false;
      setAction("");
    }
  }

  function openDialog(event) {
    setError("");
    setNotice("");
    setTrigger(event.currentTarget);
    void refreshStatus();
  }

  return (
    <section className="page-content account-panel">
      <div className="workspace-section-header">
        <div>
          <h3 ref={headingRef} tabIndex={-1}>Email Verification</h3>
          <p className="workspace-section-description">Manage your staff email and recovery address.</p>
        </div>
      </div>
      <div className="email-verification-card">
        <div className="email-verification-icon"><MailCheck size={28} aria-hidden="true" /></div>
        <div className="email-verification-details">
          <span>Registered Email</span>
          <strong>{user.email}</strong>
          <div className="email-verification-status"><span className="verified">Verified</span></div>
          <p>This email stays active for account recovery until you confirm a replacement.</p>
          {status?.pending && <p>A replacement email is waiting for your confirmation.</p>}
        </div>
        {(status?.pending || trigger) && (
          <button type="button" className="secondary-repair-button" aria-haspopup="dialog" onClick={openDialog}>
            Confirm new email
          </button>
        )}
      </div>
      {statusError && !trigger && (
        <p className="staff-email-error" role="alert">
          {statusError}{" "}
          <button className="staff-email-link" type="button" onClick={refreshStatus}>Retry status check</button>
        </p>
      )}
      {notice && !trigger && <p role="status">{notice}</p>}
      {profileRefreshNeeded && !trigger && (
        <button className="staff-email-link" type="button" disabled={Boolean(action)}
          onClick={() => void changeEmail("refresh")}>Refresh account</button>
      )}
      {trigger && (
        <EmailChangeDialog
          trigger={trigger}
          fallbackFocus={headingRef}
          status={status}
          statusError={statusError}
          refreshStatus={refreshStatus}
          profileRefreshNeeded={profileRefreshNeeded}
          action={action}
          error={error}
          notice={notice}
          retryDeadline={retryDeadline}
          onAction={changeEmail}
          onClose={() => setTrigger(null)}
        />
      )}
    </section>
  );
}
