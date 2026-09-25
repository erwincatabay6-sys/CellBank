import { useState } from "react";

import { useAuth } from "../../auth/context/AuthContext.jsx";

import { Camera, UserCircle } from "lucide-react";

function ProfileSettings({ user }) {
  // -----------------------------
  // PROFILE STATE
  // -----------------------------

  const [fullName, setFullName] = useState(user.name);

  const [profileImage, setProfileImage] = useState(null);
  const { updateProfile } = useAuth();

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  // -----------------------------
  // PROFILE IMAGE
  // -----------------------------

  function handleProfileImageChange(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const imageUrl = URL.createObjectURL(file);

    setProfileImage(imageUrl);
  }

  // -----------------------------
  // PROFILE SUBMISSION
  // -----------------------------

  async function handleSubmit(event) {
    event.preventDefault();

    if (saving) {
      return;
    }

    setMessage("");
    setError("");

    const name = fullName.trim();

    if (!name) {
      setError("Full name is required.");
      return;
    }

    if (name.length > 120) {
      setError("Full name must not exceed 120 characters.");
      return;
    }

    setSaving(true);

    try {
      const updatedUser = await updateProfile(name);

      setFullName(updatedUser.name);
      setMessage("Full name updated successfully.");
    } catch (error) {
      setError(
        error.errors?.name ||
          error.message ||
          "Unable to update your name. Please try again.",
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
          <h3>Profile</h3>

          <p className="workspace-section-description">
            Update your profile picture and personal information.
          </p>
        </div>
      </div>

      <form className="account-settings-form" onSubmit={handleSubmit}>
        {/* =========================
                    PROFILE PICTURE
                ========================== */}
        <div className="profile-picture-section">
          <div className="profile-picture-preview">
            {profileImage ? (
              <img src={profileImage} alt="Profile" />
            ) : (
              <UserCircle size={72} />
            )}
          </div>

          <div>
            <strong>Profile Picture</strong>

            <p>Choose an image for your staff profile.</p>

            <label
              className="secondary-repair-button"
              htmlFor="profile-picture"
            >
              <Camera size={18} />

              <span>Choose Image</span>
            </label>

            <input
              id="profile-picture"
              type="file"
              accept="image/*"
              onChange={handleProfileImageChange}
              hidden
            />
          </div>
        </div>

        {/* =========================
                    PERSONAL INFORMATION
                ========================== */}
        <div className="repair-form-group">
          <label htmlFor="account-full-name">Full Name</label>

          <input
            id="account-full-name"
            type="text"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            maxLength={120}
            disabled={saving}
            required
          />
        </div>

        {/* =========================
                    SAVE ACTION
                ========================== */}
        {message && (
          <p className="account-form-message" role="status">
            {message}
          </p>
        )}

        {error && (
          <p className="account-form-message" role="alert">
            {error}
          </p>
        )}

        <div className="finding-form-actions">
          <button
            className="create-repair-button"
            type="submit"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Full Name"}
          </button>
        </div>
      </form>
    </section>
  );
}

export default ProfileSettings;
