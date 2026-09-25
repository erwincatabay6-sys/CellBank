import { useState } from "react";

import { Eye, EyeOff, LockKeyhole } from "lucide-react";

import { useAuth } from "../../auth/context/AuthContext.jsx";

function PasswordSettings() {
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

  const [message, setMessage] = useState("");

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
      setMessage("Current and new passwords are required.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage("New passwords do not match.");
      return;
    }

    if (newPassword.length < 8) {
      setMessage("New password must contain at least 8 characters.");
      return;
    }

    if (new TextEncoder().encode(newPassword).length > 72) {
      setMessage("New password must not exceed 72 UTF-8 bytes.");
      return;
    }

    if (newPassword === currentPassword) {
      setMessage("New password must differ from your current password.");
      return;
    }

    setSaving(true);

    try {
      await changePassword(currentPassword, newPassword);
    } catch (error) {
      setMessage(
        error.errors?.currentPassword ||
          error.errors?.newPassword ||
          error.message ||
          "Unable to change your password. Please try again.",
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
        </div>

        {/* =========================
                    NEW PASSWORD
                ========================== */}
        <div className="repair-form-group">
          <label htmlFor="new-password">New Password</label>

          <div className="account-password-input">
            <input
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

          <small className="account-field-hint">Minimum of 8 characters.</small>
        </div>

        {/* =========================
                    CONFIRM PASSWORD
                ========================== */}
        <div className="repair-form-group">
          <label htmlFor="confirm-password">Confirm New Password</label>

          <div className="account-password-input">
            <input
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
        </div>

        {/* =========================
                    MESSAGE
                ========================== */}
        {message && (
          <p className="account-form-message" role="alert">
            {message}
          </p>
        )}

        {/* =========================
                    ACTION
                ========================== */}
        <div className="finding-form-actions">
          <button
            className="create-repair-button"
            type="submit"
            disabled={saving}
          >
            {saving ? "Changing Password..." : "Change Password"}
          </button>
        </div>
      </form>
    </section>
  );
}

export default PasswordSettings;
