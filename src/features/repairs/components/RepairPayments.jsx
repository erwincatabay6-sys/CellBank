import {
    useEffect,
    useState
} from "react";

import { Plus }
    from "lucide-react";


import { hasAccess }
    from "../../../config/accessControl.js";

import { mockPayments }
    from "../data/mockPayments.js";


function RepairPayments({
    currentRoles,
    currentUserName,
    repairId,
    repairTotal
}) {

    // -----------------------------
    // ROLE PERMISSIONS
    // -----------------------------

    const canRecordPayments =
        hasAccess(
            currentRoles,
            "recordPayments"
        );


    // -----------------------------
    // PAYMENT STATE
    // -----------------------------

    const [payments, setPayments] =
        useState(() =>
            mockPayments.filter(
                (payment) =>
                    payment.repairId ===
                        repairId
            )
        );


    const [
        formOpen,
        setFormOpen
    ] = useState(false);


    const [amount, setAmount] =
        useState("");


    const [note, setNote] =
        useState("");


    // -----------------------------
    // REPAIR CHANGE SYNC
    // -----------------------------

    useEffect(() => {

        const repairPayments =
            mockPayments.filter(
                (payment) =>
                    payment.repairId ===
                        repairId
            );


        setPayments(
            repairPayments
        );


        setAmount("");

        setNote("");

        setFormOpen(false);

    }, [repairId]);


    // -----------------------------
    // ROLE CHANGE SYNC
    // -----------------------------

    useEffect(() => {

        if (!canRecordPayments) {

            setFormOpen(false);

            setAmount("");

            setNote("");
        }

    }, [canRecordPayments]);


    // -----------------------------
    // DERIVED FINANCIAL VALUES
    // -----------------------------

    const effectiveRepairTotal =
        repairTotal ?? 0;


    const totalPaid =
        payments.reduce(
            (total, payment) =>
                total +
                    payment.amount,
            0
        );


    const balance =
        Math.max(
            effectiveRepairTotal -
                totalPaid,
            0
        );


    let paymentStatus =
        "Unpaid";


    if (repairTotal == null) {

        paymentStatus =
            "Price Not Agreed";

    }
    else if (
        totalPaid >=
            effectiveRepairTotal &&
        effectiveRepairTotal > 0
    ) {

        paymentStatus =
            "Paid";

    }
    else if (totalPaid > 0) {

        paymentStatus =
            "Partially Paid";

    }


    // -----------------------------
    // FORM HELPERS
    // -----------------------------

    function resetForm() {

        setAmount("");

        setNote("");
    }


    function handleFormToggle() {

        if (!canRecordPayments) {
            return;
        }


        if (repairTotal == null) {
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
    // PAYMENT SUBMISSION
    // -----------------------------

    function handleSubmit(event) {

        event.preventDefault();


        if (!canRecordPayments) {
            return;
        }


        if (repairTotal == null) {
            return;
        }


        const paymentAmount =
            Number(amount);


        if (
            !Number.isFinite(
                paymentAmount
            ) ||
            paymentAmount <= 0
        ) {
            return;
        }


        const newPayment = {
            id:
                Date.now(),

            repairId,

            amount:
                paymentAmount,

            recordedBy:
                currentUserName ||
                "Unknown User",

            recordedAt:
                new Date()
                    .toLocaleString(),

            note:
                note.trim() || null
        };


        setPayments(
            (currentPayments) => [
                ...currentPayments,
                newPayment
            ]
        );


        resetForm();

        setFormOpen(false);
    }


    return (
        <section className="page-content repair-payments">

            {/* =========================
                HEADER
            ========================== */}
            <div className="workspace-section-header">

                <div>

                    <h3>
                        Payments
                    </h3>

                    <p className="workspace-section-description">
                        Review deposits and payments
                        recorded for this repair.
                    </p>

                </div>


                {/* ADMIN + FRONT DESK */}
                {canRecordPayments && (

                    <button
                        className="secondary-repair-button"
                        type="button"
                        onClick={
                            handleFormToggle
                        }
                        disabled={
                            repairTotal == null
                        }
                    >

                        <Plus size={18} />

                        <span>
                            Record Payment
                        </span>

                    </button>

                )}

            </div>


            {/* =========================
                PAYMENT SUMMARY
            ========================== */}
            <div className="payment-summary">

                {/* REPAIR TOTAL */}
                <div>

                    <span>
                        Repair Total
                    </span>

                    <strong>
                        {repairTotal != null
                            ? `₱${repairTotal.toFixed(2)}`
                            : "Not agreed yet"
                        }
                    </strong>

                </div>


                {/* TOTAL PAID */}
                <div>

                    <span>
                        Total Paid
                    </span>

                    <strong>
                        ₱{totalPaid.toFixed(2)}
                    </strong>

                </div>


                {/* BALANCE */}
                <div>

                    <span>
                        Balance
                    </span>

                    <strong>
                        {repairTotal != null
                            ? `₱${balance.toFixed(2)}`
                            : "—"
                        }
                    </strong>

                </div>


                {/* PAYMENT STATUS */}
                <div>

                    <span>
                        Payment Status
                    </span>

                    <strong>
                        {paymentStatus}
                    </strong>

                </div>

            </div>


            {/* =========================
                PAYMENT FORM
                ADMIN + FRONT DESK
            ========================== */}
            {formOpen &&
                canRecordPayments && (

                <form
                    className="payment-form"
                    onSubmit={
                        handleSubmit
                    }
                >

                    {/* AMOUNT */}
                    <div className="repair-form-group">

                        <label htmlFor="payment-amount">
                            Amount
                        </label>

                        <input
                            id="payment-amount"
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={amount}
                            onChange={(event) =>
                                setAmount(
                                    event.target.value
                                )
                            }
                            placeholder="0.00"
                            required
                        />

                    </div>


                    {/* PAYMENT NOTE */}
                    <div className="repair-form-group">

                        <label htmlFor="payment-note">
                            Payment Note
                        </label>

                        <textarea
                            id="payment-note"
                            value={note}
                            onChange={(event) =>
                                setNote(
                                    event.target.value
                                )
                            }
                            rows="3"
                            placeholder={
                                "Optional note, e.g. deposit for replacement part"
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
                            Record Payment
                        </button>

                    </div>

                </form>

            )}


            {/* =========================
                PAYMENT HISTORY
            ========================== */}
            {payments.length > 0 ? (

                <div className="payment-list">

                    {payments.map((payment) => (

                        <article
                            key={
                                payment.id
                            }
                            className="payment-item"
                        >

                            <div className="payment-item-top">

                                <strong>
                                    ₱{
                                        payment.amount
                                            .toFixed(2)
                                    }
                                </strong>

                                <span>
                                    {
                                        payment.recordedAt
                                    }
                                </span>

                            </div>


                            <p>
                                Recorded by{" "}

                                <strong>
                                    {
                                        payment.recordedBy
                                    }
                                </strong>
                            </p>


                            {payment.note && (

                                <p>
                                    {payment.note}
                                </p>

                            )}

                        </article>

                    ))}

                </div>

            ) : (

                <div className="workspace-empty-state">

                    <strong>
                        No payments recorded
                    </strong>

                    <p>
                        {canRecordPayments
                            ? "Record a deposit or payment when the customer makes one."
                            : "Payments recorded for this repair will appear here."
                        }
                    </p>

                </div>

            )}

        </section>
    );
}


export default RepairPayments;