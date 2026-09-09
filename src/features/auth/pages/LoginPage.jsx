import { useState }
    from "react";

import {
    Eye,
    EyeOff,
    LogIn
} from "lucide-react";

import {
    Link,
    useNavigate
} from "react-router-dom";


function LoginPage() {

    const navigate =
        useNavigate();


    // -----------------------------
    // LOGIN STATE
    // -----------------------------

    const [
        identifier,
        setIdentifier
    ] = useState("");


    const [
        password,
        setPassword
    ] = useState("");


    const [
        showPassword,
        setShowPassword
    ] = useState(false);


    const [
        errorMessage,
        setErrorMessage
    ] = useState("");


    const [
        submitting,
        setSubmitting
    ] = useState(false);


    // -----------------------------
    // LOGIN SUBMISSION
    // -----------------------------

    function handleSubmit(event) {

        event.preventDefault();

        setErrorMessage("");


        if (!identifier.trim()) {

            setErrorMessage(
                "Enter your username or email address."
            );

            return;
        }


        if (!password) {

            setErrorMessage(
                "Enter your password."
            );

            return;
        }


        setSubmitting(true);


        // Frontend shell only.
        // Spring Boot will later:
        // 1. Verify username/email
        // 2. Verify hashed password
        // 3. Load authenticated user roles
        // 4. Create the authenticated session
        //
        // Temporary frontend navigation:

        navigate(
            "/dashboard"
        );
    }


    return (
        <section className="public-card">

            {/* =========================
                HEADER
            ========================== */}
            <div className="public-card-header">

                <h2>
                    Staff Login
                </h2>

                <p>
                    Sign in to access the
                    Cellbank management system.
                </p>

            </div>


            {/* =========================
                LOGIN FORM
            ========================== */}
            <form
                className="public-form"
                onSubmit={
                    handleSubmit
                }
            >

                {/* USERNAME OR EMAIL */}
                <div className="form-group">

                    <label htmlFor="login-identifier">
                        Username or Email
                    </label>

                    <input
                        type="text"
                        id="login-identifier"
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
                            "Enter username or email"
                        }
                        autoComplete="username"
                        disabled={
                            submitting
                        }
                    />

                </div>


                {/* PASSWORD */}
                <div className="form-group">

                    <label htmlFor="login-password">
                        Password
                    </label>


                    <div className="login-password-input">

                        <input
                            type={
                                showPassword
                                    ? "text"
                                    : "password"
                            }
                            id="login-password"
                            name="password"
                            value={
                                password
                            }
                            onChange={(event) =>
                                setPassword(
                                    event.target.value
                                )
                            }
                            placeholder="Enter password"
                            autoComplete="current-password"
                            disabled={
                                submitting
                            }
                        />


                        <button
                            type="button"
                            className="password-toggle"
                            aria-label={
                                showPassword
                                    ? "Hide password"
                                    : "Show password"
                            }
                            onClick={() =>
                                setShowPassword(
                                    !showPassword
                                )
                            }
                            disabled={
                                submitting
                            }
                        >

                            {showPassword
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


                {/* RECOVERY LINK */}
                <div className="login-recovery-link">

                    <Link to="/forgot-password">
                        Forgot password or username?
                    </Link>

                </div>


                {/* LOGIN ERROR */}
                {errorMessage && (

                    <div
                        className="public-form-error"
                        role="alert"
                    >
                        {errorMessage}
                    </div>

                )}


                {/* LOGIN ACTION */}
                <button
                    className="primary-action"
                    type="submit"
                    disabled={
                        submitting
                    }
                >

                    <LogIn size={20} />

                    <span>
                        {submitting
                            ? "Signing In..."
                            : "Login"
                        }
                    </span>

                </button>

            </form>

        </section>
    );
}


export default LoginPage;