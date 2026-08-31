function TrackingPage() {
    return (
        <section className="public-card">

            <div className="public-card-header">
                <h2>Track Your Repair</h2>

                <p>
                    Enter the tracking code provided by Cellbank.
                </p>
            </div>

            <form className="public-form">

                <div className="form-group">

                    <label htmlFor="tracking-code">
                        Tracking Code
                    </label>

                    <input
                        type="text"
                        id="tracking-code"
                        name="tracking-code"
                        placeholder="Enter tracking code"
                    />

                </div>

                <button
                    className="primary-action"
                    type="submit"
                >
                    Check Status
                </button>

            </form>

        </section>
    );
}

export default TrackingPage;