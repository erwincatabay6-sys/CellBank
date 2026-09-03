import {
    useEffect,
    useState
} from "react";

import StatusBadge
    from "../../../components/StatusBadge.jsx";


const initialHistory = [
    {
        id: 1,
        status: "RECEIVED",
        changedBy: "Miguel Santos",
        changedAt: "September 1, 2026 - 9:15 AM",
        note: "Device received for inspection."
    },
    {
        id: 2,
        status: "AWAITING_APPROVAL",
        changedBy: "Miguel Santos",
        changedAt: "September 1, 2026 - 10:30 AM",
        note:
            "Inspection completed. Awaiting customer approval."
    }
];


function RepairStatusHistory({
    currentStatus,
    onStatusChange,
    suggestedStatus = "",
    onSuggestionHandled
}) {

    // -----------------------------
    // STATUS HISTORY STATE
    // -----------------------------

    const [history, setHistory] =
        useState(initialHistory);

    const [formOpen, setFormOpen] =
        useState(false);

    const [status, setStatus] =
        useState("");

    const [note, setNote] =
        useState("");


    // -----------------------------
    // AI STATUS SUGGESTION
    // -----------------------------

    useEffect(() => {

        if (!suggestedStatus) {
            return;
        }


        setStatus(suggestedStatus);

        setFormOpen(true);


        if (onSuggestionHandled) {
            onSuggestionHandled();
        }

    }, [
        suggestedStatus,
        onSuggestionHandled
    ]);


    // -----------------------------
    // HELPERS
    // -----------------------------

    function resetForm() {

        setStatus("");
        setNote("");
    }


    function handleFormToggle() {

        if (formOpen) {
            resetForm();
        }


        setFormOpen(
            !formOpen
        );
    }


    function handleCancel() {

        resetForm();

        setFormOpen(false);
    }


    // -----------------------------
    // STATUS SUBMISSION
    // -----------------------------

    function handleSubmit(event) {

        event.preventDefault();


        const newEntry = {
            id: history.length + 1,

            status,

            changedBy:
                "Miguel Santos",

            changedAt:
                new Date().toLocaleString(),

            note:
                note.trim() || null
        };


        setHistory((currentHistory) => [
            ...currentHistory,
            newEntry
        ]);


        if (onStatusChange) {
            onStatusChange(status);
        }


        resetForm();

        setFormOpen(false);
    }


    return (
        <section className="page-content">

            {/* =========================
                HEADER
            ========================== */}
            <div className="workspace-section-header">

                <div>

                    <h3>
                        Status History
                    </h3>

                    <p className="workspace-section-description">
                        Review repair progress and record
                        approved status changes.
                    </p>

                </div>


                <button
                    className="secondary-repair-button"
                    type="button"
                    onClick={handleFormToggle}
                >
                    Change Status
                </button>

            </div>


            {/* =========================
                STATUS CHANGE FORM
            ========================== */}
            {formOpen && (

                <form
                    className="status-change-form"
                    onSubmit={handleSubmit}
                >

                    {/* CURRENT STATUS */}
                    <div className="repair-form-group">

                        <label>
                            Current Status
                        </label>

                        <div>
                            <StatusBadge
                                status={currentStatus}
                            />
                        </div>

                    </div>


                    {/* NEW STATUS */}
                    <div className="repair-form-group">

                        <label htmlFor="repair-status">
                            New Status
                        </label>


                        <select
                            id="repair-status"
                            value={status}
                            onChange={(event) =>
                                setStatus(
                                    event.target.value
                                )
                            }
                            required
                        >

                            <option value="">
                                Select status
                            </option>

                            <option value="AWAITING_APPROVAL">
                                Awaiting Approval
                            </option>

                            <option value="IN_PROGRESS">
                                In Progress
                            </option>

                            <option value="AWAITING_PARTS">
                                Awaiting Parts
                            </option>

                            <option value="READY_FOR_RELEASE">
                                Ready for Release
                            </option>

                            <option value="COMPLETED">
                                Completed
                            </option>

                            <option value="CANCELLED">
                                Cancelled
                            </option>

                        </select>

                    </div>


                    {/* STATUS NOTE */}
                    <div className="repair-form-group">

                        <label htmlFor="status-note">
                            Status Note
                        </label>


                        <textarea
                            id="status-note"
                            value={note}
                            onChange={(event) =>
                                setNote(
                                    event.target.value
                                )
                            }
                            rows="3"
                            placeholder={
                                "Optional reason or status note"
                            }
                        />

                    </div>


                    {/* FORM ACTIONS */}
                    <div className="finding-form-actions">

                        <button
                            className="cancel-repair-button"
                            type="button"
                            onClick={handleCancel}
                        >
                            Cancel
                        </button>


                        <button
                            className="create-repair-button"
                            type="submit"
                        >
                            Confirm Status Change
                        </button>

                    </div>

                </form>

            )}


            {/* =========================
                STATUS HISTORY
            ========================== */}
            {history.length > 0 ? (

                <div className="status-history-list">

                    {[...history]
                        .reverse()
                        .map((entry) => (

                            <article
                                key={entry.id}
                                className="status-history-item"
                            >

                                <div className="status-history-top">

                                    <StatusBadge
                                        status={entry.status}
                                    />

                                    <span>
                                        {entry.changedAt}
                                    </span>

                                </div>


                                <p>
                                    Changed by{" "}

                                    <strong>
                                        {entry.changedBy}
                                    </strong>
                                </p>


                                {entry.note && (

                                    <p>
                                        {entry.note}
                                    </p>

                                )}

                            </article>

                        ))}

                </div>

            ) : (

                <div className="workspace-empty-state">

                    <strong>
                        No status history recorded
                    </strong>

                    <p>
                        Status changes for this repair
                        will appear here.
                    </p>

                </div>

            )}

        </section>
    );
}


export default RepairStatusHistory;