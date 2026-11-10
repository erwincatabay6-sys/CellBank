import { Link } from "react-router-dom";
import Brand from "../components/Brand.jsx";
import ThemeToggle from "../components/ThemeToggle.jsx";

function PublicLayout({ children, landing = false }) {
  return (
    <div className={`public-layout${landing ? " landing-layout" : ""}`}>
      <header className="public-header">
        {landing ? (
          <>
            <Link className="landing-brand" to="/" aria-label="Cellbank home">
              Cell<span>bank</span>
            </Link>
            <nav className="landing-header-actions" aria-label="Public navigation">
              <ThemeToggle />
              <Link className="landing-sign-in" to="/login">
                Staff Sign In
              </Link>
            </nav>
          </>
        ) : (
          <>
            <Brand />
            <ThemeToggle />
          </>
        )}
      </header>

      <main className="public-content">{children}</main>
    </div>
  );
}

export default PublicLayout;
