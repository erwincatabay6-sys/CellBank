import { useState } from "react";

import { X } from "lucide-react";


function StaffAccountModal({
    initialUser = null,
    errorMessage = "",
    onClose,
    onSave
}) {

    // -----------------------------
    // MODE
    // -----------------------------

    const isEditing =
        initialUser != null;


    // -----------------------------
    // FORM STATE
    // -----------------------------

    const [name, setName] =
        useState(
            initialUser?.name ?? ""
        );

    const [username, setUsername] =
        useState(
            initialUser?.username ?? ""
        );

    const [email, setEmail] =
        useState(
            initialUser?.email ?? ""
        );

    const [password, setPassword] =
        useState("");

    const [roles, setRoles] =
        useState(
            initialUser?.roles ?? [
                "TECHNICIAN"
            ]
        );


    // -----------------------------
    // ROLE HANDLING
    // -----------------------------

    function handleRoleChange(role) {

        setRoles((currentRoles) => {

            if (
                currentRoles.includes(role)
            ) {

                // Every account must retain
                // at least one role.
                if (currentRoles.length === 1) {
                    return currentRoles;
                }


                return currentRoles.filter(
                    (currentRole) =>
                        currentRole !== role
                );
            }


            return [
                ...currentRoles,
                role
            ];
        });
    }


    // -----------------------------
    // SUBMISSION
    // -----------------------------

    function handleSubmit(event) {

        event.preventDefault();


        const userData = {
            name:
                name.trim(),

            username:
                username.trim(),

            email:
                email.trim(),

            roles
        };


        // Password remains temporary form data.
        // The backend will hash it before storage.
        if (!isEditing) {

            userData.initialPassword =
                password;
        }


        onSave(userData);
    }


    return (
        <div className="modal-backdrop">

            <div className="device-modal">

                {/* =========================
                    HEADER
                ========================== */}
                <div className="modal-header">

                    <div>

                        <h3>
                            {isEditing
                                ? "Edit Staff Account"
                                : "New Staff Account"
                            }
                        </h3>

                        <p>
                            {isEditing
                                ? "Update staff information and role access."
                                : "Create an authorized Cellbank staff account."
                            }
                        </p>

                    </div>


                    <button
                        className="modal-close-button"
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                    >
                        <X size={20} />
                    </button>

                </div>


                {/* =========================
                    STAFF FORM
                ========================== */}
                <form
                    className="device-registration-form"
                    onSubmit={handleSubmit}
                >

                    <div className="modal-form-grid">

                        {/* FULL NAME */}
                        <div className="repair-form-group">

                            <label htmlFor="staff-name">
                                Full Name
                            </label>

                            <input
                                id="staff-name"
                                type="text"
                                value={name}
                                onChange={(event) =>
                                    setName(
                                        event.target.value
                                    )
                                }
                                placeholder="Enter staff name"
                                required
                            />

                        </div>


                        {/* USERNAME */}
                        <div className="repair-form-group">

                            <label htmlFor="staff-username">
                                Username
                            </label>

                            <input
                                id="staff-username"
                                type="text"
                                value={username}
                                onChange={(event) =>
                                    setUsername(
                                        event.target.value
                                    )
                                }
                                placeholder="Enter username"
                                required
                            />

                        </div>

                    </div>


                    {/* EMAIL */}
                    <div className="repair-form-group">

                        <label htmlFor="staff-email">
                            Email Address
                        </label>

                        <input
                            id="staff-email"
                            type="email"
                            value={email}
                            onChange={(event) =>
                                setEmail(
                                    event.target.value
                                )
                            }
                            placeholder="Enter staff email"
                            required
                        />

                    </div>


                    {/* INITIAL PASSWORD */}
                    {!isEditing && (

                        <div className="repair-form-group">

                            <label htmlFor="staff-password">
                                Initial Password
                            </label>

                            <input
                                id="staff-password"
                                type="password"
                                value={password}
                                onChange={(event) =>
                                    setPassword(
                                        event.target.value
                                    )
                                }
                                placeholder="Enter initial password"
                                required
                            />

                        </div>

                    )}


                    {/* =========================
                        ROLES
                    ========================== */}
                    <div className="repair-form-group">

                        <label>
                            Roles
                        </label>


                        <div className="staff-role-options">

                            <label>

                                <input
                                    type="checkbox"
                                    checked={
                                        roles.includes(
                                            "TECHNICIAN"
                                        )
                                    }
                                    onChange={() =>
                                        handleRoleChange(
                                            "TECHNICIAN"
                                        )
                                    }
                                />

                                <span>
                                    Technician
                                </span>

                            </label>

                            <label>

                                <input
                                    type="checkbox"
                                    checked={
                                        roles.includes(
                                            "FRONT_DESK"
                                        )
                                    }
                                    onChange={() =>
                                        handleRoleChange(
                                            "FRONT_DESK"
                                        )
                                    }
                                />

                                    <span>
                                        Front Desk
                                    </span>

                            </label>


                            <label>

                                <input
                                    type="checkbox"
                                    checked={
                                        roles.includes(
                                            "ADMIN"
                                        )
                                    }
                                    onChange={() =>
                                        handleRoleChange(
                                            "ADMIN"
                                        )
                                    }
                                />

                                <span>
                                    Admin
                                </span>

                            </label>

                        </div>

                    </div>

                    {/* =========================
                        FORM ERROR
                    ========================== */}
                    {errorMessage && (

                        <div className="administration-error">

                            {errorMessage}

                         </div>

                    )}


                    {/* =========================
                        ACTIONS
                    ========================== */}
                    <div className="modal-actions">

                        <button
                            className="cancel-repair-button"
                            type="button"
                            onClick={onClose}
                        >
                            Cancel
                        </button>


                        <button
                            className="create-repair-button"
                            type="submit"
                        >
                            {isEditing
                                ? "Save Changes"
                                : "Create Account"
                            }
                        </button>

                    </div>

                </form>

            </div>

        </div>
    );
}


export default StaffAccountModal;