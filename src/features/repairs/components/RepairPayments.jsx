import { useEffect, useRef, useState } from "react";

import { Plus } from "lucide-react";

import { hasAccess } from "../../../config/accessControl.js";

const MONEY_PATTERN = /^\d{1,10}(?:\.\d{1,2})?$/;

function toCents(value) {
  if (value == null || value === "") {
    return null;
  }

  const text = String(value).trim();

  if (!MONEY_PATTERN.test(text)) {
    return null;
  }

  const [whole, fraction = ""] = text.split(".");

  return BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0"));
}

function formatCents(value) {
  const negative = value < 0n;
  const absolute = negative ? -value : value;
  const whole = (absolute / 100n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const fraction = (absolute % 100n).toString().padStart(2, "0");

  return `${negative ? "-" : ""}₱${whole}.${fraction}`;
}

function formatMoney(value) {
  const cents = toCents(value);

  return cents == null ? "—" : formatCents(cents);
}

function formatDate(value) {
  if (!value) {
    return "Date unavailable";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleString();
}

function RepairPayments({
  currentRoles = [],
  repairId,
  currentStatus,
  repairTotal,
  payments = [],
  onCreatePayment,
  saving = false,
  disabled = false,
  blocked = false,
  error = "",
  message = "",
}) {
  const [formOpen, setFormOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [localError, setLocalError] = useState("");
  const [localBlocked, setLocalBlocked] = useState(false);

  const submittingRef = useRef(false);

  const closed = ["COMPLETED", "CANCELLED"].includes(currentStatus);

  const canRecordPayments =
    Boolean(currentStatus) &&
    !closed &&
    hasAccess(currentRoles, "recordPayments") &&
    typeof onCreatePayment === "function";

  const controlsDisabled = saving || disabled || blocked || localBlocked;

  const agreedCents = toCents(repairTotal);
  const priceAgreed = repairTotal != null;

  const paymentAmounts = payments.map((payment) => toCents(payment.amount));

  const invalidAmounts =
    (priceAgreed && agreedCents == null) ||
    paymentAmounts.some((value) => value == null || value <= 0n);

  const totalPaidCents = paymentAmounts.reduce(
    (total, value) => total + (value ?? 0n),
    0n,
  );

  const balanceCents =
    agreedCents == null ? null : agreedCents - totalPaidCents;

  const canAcceptPayment =
    priceAgreed && !invalidAmounts && balanceCents != null && balanceCents > 0n;

  let paymentStatus = "Unpaid";

  if (invalidAmounts) {
    paymentStatus = "Unavailable";
  } else if (!priceAgreed) {
    paymentStatus = "Price Not Agreed";
  } else if (balanceCents < 0n) {
    paymentStatus = "Overpaid";
  } else if (balanceCents === 0n) {
    paymentStatus = "Paid";
  } else if (totalPaidCents > 0n) {
    paymentStatus = "Partially Paid";
  }

  useEffect(() => {
    setFormOpen(false);
    setAmount("");
    setNote("");
    setLocalError("");
    setLocalBlocked(false);
  }, [repairId]);

  useEffect(() => {
    if (!canRecordPayments) {
      setFormOpen(false);
      setAmount("");
      setNote("");
      setLocalError("");
    }
  }, [canRecordPayments]);

  function resetForm() {
    setAmount("");
    setNote("");
    setLocalError("");
  }

  function handleFormToggle() {
    if (
      !canRecordPayments ||
      !canAcceptPayment ||
      controlsDisabled ||
      submittingRef.current
    ) {
      return;
    }

    resetForm();
    setFormOpen((current) => !current);
  }

  function handleCancel() {
    if (saving || submittingRef.current) {
      return;
    }

    resetForm();
    setFormOpen(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!canRecordPayments || controlsDisabled || submittingRef.current) {
      return;
    }

    setLocalError("");

    if (!canAcceptPayment) {
      setLocalError(
        !priceAgreed
          ? "Record the agreed repair price before recording a payment."
          : "Check the latest payment records and remaining balance.",
      );
      return;
    }

    const paymentAmount = amount.trim();
    const amountCents = toCents(paymentAmount);

    if (amountCents == null || amountCents <= 0n) {
      setLocalError(
        "Enter an amount greater than zero, with up to 10 whole-number digits and 2 decimal places.",
      );
      return;
    }

    if (amountCents > balanceCents) {
      setLocalError(
        `Payment amount cannot exceed the remaining balance of ${formatCents(balanceCents)}.`,
      );
      return;
    }

    const paymentNote = note.trim();

    if (paymentNote.length > 2000) {
      setLocalError("Payment note must not exceed 2000 characters.");
      return;
    }

    submittingRef.current = true;

    try {
      const saved = await onCreatePayment({
        amount: paymentAmount,
        note: paymentNote || null,
      });

      if (saved === true) {
        resetForm();
        setFormOpen(false);
      }
    } catch {
      setLocalBlocked(true);
      setLocalError(
        "The payment may have been saved. Reload the page and check payment history before trying again.",
      );
    } finally {
      submittingRef.current = false;
    }
  }

  const displayedError =
    localError ||
    error ||
    (invalidAmounts
      ? "Payment amounts could not be read. Reload the page before continuing."
      : "");

  return (
    <section className="page-content repair-payments">
      <div className="workspace-section-header">
        <div>
          <h3>Payments</h3>

          <p className="workspace-section-description">
            Review deposits and payments recorded for this repair.
          </p>
        </div>

        {canRecordPayments && (
          <button
            className="secondary-repair-button"
            type="button"
            onClick={handleFormToggle}
            disabled={controlsDisabled || !canAcceptPayment}
          >
            <Plus size={18} />
            <span>Record Payment</span>
          </button>
        )}
      </div>

      {displayedError && (
        <div className="customer-form-error" role="alert">
          {displayedError}
        </div>
      )}

      {message && (
        <div className="repair-success-message" role="status">
          {message}
        </div>
      )}

      <div className="payment-summary">
        <div>
          <span>Repair Total</span>

          <strong>
            {priceAgreed ? formatMoney(repairTotal) : "Not agreed yet"}
          </strong>
        </div>

        <div>
          <span>Total Paid</span>

          <strong>{invalidAmounts ? "—" : formatCents(totalPaidCents)}</strong>
        </div>

        <div>
          <span>Balance</span>

          <strong>
            {!invalidAmounts && balanceCents != null
              ? formatCents(balanceCents)
              : "—"}
          </strong>
        </div>

        <div>
          <span>Payment Status</span>
          <strong>{paymentStatus}</strong>
        </div>
      </div>

      {formOpen && canRecordPayments && (
        <form className="payment-form" onSubmit={handleSubmit}>
          <div className="repair-form-group">
            <label htmlFor="payment-amount">Amount</label>

            <input
              id="payment-amount"
              type="number"
              min="0.01"
              max="9999999999.99"
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="0.00"
              disabled={controlsDisabled}
              required
            />
          </div>

          <div className="repair-form-group">
            <label htmlFor="payment-note">Payment Note</label>

            <textarea
              id="payment-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows="3"
              maxLength={2000}
              placeholder="Optional note, e.g. deposit for replacement part"
              disabled={controlsDisabled}
            />
          </div>

          <div className="finding-form-actions">
            <button
              className="cancel-repair-button"
              type="button"
              onClick={handleCancel}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              className="create-repair-button"
              type="submit"
              disabled={controlsDisabled || !canAcceptPayment}
            >
              {saving ? "Recording…" : "Record Payment"}
            </button>
          </div>
        </form>
      )}

      {payments.length > 0 ? (
        <div className="payment-list">
          {payments.map((payment) => (
            <article key={payment.id} className="payment-item">
              <div className="payment-item-top">
                <strong>{formatMoney(payment.amount)}</strong>
                <span>{formatDate(payment.paidAt)}</span>
              </div>

              <p>
                Recorded by{" "}
                <strong>
                  {payment.recordedByName || `Staff #${payment.recordedById}`}
                </strong>
              </p>

              {payment.note && <p>{payment.note}</p>}
            </article>
          ))}
        </div>
      ) : (
        <div className="workspace-empty-state">
          <strong>No payments recorded</strong>

          <p>
            {canRecordPayments
              ? "Record a deposit or payment when the customer makes one."
              : "Payments recorded for this repair will appear here."}
          </p>
        </div>
      )}
    </section>
  );
}

export default RepairPayments;
