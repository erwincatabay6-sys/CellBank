import PendingAction from "../../../components/PendingAction.jsx";
import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Mail, X } from "lucide-react";

import useCountdown from "../../../hooks/useCountdown.js";
import "../../auth/emailChallenge.css";

export default function EmailChangeDialog({
  trigger, fallbackFocus, status, statusError, refreshStatus, profileRefreshNeeded,
  action, error, notice, retryDeadline, onAction, onClose,
}) {
  const dialogRef = useRef(null);
  const closeRef = useRef(null);
  const inputRef = useRef(null);
  const [code, setCode] = useState("");
  const [selection, setSelection] = useState([0, 0]);
  const cooldown = useCountdown(Math.max(status?.resendDeadline ?? 0, retryDeadline));
  const expiration = useCountdown(status?.expiryDeadline ?? 0);
  const pending = status?.pending === true && !profileRefreshNeeded;
  const canConfirm = pending && !statusError && expiration > 0 && /^\d{6}$/.test(code);

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    dialog.showModal();
    (inputRef.current ?? closeRef.current).focus();

    return () => {
      dialog.close();
      queueMicrotask(() => {
        const target = trigger.isConnected ? trigger : fallbackFocus.current;
        if (target?.isConnected && document.activeElement === document.body) {
          target.focus({ preventScroll: true });
        }
      });
    };
  }, [trigger, fallbackFocus]);

  function trapTab(event) {
    if (event.key !== "Tab") return;
    const controls = dialogRef.current.querySelectorAll("button:not(:disabled), input:not(:disabled)");
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  async function submit(event) {
    event.preventDefault();
    if (!canConfirm || action) return;
    await onAction("confirm", code);
  }

  async function resend() {
    if (action || cooldown || statusError || !pending) return;
    if (await onAction("resend")) {
      setCode("");
      setSelection([0, 0]);
    }
  }

  return createPortal(
    <dialog ref={dialogRef} className="device-modal status-details-modal staff-email-dialog"
      aria-labelledby="staff-email-dialog-title" onKeyDown={trapTab}
      onCancel={(event) => { event.preventDefault(); onClose(); }}>
      <button ref={closeRef} type="button" className="modal-close-button staff-email-close"
        aria-label="Close email confirmation" onClick={onClose}><X size={20} aria-hidden="true" /></button>
      <Mail className="staff-email-icon" size={32} aria-hidden="true" />
      <h3 id="staff-email-dialog-title">Confirm your new email</h3>
      {pending && (
        <form onSubmit={submit} className="staff-email-buttons interaction-enter">
          <p>Enter the six-digit code sent to<br /><strong>{status.maskedProposedEmail}</strong></p>
          <div className="staff-otp">
            <input ref={inputRef} type="text" name="email-confirmation-code" inputMode="numeric"
              autoComplete="one-time-code" aria-label="Six-digit confirmation code"
              aria-describedby="staff-otp-timing"
              aria-invalid={error ? true : undefined}
              value={code}
              onChange={(event) => {
                const value = event.target.value.replace(/[^0-9]/g, "").slice(0, 6);
                setCode(value);
                const caret = event.target.value.slice(0, event.target.selectionStart).replace(/[^0-9]/g, "").length;
                const position = Math.min(value.length, caret);
                event.target.value = value;
                event.target.setSelectionRange(position, position);
                setSelection([position, position]);
              }}
              onSelect={(event) => setSelection([event.currentTarget.selectionStart, event.currentTarget.selectionEnd])}
              onClick={(event) => {
                const bounds = event.currentTarget.getBoundingClientRect();
                if (!event.detail || event.shiftKey) return;
                const position = Math.max(0, Math.min(code.length, Math.floor((event.clientX - bounds.left) / bounds.width * 6)));
                event.currentTarget.setSelectionRange(position, position);
                setSelection([position, position]);
              }}
            />
            <div className="staff-otp-boxes" aria-hidden="true">
              {Array.from({ length: 6 }, (_, index) => (
                <span key={index} className={index >= Math.min(selection[0], 5) && index <= Math.min(Math.max(selection[0], selection[1] - 1), 5) ? "active" : ""}>
                  {code[index]}
                </span>
              ))}
            </div>
          </div>
          <p id="staff-otp-timing">
            {expiration ? `Code expires in ${Math.floor(expiration / 60)}:${String(expiration % 60).padStart(2, "0")}.` : "This code has expired. Request a new code."}
          </p>
          <button className="create-repair-button" type="submit" disabled={!canConfirm || Boolean(action)}>
            <PendingAction pending={action === "confirm"} label="Confirm email" pendingLabel="Confirming email" />
          </button>
          <button className="staff-email-link" type="button" disabled={Boolean(action) || Boolean(statusError) || cooldown > 0}
            onClick={resend}>
            <PendingAction pending={action === "resend"} label={cooldown ? `Resend in ${cooldown}s` : "Resend code"}
              pendingLabel="Sending code" reserveLabel="Resend in 60s" />
          </button>
        </form>
      )}
      {status && !pending && !notice && <p>No replacement email is pending. Contact your administrator if you still need a change.</p>}
      {notice && <p role="status">{notice}</p>}
      {(error || statusError) && <p className="staff-email-error" role="alert">{error || statusError}</p>}
      {statusError && <button className="staff-email-link" type="button" onClick={refreshStatus}>Retry status check</button>}
      {profileRefreshNeeded && <button className="staff-email-link" type="button" disabled={Boolean(action)}
        onClick={() => void onAction("refresh")}>Refresh account</button>}
    </dialog>,
    document.body,
  );
}
