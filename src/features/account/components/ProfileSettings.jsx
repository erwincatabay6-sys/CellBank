import { useState }
    from "react";

import {
    Camera,
    UserCircle
} from "lucide-react";


function ProfileSettings({
    user
}) {

    // -----------------------------
    // PROFILE STATE
    // -----------------------------

    const [
        fullName,
        setFullName
    ] = useState(
        user.name
    );


    const [
        profileImage,
        setProfileImage
    ] = useState(null);


    // -----------------------------
    // PROFILE IMAGE
    // -----------------------------

    function handleProfileImageChange(
        event
    ) {

        const file =
            event.target.files?.[0];


        if (!file) {
            return;
        }


        const imageUrl =
            URL.createObjectURL(
                file
            );


        setProfileImage(
            imageUrl
        );
    }


    // -----------------------------
    // PROFILE SUBMISSION
    // -----------------------------

    function handleSubmit(event) {

        event.preventDefault();


        // Frontend shell only.
        // Spring Boot will later update:
        // - profile picture
        // - full name
    }


    return (
        <section className="page-content">

            {/* =========================
                HEADER
            ========================== */}
            <div className="workspace-section-header">

                <div>

                    <h3>
                        Profile
                    </h3>

                    <p className="workspace-section-description">
                        Update your profile picture
                        and personal information.
                    </p>

                </div>

            </div>


            <form
                className="account-settings-form"
                onSubmit={
                    handleSubmit
                }
            >

                {/* =========================
                    PROFILE PICTURE
                ========================== */}
                <div className="profile-picture-section">

                    <div className="profile-picture-preview">

                        {profileImage
                            ? (
                                <img
                                    src={
                                        profileImage
                                    }
                                    alt="Profile"
                                />
                            )
                            : (
                                <UserCircle
                                    size={72}
                                />
                            )
                        }

                    </div>


                    <div>

                        <strong>
                            Profile Picture
                        </strong>

                        <p>
                            Choose an image for
                            your staff profile.
                        </p>


                        <label
                            className="secondary-repair-button"
                            htmlFor="profile-picture"
                        >

                            <Camera
                                size={18}
                            />

                            <span>
                                Choose Image
                            </span>

                        </label>


                        <input
                            id="profile-picture"
                            type="file"
                            accept="image/*"
                            onChange={
                                handleProfileImageChange
                            }
                            hidden
                        />

                    </div>

                </div>


                {/* =========================
                    PERSONAL INFORMATION
                ========================== */}
                <div className="repair-form-group">

                    <label htmlFor="account-full-name">
                        Full Name
                    </label>

                    <input
                        id="account-full-name"
                        type="text"
                        value={
                            fullName
                        }
                        onChange={(event) =>
                            setFullName(
                                event.target.value
                            )
                        }
                        required
                    />

                </div>


                {/* =========================
                    SAVE ACTION
                ========================== */}
                <div className="finding-form-actions">

                    <button
                        className="create-repair-button"
                        type="submit"
                    >
                        Save Profile Changes
                    </button>

                </div>

            </form>

        </section>
    );
}


export default ProfileSettings;