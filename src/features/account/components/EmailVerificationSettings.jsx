import { useEffect, useRef, useState } from "react";

import { useAuth } from "../../auth/context/AuthContext.jsx";
import { MailCheck, MailWarning, Send } from "lucide-react";

import {
  sendEmailVerification,
  getEmailVerificationStatus,
} from "../../../api/authApi.js";

function EmailVerificationSettings({ user }) {
  const { refreshUser } = useAuth();

  const emailVerified = user.emailVerified === true;
  const sendInProgress = useRef(false);

  const [verificationRequested, setVerificationRequested] = useState(false);
  const [sending, setSending] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [statusError, setStatusError] = useState("");

  const [resendAvailableAt, setResendAvailableAt] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(0);

  useEffect(() => {
    if (!resendAvailableAt) {
      return;
    }

    function updateCountdown() {
      const remaining = Math.max(
        0,
        Math.ceil((resendAvailableAt - Date.now()) / 1000),
      );

      setSecondsRemaining(remaining);
      return remaining;
    }

    updateCountdown();

    const intervalId = window.setInterval(() => {
      if (updateCountdown() === 0) {
        window.clearInterval(intervalId);
      }
    }, 250);

    return () => window.clearInterval(intervalId);
  }, [resendAvailableAt]);

  useEffect(() => {
    if (emailVerified) {
      setCheckingStatus(false);
      setResendAvailableAt(0);
      setSecondsRemaining(0);
      setStatusError("");
      return;
    }

    if (sending) {
      return;
    }

    let active = true;
    let refreshing = false;

    function applyVerificationStatus(status) {
      const remainingMilliseconds =
        !status.emailVerified && status.resendAvailableAt
          ? Math.max(
              0,
              Date.parse(status.resendAvailableAt) -
                Date.parse(status.serverTime),
            )
          : 0;

      setResendAvailableAt(
        remainingMilliseconds > 0 ? Date.now() + remainingMilliseconds : 0,
      );

      setSecondsRemaining(Math.ceil(remainingMilliseconds / 1000));
    }

    async function synchronizeStatus() {
      if (!active || refreshing || sendInProgress.current) {
        return;
      }

      refreshing = true;
      setCheckingStatus(true);
      setStatusError("");

      try {
        const status = await getEmailVerificationStatus();

        if (!active || sendInProgress.current) {
          return;
        }

        applyVerificationStatus(status);

        if (status.emailVerified !== emailVerified) {
          await refreshUser();
        }
      } catch (error) {
        if (active && error.status !== 401) {
          setStatusError(
            "Unable to refresh verification status. Please refresh the page.",
          );
        }
      } finally {
        refreshing = false;

        if (active) {
          setCheckingStatus(false);
        }
      }
    }

    function handleReturnToPage() {
      if (document.visibilityState === "visible") {
        void synchronizeStatus();
      }
    }

    void synchronizeStatus();

    window.addEventListener("focus", handleReturnToPage);
    document.addEventListener("visibilitychange", handleReturnToPage);

    return () => {
      active = false;
      window.removeEventListener("focus", handleReturnToPage);
      document.removeEventListener("visibilitychange", handleReturnToPage);
    };
  }, [emailVerified, sending, refreshUser, user.id, user.email]);

  async function handleSendVerification() {
    if (
      emailVerified ||
      sendInProgress.current ||
      checkingStatus ||
      Date.now() < resendAvailableAt
    ) {
      return;
    }

    sendInProgress.current = true;
    setSending(true);
    setErrorMessage("");
    setStatusError("");
    setVerificationRequested(false);

    try {
      await sendEmailVerification();
      setVerificationRequested(true);
    } catch (error) {
      setErrorMessage(
        error.message ||
          "Unable to send the verification email. Please try again.",
      );
    } finally {
      // Keep the button disabled while the effect reloads the cooldown.
      setCheckingStatus(true);
      sendInProgress.current = false;
      setSending(false);
    }
  }

  return (
    <section className="page-content">
      <div className="workspace-section-header">
        <div>
          <h3>Email Verification</h3>

          <p className="workspace-section-description">
            Verify your registered email for account recovery and security
            notifications.
          </p>
        </div>
      </div>

      <div className="email-verification-card">
        <div className="email-verification-icon">
          {emailVerified ? <MailCheck size={28} /> : <MailWarning size={28} />}
        </div>

        <div className="email-verification-details">
          <span>Registered Email</span>

          <strong>{user.email}</strong>

          <div className="email-verification-status">
            <span className={emailVerified ? "verified" : "unverified"}>
              {emailVerified ? "Verified" : "Unverified"}
            </span>
          </div>

          <p>
            {emailVerified
              ? "This email can be used for account recovery and security notifications."
              : "Open the verification link sent to this email address to verify it."}
          </p>
        </div>

        {!emailVerified && (
          <button
            className="secondary-repair-button"
            type="button"
            onClick={handleSendVerification}
            disabled={sending || checkingStatus || secondsRemaining > 0}
          >
            <Send size={18} />

            <span>
              {sending
                ? "Sending..."
                : checkingStatus
                  ? "Checking..."
                  : secondsRemaining > 0
                    ? `Resend in ${secondsRemaining}s`
                    : verificationRequested
                      ? "Resend Verification"
                      : "Send Verification"}
            </span>
          </button>
        )}
      </div>

      {verificationRequested && !emailVerified && (
        <p className="account-form-message">
          Verification instructions have been sent to your registered email
          address.
        </p>
      )}

      {errorMessage && !emailVerified && (
        <p className="account-form-message" role="alert">
          {errorMessage}
        </p>
      )}

      {statusError && !emailVerified && (
        <p className="account-form-message" role="alert">
          {statusError}
        </p>
      )}
    </section>
  );
}

export default EmailVerificationSettings;
