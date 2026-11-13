import { useEffect, useState } from "react";
import { Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { apiRequest } from "../../../api/http.js";
import { useFeedback } from "../../feedback/FeedbackProvider.jsx";
import useCountdown from "../../../hooks/useCountdown.js";

// Per-repair timestamps survive workspace navigation; the server remains authoritative.
const attempts = new Map();
const listeners = new Set();
function updateAttempt(id, value) {
  attempts.set(id, value);
  listeners.forEach(listener => listener());
}

export default function ResendTrackingEmail({ repairId, customer }) {
  const { publish } = useFeedback();
  const [state, setState] = useState(() => attempts.get(repairId) ?? { deadline: 0, sending: false });
  const remaining = useCountdown(state.deadline);
  const missingEmail = customer != null && !customer.email?.trim();
  useEffect(() => {
    const update = () => {
      const latest = attempts.get(repairId);
      if (latest) setState(latest);
    };
    listeners.add(update);
    update();
    return () => listeners.delete(update);
  }, [repairId]);

  async function resend() {
    const previous = attempts.get(repairId);
    if (missingEmail || previous?.sending || previous?.deadline > Date.now()) return;
    const pending = { sending: true, deadline: 0 };
    updateAttempt(repairId, pending);
    setState(pending);
    let seconds = 60;
    try {
      await apiRequest(`/api/repairs/${repairId}/tracking-email`, { method: "POST" });
      publish({ variant: "success", title: "Tracking email sent", message: "Tracking email sent." });
    } catch (error) {
      let message;
      if (error.status === 429) {
        seconds = error.retryAfterSeconds ?? 60;
        message = `Please wait ${seconds} seconds before resending this tracking email.`;
      } else if (error.status === 400) {
        seconds = 0;
        message = "Add an email address to the customer record before sending a tracking email.";
      } else if (error.status === 403 || error.status === 404) {
        seconds = 0;
        message = error.status === 403 ? "You do not have permission to send this tracking email." : "This repair record is unavailable.";
      } else {
        message = "Email delivery could not be confirmed. Check the inbox before retrying; the email may already have been sent.";
      }
      publish({ variant: "error", title: "Unable to confirm tracking email", message });
    } finally {
      updateAttempt(repairId, { sending: false, deadline: Date.now() + seconds * 1000 });
      // Only mounted subscribers receive state updates.
    }
  }

  return (
    <div className="tracking-email-control">
      <button type="button" className="secondary-repair-button"
        onClick={resend} disabled={missingEmail || state.sending || remaining > 0}
        aria-busy={state.sending} aria-describedby={missingEmail ? `tracking-email-help-${repairId}` : undefined}>
        <Mail size={16} aria-hidden="true" />
        {state.sending ? "Sending…" : remaining ? `Resend in ${remaining}s` : "Resend tracking email"}
      </button>
      {missingEmail && <small id={`tracking-email-help-${repairId}`}>
        <Link to={`/customers/${customer.id}`}>Add a customer email</Link> to send tracking updates.
      </small>}
    </div>
  );
}
