import { useState }
    from "react";

import {
    Eye,
    EyeOff,
    KeyRound
} from "lucide-react";

import {
    Link,
    useNavigate
} from "react-router-dom";

import "../auth.css";


function ResetPasswordPage() {

    const navigate =
        useNavigate();


    // -----------------------------
    // PASSWORD STATE
    // -----------------------------

    const [
        newPassword,
        setNewPassword
    ] = useState("");


    const [
        confirmPassword,
        setConfirmPassword
    ] = useState("");


    const [
        showNewPassword,
        setShowNewPassword
    ] = useState(false);


    const [
        showConfirmPassword,
        setShowConfirmPassword
    ] = useState(false);


    const [
        errorMessage,
        setErrorMessage
    ] = useState("");


    const [
        successMessage,
        setSuccessMessage
    ] = useState("");


    const [
        submitting,
        setSubmitting
    ] = useState(false);


    // -----------------------------
    // RESET PASSWORD
    // -----------------------------

    function handleSubmit(event) {

        event.preventDefault();


        setErrorMessage("");

        setSuccessMessage("");


        if (!newPassword) {

            setErrorMessage(
                "Enter a new password."
            );

            return;
        }


        if (
            newPassword.length < 8
        ) {

            setErrorMessage(
                "Password must contain at least 8 characters."
            );

            return;
        }


        if (
            newPassword !==
            confirmPassword
        ) {

            setErrorMessage(
                "Passwords do not match."
            );

            return;
        }


        setSubmitting(true);


        // Frontend shell only.
        //
        // Spring Boot will later:
        // 1. Validate the recovery token
        // 2. Ensure it has not expired
        // 3. Ensure it has not been used
        // 4. Hash the new password
        // 5. Update the account
        // 6. Invalidate the recovery token
        // 7. Invalidate appropriate sessions

        setSuccessMessage(
            "Your password has been reset successfully."
        );


        setSubmitting(false);


        setNewPassword("");

        setConfirmPassword("");
    }


    // -----------------------------
    // RETURN TO LOGIN
    // -----------------------------

    function handleReturnToLogin() {

        navigate(
            "/login"
        );
    }


    return (
        <section className="public-card">

            {/* =========================
                HEADER
            ========================== */}
            <div className="public-card-header">

                <KeyRound size={32} />

                <h2>
                    Reset Password
                </h2>

                <p>
                    Create a new password
                    for your Cellbank account.
                </p>

            </div>


            {/* =========================
                RESET FORM
            ========================== */}
            <form
                className="public-form"
                onSubmit={
                    handleSubmit
                }
            >

                {/* NEW PASSWORD */}
                <div className="form-group">

                    <label htmlFor="reset-new-password">
                        New Password
                    </label>


                    <div className="login-password-input">

                        <input
                            id="reset-new-password"
                            type={
                                showNewPassword
                                    ? "text"
                                    : "password"
                            }
                            value={
                                newPassword
                            }
                            onChange={(event) =>
                                setNewPassword(
                                    event.target.value
                                )
                            }
                            placeholder="Enter new password"
                            autoComplete="new-password"
                            disabled={
                                submitting
                            }
                        />


                        <button
                            className="password-toggle"
                            type="button"
                            aria-label={
                                showNewPassword
                                    ? "Hide new password"
                                    : "Show new password"
                            }
                            onClick={() =>
                                setShowNewPassword(
                                    !showNewPassword
                                )
                            }
                            disabled={
                                submitting
                            }
                        >

                            {showNewPassword
                                ? (
                                    <EyeOff
                                        size={18}
                                    />
                                )
                                : (
                                    <Eye
                                        size={18}
                                    />
                                )
                            }

                        </button>

                    </div>


                    <small className="auth-field-hint">
                        Minimum of 8 characters.
                    </small>

                </div>


                {/* CONFIRM PASSWORD */}
                <div className="form-group">

                    <label htmlFor="reset-confirm-password">
                        Confirm New Password
                    </label>


                    <div className="login-password-input">

                        <input
                            id="reset-confirm-password"
                            type={
                                showConfirmPassword
                                    ? "text"
                                    : "password"
                            }
                            value={
                                confirmPassword
                            }
                            onChange={(event) =>
                                setConfirmPassword(
                                    event.target.value
                                )
                            }
                            placeholder="Confirm new password"
                            autoComplete="new-password"
                            disabled={
                                submitting
                            }
                        />


                        <button
                            className="password-toggle"
                            type="button"
                            aria-label={
                                showConfirmPassword
                                    ? "Hide confirmed password"
                                    : "Show confirmed password"
                            }
                            onClick={() =>
                                setShowConfirmPassword(
                                    !showConfirmPassword
                                )
                            }
                            disabled={
                                submitting
                            }
                        >

                            {showConfirmPassword
                                ? (
                                    <EyeOff
                                        size={18}
                                    />
                                )
                                : (
                                    <Eye
                                        size={18}
                                    />
                                )
                            }

                        </button>

                    </div>

                </div>


                {/* ERROR */}
                {errorMessage && (

                    <div
                        className="public-form-error"
                        role="alert"
                    >
                        {errorMessage}
                    </div>

                )}


                {/* SUCCESS */}
                {successMessage && (

                    <div
                        className="public-form-success"
                        role="status"
                    >
                        {successMessage}
                    </div>

                )}


                {/* ACTION */}
                {!successMessage && (

                    <button
                        className="primary-action"
                        type="submit"
                        disabled={
                            submitting
                        }
                    >

                        <KeyRound size={20} />

                        <span>
                            {submitting
                                ? "Resetting..."
                                : "Reset Password"
                            }
                        </span>

                    </button>

                )}


                {/* SUCCESS RETURN */}
                {successMessage && (

                    <button
                        className="primary-action"
                        type="button"
                        onClick={
                            handleReturnToLogin
                        }
                    >
                        Back to Login
                    </button>

                )}


                {!successMessage && (

                    <Link
                        className="auth-back-link"
                        to="/login"
                    >
                        Back to Login
                    </Link>

                )}

            </form>

        </section>
    );
}


export default ResetPasswordPage;