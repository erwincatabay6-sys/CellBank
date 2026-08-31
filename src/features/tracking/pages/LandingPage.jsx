import { useNavigate } from "react-router-dom";
import { Search, LogIn } from "lucide-react";

function LandingPage() {

    const navigate = useNavigate();

    return (
        <section className="landing-card">

            <div className="landing-copy">
                <h2>Welcome to Cellbank</h2>

                <p>
                    Track your repair status or continue to the staff
                    management system.
                </p>
            </div>

            <div className="landing-actions">

                <button
                    className="primary-action"
                    type="button"
                    onClick={() => navigate("/track")}
                >
                    <Search size={20} />
                    <span>Track My Repair</span>
                </button>

                <button
                    className="secondary-action"
                    type="button"
                    onClick={() => navigate("/login")}
                >
                    <LogIn size={20} />
                    <span>Staff Login</span>
                </button>

            </div>

        </section>
    );
}

export default LandingPage;