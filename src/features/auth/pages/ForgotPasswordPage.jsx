import { useState }
    from "react";

import {
    ArrowLeft,
    Mail
} from "lucide-react";

import { Link }
    from "react-router-dom";

import "../auth.css";


function ForgotPasswordPage() {

    // -----------------------------
    // RECOVERY STATE
    // -----------------------------

    const [
        identifier,
        setIdentifier
    ] = useState("");


    const [
        submitting,
        setSubmitting
    ] = useState(false);


    const [
        message,
        setMessage
    ] = useState("");


    // -----------------------------
    // RECOVERY REQUEST
    // -----------------------------

    function handleSubmit(event) {

        event.preventDefault();


        if (!identifier.trim()) {

            setMessage(
                "Enter your username or registered email address."
            );

            return;
        }


        setSubmitting(true);


        // Frontend shell only.
        //
        // Spring Boot will later:
        // 1. Find the account using username or email
        // 2. Generate a secure recovery token
        // 3. Send recovery instructions
        //    to the registered email
        // 4. Keep this response generic
        //    whether the account exists or not

        setMessage(
            "If a matching account exists, recovery instructions have been sent to its registered email address."
        );


        setSubmitting(false);
    }


    return (
        <section className="public-card">

            {/* =========================
                HEADER
            ========================== */}
            <div className="public-card-header">

                <Mail size={32} />

                <h2>
                    Forgot Password or Username?
                </h2>

                <p>
                    Enter your username or registered
                    email address to recover access
                    to your account.
                </p>

            </div>


            {/* =========================
                RECOVERY FORM
            ========================== */}
            <form
                className="public-form"
                onSubmit={
                    handleSubmit
                }
            >

                <div className="form-group">

                    <label htmlFor="recovery-identifier">
                        Username or Email
                    </label>

                    <input
                        id="recovery-identifier"
                        type="text"
                        name="identifier"
                        value={
                            identifier
                        }
                        onChange={(event) =>
                            setIdentifier(
                                event.target.value
                            )
                        }
                        placeholder={
                            "Enter username or registered email"
                        }
                        autoComplete="username"
                        disabled={
                            submitting
                        }
                    />

                </div>


                {/* =========================
                    RESPONSE MESSAGE
                ========================== */}
                {message && (

                    <div
                        className="public-form-message"
                        role="status"
                    >
                        {message}
                    </div>

                )}


                {/* =========================
                    RECOVERY ACTION
                ========================== */}
                <button
                    className="primary-action"
                    type="submit"
                    disabled={
                        submitting
                    }
                >

                    <Mail size={20} />

                    <span>
                        {submitting
                            ? "Sending..."
                            : "Send Recovery Instructions"
                        }
                    </span>

                </button>


                {/* =========================
                    BACK TO LOGIN
                ========================== */}
                <Link
                    className="auth-back-link"
                    to="/login"
                >

                    <ArrowLeft size={16} />

                    <span>
                        Back to Login
                    </span>

                </Link>

            </form>

        </section>
    );
}


export default ForgotPasswordPage;