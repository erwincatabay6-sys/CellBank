import {
    useEffect,
    useState
} from "react";

import StatusBadge
    from "../../../components/StatusBadge.jsx";

import { canChangeRepairStatus }
    from "../../../config/accessControl.js";


// =====================================================
// AVAILABLE REPAIR STATUSES
// =====================================================

const repairStatuses = [
    {
        value: "RECEIVED",
        label: "Received"
    },

    {
        value: "AWAITING_APPROVAL",
        label: "Awaiting Approval"
    },

    {
        value: "IN_PROGRESS",
        label: "In Progress"
    },

    {
        value: "AWAITING_PARTS",
        label: "Awaiting Parts"
    },

    {
        value: "READY_FOR_RELEASE",
        label: "Ready for Release"
    },

    {
        value: "COMPLETED",
        label: "Completed"
    },

    {
        value: "CANCELLED",
        label: "Cancelled"
    }
];


const initialHistory = [
    {
        id: 1,

        status: "RECEIVED",

        changedBy:
            "Miguel Santos",

        changedAt:
            "September 1, 2026 - 9:15 AM",

        note:
            "Device received for inspection."
    },

    {
        id: 2,

        status: "AWAITING_APPROVAL",

        changedBy:
            "Miguel Santos",

        changedAt:
            "September 1, 2026 - 10:30 AM",

        note:
            "Inspection completed. Awaiting customer approval."
    }
];


function RepairStatusHistory({
    currentRoles,
    currentStatus,
    onStatusChange,
    suggestedStatus = "",
    onSuggestionHandled
}) {

    // -----------------------------
    // HISTORY STATE
    // -----------------------------

    const [history, setHistory] =
        useState(initialHistory);


    // -----------------------------
    // FORM STATE
    // -----------------------------

    const [status, setStatus] =
        useState("");

    const [note, setNote] =
        useState("");

    const [formOpen, setFormOpen] =
        useState(false);


    // -----------------------------
    // ALLOWED STATUSES
    // -----------------------------

    const allowedStatuses =
        repairStatuses.filter(
            (repairStatus) =>
                repairStatus.value !==
                    currentStatus &&

                canChangeRepairStatus(
                    currentRoles,
                    repairStatus.value
                )
        );


    const canChangeStatus =
        allowedStatuses.length > 0;


    // -----------------------------
    // AI STATUS SUGGESTION
    // -----------------------------

    useEffect(() => {

        if (!suggestedStatus) {
            return;
        }


        const suggestionAllowed =
            suggestedStatus !==
                currentStatus &&

            canChangeRepairStatus(
                currentRoles,
                suggestedStatus
            );


        if (suggestionAllowed) {

            setStatus(
                suggestedStatus
            );

            setFormOpen(true);
        }


        if (onSuggestionHandled) {

            onSuggestionHandled();
        }

    }, [
        suggestedStatus,
        currentStatus,
        currentRoles,
        onSuggestionHandled
    ]);


    // -----------------------------
    // PERMISSION CHANGE SYNC
    // -----------------------------

    useEffect(() => {

        if (!canChangeStatus) {

            setStatus("");

            setNote("");

            setFormOpen(false);

            return;
        }


        if (
            status &&
            !canChangeRepairStatus(
                currentRoles,
                status
            )
        ) {

            setStatus("");
        }

    }, [
        currentRoles,
        currentStatus,
        canChangeStatus,
        status
    ]);


    // -----------------------------
    // FORM HELPERS
    // -----------------------------

    function resetForm() {

        setStatus("");

        setNote("");
    }


    function handleFormToggle() {

        if (!canChangeStatus) {
            return;
        }


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


        if (!canChangeStatus) {
            return;
        }


        if (!status) {
            return;
        }


        if (
            status === currentStatus ||
            !canChangeRepairStatus(
                currentRoles,
                status
            )
        ) {
            return;
        }


        const newEntry = {
            id:
                Date.now(),

            status,

            changedBy:
                "Miguel Santos",

            changedAt:
                new Date()
                    .toLocaleString(),

            note:
                note.trim() || null
        };


        setHistory((currentHistory) => [
            ...currentHistory,
            newEntry
        ]);


        if (onStatusChange) {

            onStatusChange(
                status
            );
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
                        Review repair progress and
                        record approved status changes.
                    </p>

                </div>


                {canChangeStatus && (

                    <button
                        className="secondary-repair-button"
                        type="button"
                        onClick={
                            handleFormToggle
                        }
                    >
                        Change Status
                    </button>

                )}

            </div>


            {/* =========================
                STATUS CHANGE FORM
            ========================== */}
            {formOpen &&
                canChangeStatus && (

                <form
                    className="status-change-form"
                    onSubmit={
                        handleSubmit
                    }
                >

                    {/* CURRENT STATUS */}
                    <div className="repair-form-group">

                        <label>
                            Current Status
                        </label>

                        <div>

                            <StatusBadge
                                status={
                                    currentStatus
                                }
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


                            {allowedStatuses.map(
                                (repairStatus) => (

                                    <option
                                        key={
                                            repairStatus.value
                                        }
                                        value={
                                            repairStatus.value
                                        }
                                    >
                                        {
                                            repairStatus.label
                                        }
                                    </option>

                                )
                            )}

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
                            onClick={
                                handleCancel
                            }
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
                                        status={
                                            entry.status
                                        }
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
                        No status history
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