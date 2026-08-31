function PublicLayout({ children }) {
    return (
        <div className="public-layout">

            <header className="public-header">
                <h1>Cellbank</h1>
            </header>

            <main className="public-content">
                {children}
            </main>

        </div>
    );
}

export default PublicLayout;