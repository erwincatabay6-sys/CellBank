import {
    useState
} from "react";

import {
    Search,
    RotateCcw
} from "lucide-react";

import StatusBadge
    from "../../../components/StatusBadge.jsx";

import "../tracking.css";


// =====================================================
// TEMPORARY PUBLIC TRACKING DATA
// =====================================================
// This will later come from:
// GET /api/tracking/{trackingCode}

const mockTrackingRecords = [
    {
        trackingCode:
            "CB-2026-001",

        device:
            "Samsung Galaxy A54",

        status:
            "IN_PROGRESS",

        receivedAt:
            "September 1, 2026",

        lastUpdated:
            "September 8, 2026",

        statusHistory: [
            {
                id: 1,

                status:
                    "RECEIVED",

                date:
                    "September 1, 2026",

                description:
                    "Device received by Cellbank."
            },

            {
                id: 2,

                status:
                    "AWAITING_APPROVAL",

                date:
                    "September 2, 2026",

                description:
                    "Repair assessment completed and awaiting approval."
            },

            {
                id: 3,

                status:
                    "IN_PROGRESS",

                date:
                    "September 3, 2026",

                description:
                    "Repair work is currently in progress."
            }
        ]
    }
];


function TrackingPage() {

    // -----------------------------
    // TRACKING STATE
    // -----------------------------

    const [
        trackingCode,
        setTrackingCode
    ] = useState("");


    const [
        trackingResult,
        setTrackingResult
    ] = useState(null);


    const [
        errorMessage,
        setErrorMessage
    ] = useState("");


    const [
        submitting,
        setSubmitting
    ] = useState(false);


    // -----------------------------
    // TRACK REPAIR
    // -----------------------------

    function handleSubmit(event) {

        event.preventDefault();


        setErrorMessage("");


        const normalizedCode =
            trackingCode
                .trim()
                .toUpperCase();


        if (!normalizedCode) {

            setErrorMessage(
                "Enter your tracking code."
            );

            return;
        }


        setSubmitting(true);


        // Frontend mock lookup only.
        // Spring Boot will later perform
        // the actual tracking request.

        const repair =
            mockTrackingRecords.find(
                (record) =>
                    record.trackingCode ===
                        normalizedCode
            );


        if (!repair) {

            setTrackingResult(null);

            setErrorMessage(
                "Repair not found. Check the tracking code and try again."
            );

            setSubmitting(false);

            return;
        }


        setTrackingResult(
            repair
        );


        setSubmitting(false);
    }


    // -----------------------------
    // NEW SEARCH
    // -----------------------------

    function handleNewSearch() {

        setTrackingCode("");

        setTrackingResult(null);

        setErrorMessage("");
    }


    return (
        <section
            className={
                `public-card tracking-card ${
                    trackingResult
                        ? "has-result"
                        : ""
                }`
            }
        >

            {!trackingResult ? (

                <>
                    {/* =========================
                        TRACKING FORM
                    ========================== */}
                    <div className="public-card-header">

                        <h2>
                            Track Your Repair
                        </h2>

                        <p>
                            Enter the tracking code
                            provided by Cellbank.
                        </p>

                    </div>


                    <form
                        className="public-form"
                        onSubmit={
                            handleSubmit
                        }
                    >

                        <div className="form-group">

                            <label htmlFor="tracking-code">
                                Tracking Code
                            </label>

                            <input
                                type="text"
                                id="tracking-code"
                                name="tracking-code"
                                value={
                                    trackingCode
                                }
                                onChange={(event) =>
                                    setTrackingCode(
                                        event.target.value
                                    )
                                }
                                placeholder="e.g. CB-2026-001"
                                autoComplete="off"
                                disabled={
                                    submitting
                                }
                            />

                        </div>


                        {/* =========================
                            TRACKING ERROR
                        ========================== */}
                        {errorMessage && (

                            <div
                                className="public-form-error"
                                role="alert"
                            >
                                {errorMessage}
                            </div>

                        )}


                        <button
                            className="primary-action"
                            type="submit"
                            disabled={
                                submitting
                            }
                        >

                            <Search
                                size={20}
                            />

                            <span>
                                {submitting
                                    ? "Checking..."
                                    : "Check Status"
                                }
                            </span>

                        </button>

                    </form>
                </>

            ) : (

                <>
                    {/* =========================
                        RESULT HEADER
                    ========================== */}
                    <div className="tracking-result-header">

                        <div>

                            <span className="tracking-result-label">
                                Tracking Code
                            </span>

                            <h3>
                                {
                                    trackingResult
                                        .trackingCode
                                }
                            </h3>

                        </div>


                        <StatusBadge
                            status={
                                trackingResult.status
                            }
                        />

                    </div>


                    {/* =========================
                        REPAIR INFORMATION
                    ========================== */}
                    <div className="tracking-summary">

                        <div>

                            <span>
                                Device
                            </span>

                            <strong>
                                {
                                    trackingResult
                                        .device
                                }
                            </strong>

                        </div>


                        <div>

                            <span>
                                Date Received
                            </span>

                            <strong>
                                {
                                    trackingResult
                                        .receivedAt
                                }
                            </strong>

                        </div>


                        <div>

                            <span>
                                Last Updated
                            </span>

                            <strong>
                                {
                                    trackingResult
                                        .lastUpdated
                                }
                            </strong>

                        </div>

                    </div>


                    {/* =========================
                        REPAIR PROGRESS
                    ========================== */}
                    <div className="tracking-history">

                        <div className="tracking-section-header">

                            <h3>
                                Repair Progress
                            </h3>

                            <p>
                                Follow the latest
                                progress of your repair.
                            </p>

                        </div>


                        <div className="tracking-history-list">

                            {trackingResult
                                .statusHistory
                                .map((entry) => (

                                <article
                                    key={
                                        entry.id
                                    }
                                    className="tracking-history-item"
                                >

                                    <div className="tracking-history-marker" />


                                    <div className="tracking-history-content">

                                        <div className="tracking-history-top">

                                            <StatusBadge
                                                status={
                                                    entry.status
                                                }
                                            />

                                            <span>
                                                {
                                                    entry.date
                                                }
                                            </span>

                                        </div>


                                        <p>
                                            {
                                                entry.description
                                            }
                                        </p>

                                    </div>

                                </article>

                            ))}

                        </div>

                    </div>


                    {/* =========================
                        TRACK ANOTHER REPAIR
                    ========================== */}
                    <div className="tracking-result-actions">

                        <button
                            className="secondary-repair-button"
                            type="button"
                            onClick={
                                handleNewSearch
                            }
                        >

                            <RotateCcw
                                size={18}
                            />

                            <span>
                                Track Another Repair
                            </span>

                        </button>

                    </div>
                </>

            )}

        </section>
    );
}


export default TrackingPage;