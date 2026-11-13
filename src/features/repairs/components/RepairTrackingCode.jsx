import { useEffect, useRef, useState } from "react";
import { Copy } from "lucide-react";

import ResendTrackingEmail from "./ResendTrackingEmail.jsx";
import useFeedbackState from "../../../hooks/useFeedbackState.js";

export default function RepairTrackingCode({ code, repairId, customer, canResend }) {
  const [copying, setCopying] = useState(false);
  const [, setResult] = useFeedbackState(null, {
    toast: (value) => ({
      variant: value.success ? "success" : "error",
      title: value.success ? "Tracking code copied" : "Unable to copy tracking code",
      message: value.text,
    }),
  });
  const inProgress = useRef(false);
  const active = useRef(true);

  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);

  async function handleCopy() {
    if (inProgress.current) return;

    inProgress.current = true;
    setCopying(true);
    setResult(null);

    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard unavailable");
      }

      await navigator.clipboard.writeText(code);

      if (active.current) {
        setResult({ success: true, text: "Copied" });
      }
    } catch {
      if (active.current) {
        setResult({
          success: false,
          text: "Could not copy automatically. Select the tracking code and copy it manually.",
        });
      }
    } finally {
      inProgress.current = false;
      if (active.current) setCopying(false);
    }
  }

  return (
    <div className="tracking-code-control">
      <div className="tracking-code-row">
        <span
          className="tracking-code-value"
          aria-label="Repair tracking code"
          tabIndex={0}
        >
          {code}
        </span>
        <button
          className="secondary-repair-button tracking-copy-button"
          type="button"
          aria-label="Copy repair tracking code"
          title="Copy repair tracking code"
          disabled={copying}
          aria-busy={copying}
          onClick={handleCopy}
        >
          <Copy size={16} aria-hidden="true" />
        </button>
        {canResend && <ResendTrackingEmail key={repairId} repairId={repairId} customer={customer} />}
      </div>

    </div>
  );
}
