import PendingAction from "../../../components/PendingAction.jsx";
import { useEffect, useRef, useState } from "react";
import { Mail } from "lucide-react";
import { getEmailVerificationStatus, sendEmailVerification } from "../../../api/authApi.js";
import useCountdown from "../../../hooks/useCountdown.js";
import { useAuth } from "../context/AuthContext.jsx";
import useEmailStatus from "../useEmailStatus.js";
import "../emailChallenge.css";

export default function VerifyStaffEmailPage() {
  const { user, refreshUser, logout } = useAuth();
  const { status, statusError, refreshStatus } = useEmailStatus(getEmailVerificationStatus);
  const [action, setAction] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [retryDeadline, setRetryDeadline] = useState(0);
  const checking = useRef(false);
  const cooldown = useCountdown(Math.max(status?.resendDeadline ?? 0, retryDeadline));

  useEffect(() => {
    function onFocus() {
      if (document.visibilityState === "visible" && !checking.current) {
        void refreshUser().catch(() => {});
      }
    }
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [refreshUser]);

  async function run(nextAction) {
    if (checking.current) return;
    checking.current = true;
    setAction(nextAction);
    setError("");
    setNotice("");
    try {
      if (nextAction === "send") {
        await sendEmailVerification();
        setNotice("Verification link sent. Check your inbox.");
        await refreshStatus();
      } else if (nextAction === "check") {
        const account = await refreshUser();
        if (!account.emailVerified) setNotice("Email is still unverified. Open the link from your inbox, then check again.");
      } else {
        await logout();
      }
    } catch (failure) {
      if (failure.retryAfterSeconds) setRetryDeadline(Date.now() + failure.retryAfterSeconds * 1000);
      if (nextAction === "send") await refreshStatus();
      setError(failure.message);
    } finally {
      checking.current = false;
      setAction("");
    }
  }

  return (
    <section className="staff-email-card" aria-labelledby="staff-email-title">
      <Mail className="staff-email-icon" size={32} aria-hidden="true" />
      <h2 id="staff-email-title">Verify your staff email</h2>
      <p>Verify your admin-assigned email to open the staff workspace.</p>
      <strong className="staff-email-address">{user.email}</strong>
      <div className="staff-email-buttons">
        <button className="create-repair-button" type="button" onClick={() => void run("send")}
          disabled={!status || Boolean(action) || cooldown > 0}>
          <PendingAction pending={action === "send" || (!status && !statusError)} label={cooldown ? `Resend in ${cooldown}s` : "Send verification link"}
            pendingLabel={action === "send" ? "Sending verification link" : "Checking resend availability"} reserveLabel="Send verification link" />
        </button>
        <button className="secondary-repair-button" type="button" onClick={() => void run("check")} disabled={Boolean(action)}>
          <PendingAction pending={action === "check"} label="I’ve verified my email" pendingLabel="Checking verification" />
        </button>
        {(error || statusError) && <p className="staff-email-error" role="alert">{error || statusError}</p>}
        {statusError && <button className="staff-email-link" type="button" onClick={refreshStatus}>Retry status check</button>}
        {notice && <p role="status">{notice}</p>}
      </div>
      <p>If the email address is wrong, contact your administrator.</p>
      <button className="staff-email-link" type="button" onClick={() => void run("signout")} disabled={Boolean(action)}>
        <PendingAction pending={action === "signout"} label="Sign out" pendingLabel="Signing out" />
      </button>
    </section>
  );
}
