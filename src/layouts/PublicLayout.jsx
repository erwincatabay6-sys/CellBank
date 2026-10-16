import Brand from "../components/Brand.jsx";
import ThemeToggle from "../components/ThemeToggle.jsx";

function PublicLayout({ children }) {
  return (
    <div className="public-layout">
      <header className="public-header">
        <Brand />
        <ThemeToggle />
      </header>

      <main className="public-content">{children}</main>
    </div>
  );
}

export default PublicLayout;
