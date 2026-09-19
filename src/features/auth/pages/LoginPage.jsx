import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

import { Eye, EyeOff, LogIn } from "lucide-react";

import { Link, useNavigate } from "react-router-dom";

function LoginPage() {
  const navigate = useNavigate();

  const { login, loading, sessionMessage } = useAuth();

  // -----------------------------
  // LOGIN STATE
  // -----------------------------

  const [identifier, setIdentifier] = useState("");

  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  const [submitting, setSubmitting] = useState(false);

  // -----------------------------
  // LOGIN SUBMISSION
  // -----------------------------

  async function handleSubmit(event) {
    event.preventDefault();

    if (submitting || loading) {
      return;
    }

    setErrorMessage("");

    if (!identifier.trim() || !password) {
      setErrorMessage("Please enter your username or email and password.");
      return;
    }

    setSubmitting(true);

    try {
      await login(identifier, password);
      navigate("/dashboard", { replace: true });
    } catch (error) {
      if (error.status === 401) {
        setErrorMessage(
          "Unable to sign in. Check your credentials or contact your administrator.",
        );
      } else if (error.status === 403) {
        setErrorMessage(
          "Your security token could not be verified. Please try signing in again.",
        );
      } else {
        setErrorMessage(
          "Unable to connect or complete sign-in. Please try again.",
        );
      }
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
        <h2>Staff Login</h2>

        <p>Sign in to access the Cellbank management system.</p>
      </div>

      {/* =========================
                LOGIN FORM
            ========================== */}
      <form className="public-form" onSubmit={handleSubmit}>
        {/* USERNAME OR EMAIL */}
        <div className="form-group">
          <label htmlFor="login-identifier">Username or Email</label>

          <input
            type="text"
            id="login-identifier"
            name="identifier"
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            placeholder={"Enter username or email"}
            autoComplete="username"
            disabled={submitting}
          />
        </div>

        {/* PASSWORD */}
        <div className="form-group">
          <label htmlFor="login-password">Password</label>

          <div className="login-password-input">
            <input
              type={showPassword ? "text" : "password"}
              id="login-password"
              name="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter password"
              autoComplete="current-password"
              disabled={submitting}
            />

            <button
              type="button"
              className="password-toggle"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword(!showPassword)}
              disabled={submitting}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* RECOVERY LINK */}
        <div className="login-recovery-link">
          <Link to="/forgot-password">Forgot password or username?</Link>
        </div>

        {/* LOGIN ERROR */}
        {(errorMessage || sessionMessage) && (
          <div className="public-form-error" role="alert">
            {errorMessage || sessionMessage}
          </div>
        )}

        {/* LOGIN ACTION */}
        <button
          className="primary-action"
          type="submit"
          disabled={submitting || loading}
        >
          <LogIn size={20} />

          <span>{submitting ? "Signing In..." : "Login"}</span>
        </button>
      </form>
    </section>
  );
}

export default LoginPage;
