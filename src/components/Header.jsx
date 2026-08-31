import { Bell, LogOut } from "lucide-react";

function Header() {
    return (
        <header className="app-header">

            <div className="header-brand">
                <h1>Cellbank</h1>
            </div>

            <div className="header-actions">

                <button
                    className="icon-button"
                    type="button"
                    aria-label="Notifications"
                >
                    <Bell size={20} />
                </button>

                <button
                    className="logout-button"
                    type="button"
                >
                    <LogOut size={18} />
                    <span>Logout</span>
                </button>

            </div>

        </header>
    );
}

export default Header;