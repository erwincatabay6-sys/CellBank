import { useState } from "react";

import FieldFeedback from "../../../components/FieldFeedback.jsx";
import { useFeedback } from "../../feedback/FeedbackProvider.jsx";
import useFeedbackState from "../../../hooks/useFeedbackState.js";
import FeedbackNotice from "../../../components/FeedbackNotice.jsx";

import { Eye, EyeOff, LockKeyhole } from "lucide-react";

import { useAuth } from "../../auth/context/AuthContext.jsx";

import LoadingSpinner from "../../../components/LoadingSpinner.jsx";

function PasswordSettings() {
  const { publish } = useFeedback();
  // -----------------------------
  // PASSWORD STATE
  // -----------------------------

  const [currentPassword, setCurrentPassword] = useState("");

  const [newPassword, setNewPassword] = useState("");

  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);

  const [showNewPassword, setShowNewPassword] = useState(false);

  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { changePassword } = useAuth();

  const [saving, setSaving] = useState(false);

  const [message, setMessage, messageVersion, messageInline, messageField] =
    useFeedbackState("");

  // -----------------------------
  // FORM RESET
  // -----------------------------

  function resetForm() {
    setCurrentPassword("");

    setNewPassword("");

    setConfirmPassword("");
  }

  // -----------------------------
  // PASSWORD SUBMISSION
  // -----------------------------

  async function handleSubmit(event) {
    event.preventDefault();

    if (saving) {
      return;
    }

    setMessage("");

    if (!currentPassword.trim() || !newPassword.trim()) {
      setMessage("Current and new passwords are required.", {
        field: !currentPassword.trim() ? "current-password" : "new-password",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage("New passwords do not match.", { field: "confirm-password" });
      return;
    }

    if (newPassword.length < 8) {
      setMessage("New password must contain at least 8 characters.", {
        field: "new-password",
      });
      return;
    }

    if (new TextEncoder().encode(newPassword).length > 72) {
      setMessage("New password must not exceed 72 UTF-8 bytes.", {
        field: "new-password",
      });
      return;
    }

    if (newPassword === currentPassword) {
      setMessage("New password must differ from your current password.", {
        field: "new-password",
      });
      return;
    }

    setSaving(true);

    try {
      await changePassword(currentPassword, newPassword);
      publish({
        variant: "success",
        title: "Password changed",
        message:
          "Your password was changed successfully. Please sign in again.",
      });
    } catch (error) {
      setMessage(
        error.errors?.currentPassword ||
          error.errors?.newPassword ||
          error.message ||
          "Unable to change your password. Please try again.",
        {
          field: error.errors?.currentPassword
            ? "current-password"
            : error.errors?.newPassword
              ? "new-password"
              : null,
          toast: Object.keys(error.errors || {}).length
            ? false
            : { variant: "error", title: "Unable to change password" },
        },
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="page-content">
      {/* =========================
                HEADER
            ========================== */}
      <div className="workspace-section-header">
        <div>
          <h3>Change Password</h3>

          <p className="workspace-section-description">
            Update the password used to access your Cellbank account.
          </p>
        </div>
      </div>

      <div className="account-security-heading">
        <LockKeyhole size={22} />

        <div>
          <strong>Account Password</strong>

          <p>Use a strong password that you do not reuse elsewhere.</p>
        </div>
      </div>

      <form className="account-settings-form" onSubmit={handleSubmit}>
        {/* =========================
                    CURRENT PASSWORD
                ========================== */}
        <div className="repair-form-group">
          <label htmlFor="current-password">Current Password</label>

          <div className="account-password-input">
            <input
              aria-invalid={messageField === "current-password"}
              aria-describedby={
                messageField === "current-password"
                  ? "current-password-feedback"
                  : undefined
              }
              id="current-password"
              type={showCurrentPassword ? "text" : "password"}
              value={currentPassword}
              disabled={saving}
              onChange={(event) => setCurrentPassword(event.target.value)}
              autoComplete="current-password"
              required
            />

            <button
              type="button"
              aria-label={
                showCurrentPassword
                  ? "Hide current password"
                  : "Show current password"
              }
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
            >
              {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <FieldFeedback
            id="current-password"
            field={messageField}
            message={message}
          />
        </div>

        {/* =========================
                    NEW PASSWORD
                ========================== */}
        <div className="repair-form-group">
          <label htmlFor="new-password">New Password</label>

          <div className="account-password-input">
            <input
              aria-invalid={messageField === "new-password"}
              aria-describedby={
                messageField === "new-password"
                  ? "new-password-feedback"
                  : undefined
              }
              id="new-password"
              type={showNewPassword ? "text" : "password"}
              value={newPassword}
              disabled={saving}
              onChange={(event) => setNewPassword(event.target.value)}
              minLength={8}
              autoComplete="new-password"
              required
            />

            <button
              type="button"
              aria-label={
                showNewPassword ? "Hide new password" : "Show new password"
              }
              onClick={() => setShowNewPassword(!showNewPassword)}
            >
              {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <FieldFeedback
            id="new-password"
            field={messageField}
            message={message}
          />

          <small className="account-field-hint">Minimum of 8 characters.</small>
        </div>

        {/* =========================
                    CONFIRM PASSWORD
                ========================== */}
        <div className="repair-form-group">
          <label htmlFor="confirm-password">Confirm New Password</label>

          <div className="account-password-input">
            <input
              aria-invalid={messageField === "confirm-password"}
              aria-describedby={
                messageField === "confirm-password"
                  ? "confirm-password-feedback"
                  : undefined
              }
              id="confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              disabled={saving}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              required
            />

            <button
              type="button"
              aria-label={
                showConfirmPassword
                  ? "Hide confirmed password"
                  : "Show confirmed password"
              }
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <FieldFeedback
            id="confirm-password"
            field={messageField}
            message={message}
          />
        </div>

        {/* =========================
                    MESSAGE
                ========================== */}
        {message && messageInline && !messageField && (
          <FeedbackNotice
            title="Check your password"
            className="account-form-message"
            role="alert"
            resetKey={[message, messageVersion]}
          >
            {message}
          </FeedbackNotice>
        )}

        {/* =========================
                    ACTION
                ========================== */}
        <div className="finding-form-actions">
          <button
            className="create-repair-button"
            type="submit"
            disabled={saving}
            aria-busy={saving}
          >
            {saving && <LoadingSpinner size={18} />}

            <span>{saving ? "Changing Password..." : "Change Password"}</span>
          </button>
        </div>
      </form>
    </section>
  );
}

export default PasswordSettings;
