import { useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { MailCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

import { verifyEmail } from "../../../api/authApi.js";

import "../auth.css";

function VerifyEmailPage() {
  const location = useLocation();
  const { user, refreshSession } = useAuth();

  const token = new URLSearchParams(location.hash.slice(1)).get("token");
  const validTokenFormat = /^[A-Za-z0-9_-]{43}$/.test(token || "");

  const requestInProgress = useRef(false);

  const [submitting, setSubmitting] = useState(false);
  const [verified, setVerified] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleVerify() {
    if (!validTokenFormat || verified || requestInProgress.current) {
      return;
    }

    requestInProgress.current = true;
    setSubmitting(true);
    setErrorMessage("");

    try {
      await verifyEmail(token);
      setVerified(true);

      if (user) {
        await refreshSession();
      }
    } catch (error) {
      setErrorMessage(
        error.message || "Unable to verify your email. Please try again.",
      );
    } finally {
      requestInProgress.current = false;
      setSubmitting(false);
    }
  }

  return (
    <section className="public-card">
      <div className="public-card-header">
        <MailCheck size={32} />

        <h2>{verified ? "Email Verified" : "Confirm Your Email"}</h2>

        <p>
          {verified
            ? "Your email address has been verified successfully."
            : "Click the button below to confirm your Cellbank email address."}
        </p>
      </div>

      <div className="public-form">
        {!validTokenFormat && (
          <div className="public-form-error" role="alert">
            This verification link is incomplete or invalid. Request a new link
            from Account Settings.
          </div>
        )}

        {errorMessage && (
          <div className="public-form-error" role="alert">
            {errorMessage}
          </div>
        )}

        {verified && (
          <div className="public-form-success" role="status">
            Email verified successfully. You can return to Cellbank.
          </div>
        )}

        {validTokenFormat && !verified && (
          <button
            className="primary-action"
            type="button"
            onClick={handleVerify}
            disabled={submitting}
          >
            <MailCheck size={20} />
            <span>{submitting ? "Verifying..." : "Verify Email"}</span>
          </button>
        )}

        <Link className="auth-back-link" to="/account">
          Return to Account Settings
        </Link>

        <Link className="auth-back-link" to="/login">
          Back to Login
        </Link>
      </div>
    </section>
  );
}

export default VerifyEmailPage;
