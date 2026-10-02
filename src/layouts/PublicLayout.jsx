import Brand from "../components/Brand.jsx";

function PublicLayout({ children }) {
  return (
    <div className="public-layout">
      <header className="public-header">
        <Brand />
      </header>

      <main className="public-content">{children}</main>
    </div>
  );
}

export default PublicLayout;
