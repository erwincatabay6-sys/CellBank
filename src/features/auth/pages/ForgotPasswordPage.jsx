import { useEffect, useState } from "react";

import { requestPasswordRecovery } from "../../../api/authApi.js";

import { ArrowLeft, Mail } from "lucide-react";

import { Link } from "react-router-dom";

import "../auth.css";

const RECOVERY_COOLDOWN_KEY = "cellbank.recoveryResendAvailableAt";

function readRecoveryDeadline() {
  try {
    const deadline = Number(sessionStorage.getItem(RECOVERY_COOLDOWN_KEY));

    return Number.isFinite(deadline) && deadline > Date.now() ? deadline : 0;
  } catch {
    return 0;
  }
}

function ForgotPasswordPage() {
  // -----------------------------
  // RECOVERY STATE
  // -----------------------------

  const [identifier, setIdentifier] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const [message, setMessage] = useState("");

  const [resendAvailableAt, setResendAvailableAt] =
    useState(readRecoveryDeadline);

  const [secondsRemaining, setSecondsRemaining] = useState(() =>
    Math.max(0, Math.ceil((resendAvailableAt - Date.now()) / 1000)),
  );

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

  // -----------------------------
  // RECOVERY REQUEST
  // -----------------------------

  async function handleSubmit(event) {
    event.preventDefault();

    if (submitting || Date.now() < resendAvailableAt) {
      return;
    }

    setMessage("");

    const value = identifier.trim();

    if (!value) {
      setMessage("Enter your username or registered email address.");
      return;
    }

    if (value.length > 254) {
      setMessage("Username or email is too long.");
      return;
    }

    setSubmitting(true);

    try {
      await requestPasswordRecovery(value);
      const deadline = Date.now() + 60_000;

      setSecondsRemaining(60);
      setResendAvailableAt(deadline);

      try {
        sessionStorage.setItem(RECOVERY_COOLDOWN_KEY, String(deadline));
      } catch {
        // The countdown still works if browser storage is unavailable.
      }

      setMessage(
        "If an eligible account matches, recovery instructions will be sent " +
          "to its verified email address. Check your inbox and spam folder. " +
          "Please wait at least 60 seconds before requesting another email.",
      );
    } catch (error) {
      setMessage(
        error.message ||
          "Unable to request recovery instructions. Please try again later.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="public-card">
      {/* =========================
                HEADER
            ========================== */}
      <div className="public-card-header">
        <Mail size={32} />

        <h2>Forgot Password or Username?</h2>

        <p>
          Enter your username or registered email address to recover access to
          your account.
        </p>
      </div>

      {/* =========================
                RECOVERY FORM
            ========================== */}
      <form className="public-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="recovery-identifier">Username or Email</label>

          <input
            id="recovery-identifier"
            type="text"
            name="identifier"
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            placeholder={"Enter username or registered email"}
            autoComplete="username"
            disabled={submitting}
          />
        </div>

        {/* =========================
                    RESPONSE MESSAGE
                ========================== */}
        {message && (
          <div className="public-form-message" role="status">
            {message}
          </div>
        )}

        {/* =========================
                    RECOVERY ACTION
                ========================== */}
        <button
          className="primary-action"
          type="submit"
          disabled={submitting || secondsRemaining > 0}
        >
          <Mail size={20} />

          <span>
            {submitting
              ? "Sending..."
              : secondsRemaining > 0
                ? `Resend in ${secondsRemaining}s`
                : "Send Recovery Instructions"}
          </span>
        </button>

        {/* =========================
                    BACK TO LOGIN
                ========================== */}
        <Link className="auth-back-link" to="/login">
          <ArrowLeft size={16} />

          <span>Back to Login</span>
        </Link>
      </form>
    </section>
  );
}

export default ForgotPasswordPage;
