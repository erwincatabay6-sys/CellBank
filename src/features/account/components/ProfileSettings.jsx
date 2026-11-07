import { useState } from "react";

import FieldFeedback from "../../../components/FieldFeedback.jsx";
import useFeedbackState from "../../../hooks/useFeedbackState.js";
import FeedbackNotice from "../../../components/FeedbackNotice.jsx";

import { useAuth } from "../../auth/context/AuthContext.jsx";

import { Camera, UserCircle } from "lucide-react";

import LoadingSpinner from "../../../components/LoadingSpinner.jsx";

function ProfileSettings({ user }) {
  // -----------------------------
  // PROFILE STATE
  // -----------------------------

  const [fullName, setFullName] = useState(user.name);

  const profileImage = user.profileImageUrl;
  const [uploadingImage, setUploadingImage] = useState(false);
  const [, setImageMessage] = useFeedbackState("", {
    toast: { variant: "success", title: "Profile picture updated" },
  });
  const [
    imageError,
    setImageError,
    imageErrorVersion,
    imageErrorInline,
    imageErrorField,
  ] = useFeedbackState("");
  const { updateProfile, uploadProfileImage } = useAuth();

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useFeedbackState("", {
    toast: { variant: "success", title: "Profile updated" },
  });
  const [error, setError, errorVersion, errorInline, errorField] =
    useFeedbackState("");
  // -----------------------------
  // PROFILE IMAGE
  // -----------------------------

  async function handleProfileImageChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || uploadingImage) {
      return;
    }

    setImageMessage("");
    setImageError("");

    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setImageError("Please select a JPG or PNG image.", {
        field: "profile-picture",
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setImageError("Please select an image no larger than 2 MB.", {
        field: "profile-picture",
      });
      return;
    }

    setUploadingImage(true);

    try {
      await uploadProfileImage(file);
      setImageMessage("Profile picture updated successfully.");
    } catch (error) {
      setImageError(error.message || "Unable to upload your profile picture.", {
        toast: { variant: "error", title: "Unable to upload picture" },
      });
    } finally {
      setUploadingImage(false);
    }
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
      setError("Full name is required.", { field: "account-full-name" });
      return;
    }

    if (name.length > 120) {
      setError("Full name must not exceed 120 characters.", {
        field: "account-full-name",
      });
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
        {
          field: error.errors?.name ? "account-full-name" : null,
          toast: Object.keys(error.errors || {}).length
            ? false
            : { variant: "error", title: "Unable to update profile" },
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
              aria-busy={uploadingImage}
              aria-disabled={uploadingImage}
            >
              {uploadingImage ? (
                <LoadingSpinner size={18} />
              ) : (
                <Camera size={18} />
              )}

              <span>{uploadingImage ? "Uploading..." : "Choose Image"}</span>
            </label>

            <input
              id="profile-picture"
              aria-invalid={imageErrorField === "profile-picture"}
              aria-describedby={
                imageErrorField ? "profile-picture-feedback" : undefined
              }
              type="file"
              accept="image/jpeg,image/png"
              onChange={handleProfileImageChange}
              disabled={uploadingImage}
              hidden
            />
          </div>
        </div>

        {uploadingImage && <p role="status">Uploading picture...</p>}

        <FieldFeedback
          id="profile-picture"
          field={imageErrorField}
          message={imageError}
        />

        {imageError && imageErrorInline && !imageErrorField && (
          <FeedbackNotice
            title="Check your profile picture"
            className="account-form-message"
            role="alert"
            resetKey={[imageError, imageErrorVersion]}
          >
            {imageError}
          </FeedbackNotice>
        )}

        {/* =========================
                    PERSONAL INFORMATION
                ========================== */}
        <div className="repair-form-group">
          <label htmlFor="account-full-name">Full Name</label>

          <input
            aria-invalid={errorField === "account-full-name"}
            aria-describedby={
              errorField === "account-full-name"
                ? "account-full-name-feedback"
                : undefined
            }
            id="account-full-name"
            type="text"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            maxLength={120}
            disabled={saving}
            required
          />
          <FieldFeedback
            id="account-full-name"
            field={errorField}
            message={error}
          />
        </div>

        {/* =========================
                    SAVE ACTION
                ========================== */}

        {error && errorInline && !errorField && (
          <FeedbackNotice
            title="Check your name"
            className="account-form-message"
            role="alert"
            resetKey={[error, errorVersion]}
          >
            {error}
          </FeedbackNotice>
        )}

        <div className="finding-form-actions">
          <button
            className="create-repair-button"
            type="submit"
            disabled={saving}
            aria-busy={saving}
          >
            {saving && <LoadingSpinner size={18} />}

            <span>{saving ? "Saving..." : "Save Full Name"}</span>
          </button>
        </div>
      </form>
    </section>
  );
}

export default ProfileSettings;
