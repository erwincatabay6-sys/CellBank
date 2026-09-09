import {
    ArrowLeft,
    Home
} from "lucide-react";

import {
    useNavigate
} from "react-router-dom";


function NotFoundPage() {

    const navigate =
        useNavigate();


    function handleGoHome() {

        navigate("/");
    }


    function handleGoBack() {

        navigate(-1);
    }


    return (
        <section className="public-card">

            {/* =========================
                HEADER
            ========================== */}
            <div className="public-card-header">

                <h2>
                    Page Not Found
                </h2>

                <p>
                    The page you requested does not
                    exist or may have been moved.
                </p>

            </div>


            {/* =========================
                404 CONTENT
            ========================== */}
            <div className="not-found-content">

                <strong className="not-found-code">
                    404
                </strong>


                <div className="not-found-actions">

                    <button
                        className="secondary-repair-button"
                        type="button"
                        onClick={
                            handleGoBack
                        }
                    >

                        <ArrowLeft
                            size={18}
                        />

                        <span>
                            Go Back
                        </span>

                    </button>


                    <button
                        className="primary-action"
                        type="button"
                        onClick={
                            handleGoHome
                        }
                    >

                        <Home
                            size={18}
                        />

                        <span>
                            Return Home
                        </span>

                    </button>

                </div>

            </div>

        </section>
    );
}


export default NotFoundPage;