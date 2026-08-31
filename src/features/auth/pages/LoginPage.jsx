import { LogIn } from "lucide-react";

function LoginPage() {
    return (
        <section className="public-card">

            <div className="public-card-header">
                <h2>Staff Login</h2>

                <p>
                    Sign in to access the Cellbank management system.
                </p>
            </div>

            <form className="public-form">

                <div className="form-group">

                    <label htmlFor="username">
                        Username
                    </label>

                    <input
                        type="text"
                        id="username"
                        name="username"
                        placeholder="Enter username"
                    />

                </div>

                <div className="form-group">

                    <label htmlFor="password">
                        Password
                    </label>

                    <input
                        type="password"
                        id="password"
                        name="password"
                        placeholder="Enter password"
                    />

                </div>

                <button
                    className="primary-action"
                    type="submit"
                >
                    <LogIn size={20} />
                    <span>Login</span>
                </button>

            </form>

        </section>
    );
}

export default LoginPage;