import { useEffect, useRef, useState } from "react";
import { Search, RotateCcw } from "lucide-react";

import { useSearchParams } from "react-router-dom";
import { normalizeTrackingCode } from "../repairCode.js";
import useCountdown from "../../../hooks/useCountdown.js";
import useFeedbackState from "../../../hooks/useFeedbackState.js";

import StatusBadge from "../../../components/StatusBadge.jsx";
import { trackRepair } from "../../../api/trackingApi.js";

import "../tracking.css";

const NOT_FOUND_MESSAGE =
  "Repair not found. Check the tracking code and try again.";

function formatDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-US", {
    timeZone: "Asia/Manila",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function TrackingPage() {
  const [params] = useSearchParams();
  const linkCode = params.get("code") ?? "";
  const [trackingCode, setTrackingCode] = useState(linkCode);
  const [trackingResult, setTrackingResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [, setRequestError] = useFeedbackState("", {
    toast: { variant: "error", title: "Unable to track repair" },
  });
  const [submitting, setSubmitting] = useState(false);
  const [deadline, setDeadline] = useState(0);
  const remaining = useCountdown(deadline);
  const requestRef = useRef(null);
  const inputRef = useRef(null);

  function cancelLookup() {
    requestRef.current?.abort();
    requestRef.current = null;
    setSubmitting(false);
    setTrackingResult(null);
  }

  useEffect(() => {
    cancelLookup();
    setErrorMessage("");
    setTrackingCode(linkCode);
    // Defer one task so Strict Mode cleanup cancels its first setup before a request.
    const timer = window.setTimeout(() => {
      if (linkCode) lookup(linkCode);
    }, 0);
    return () => {
      window.clearTimeout(timer);
      requestRef.current?.abort();
      requestRef.current = null;
    };
  }, [linkCode]);

  async function lookup(value) {
    cancelLookup();
    setErrorMessage("");
    if (Date.now() < deadline) return;
    const code = normalizeTrackingCode(value);
    if (!code) {
      const message = value.trim() ? "Enter a valid short tracking code or paste your existing 43-character code." : "Enter your tracking code.";
      setErrorMessage(message);
      setRequestError(message);
      inputRef.current?.focus();
      return;
    }
    const controller = new AbortController();
    requestRef.current = controller;
    setSubmitting(true);
    try {
      const result = await trackRepair(code, { signal: controller.signal });
      if (controller.signal.aborted) return;
      if (normalizeTrackingCode(result?.trackingCode ?? "") !== code ||
          typeof result.device !== "string" || typeof result.status !== "string" ||
          !result.receivedAt || !result.lastUpdated || !Array.isArray(result.statusHistory)) {
        throw new Error("The server returned unexpected tracking data. Please try again.");
      }
      setTrackingResult(result);
    } catch (error) {
      if (controller.signal.aborted) return;
      if (error.status === 429) {
        const seconds = error.retryAfterSeconds ?? 60;
        setDeadline(Date.now() + seconds * 1000);
        setRequestError(`Too many tracking requests. Try again in ${seconds} seconds.`);
      } else {
        const message = error.status === 404 ? NOT_FOUND_MESSAGE : error.message || "Repair tracking is temporarily unavailable.";
        if (error.status === 404) setErrorMessage(message);
        setRequestError(message);
      }
    } finally {
      if (requestRef.current === controller) {
        requestRef.current = null;
        setSubmitting(false);
      }
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!submitting && !remaining) lookup(trackingCode);
  }

  function handleNewSearch() {
    setTrackingCode("");
    setTrackingResult(null);
    setErrorMessage("");
    setRequestError("");

    window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }

  return (
    <section
      className={`public-card tracking-card ${
        trackingResult ? "has-result" : ""
      }`}
      aria-busy={submitting}
    >
      {!trackingResult ? (
        <>
          <div className="public-card-header">
            <h2>Track Your Repair</h2>
            <p>Enter the tracking code provided by Cellbank.</p>
          </div>

          <form className="public-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="tracking-code">Tracking Code</label>

              <input
                ref={inputRef}
                type="text"
                id="tracking-code"
                name="tracking-code"
                value={trackingCode}
                onChange={(event) => {
                  cancelLookup();
                  setErrorMessage("");
                  setTrackingCode(event.target.value);
                }}
                placeholder="Paste your tracking code"
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                aria-invalid={Boolean(errorMessage)}
                aria-describedby={
                  errorMessage
                    ? "tracking-code-help tracking-error"
                    : "tracking-code-help"
                }
              />

              <small id="tracking-code-help">
                Enter an 8-character code (for example, K7MP-4X9R), with or without the hyphen. Existing 43-character codes are case-sensitive.
              </small>
            </div>

            {errorMessage && <p id="tracking-error" className="feedback-field-error">{errorMessage}</p>}
            {remaining > 0 && <p role="status">Try again in {remaining} seconds.</p>}

            <button
              className="primary-action"
              type="submit"
              disabled={submitting || remaining > 0}
            >
              <Search size={20} />
              <span>{submitting ? "Checking..." : "Check Status"}</span>
            </button>
          </form>
        </>
      ) : (
        <>
          <div className="tracking-result-header">
            <div style={{ minWidth: 0 }}>
              <span className="tracking-result-label">Tracking Code</span>

              <h3 style={{ overflowWrap: "anywhere" }}>
                {trackingResult.trackingCode}
              </h3>
            </div>

            <StatusBadge status={trackingResult.status} />
          </div>

          <div className="tracking-summary">
            <div>
              <span>Device</span>
              <strong>{trackingResult.device}</strong>
            </div>

            <div>
              <span>Date Received</span>
              <strong>{formatDate(trackingResult.receivedAt)}</strong>
            </div>

            <div>
              <span>Last Updated</span>
              <strong>{formatDate(trackingResult.lastUpdated)}</strong>
            </div>
          </div>

          <div className="tracking-history">
            <div className="tracking-section-header">
              <h3>Repair Progress</h3>
              <p>Follow the latest progress of your repair.</p>
            </div>

            {trackingResult.statusHistory.length > 0 ? (
              <div className="tracking-history-list">
                {trackingResult.statusHistory.map((entry, index) => (
                  <article
                    key={`${entry.changedAt}-${entry.status}-${index}`}
                    className="tracking-history-item"
                  >
                    <div className="tracking-history-marker" />

                    <div className="tracking-history-content">
                      <div className="tracking-history-top">
                        <StatusBadge status={entry.status} />

                        <span>{formatDate(entry.changedAt)}</span>
                      </div>

                      <p>{entry.description}</p>
                      {typeof entry.customerUpdate === "string" && entry.customerUpdate.trim() && (
                        <p className="tracking-customer-update">{entry.customerUpdate}</p>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p>No status history is available for this repair yet.</p>
            )}
          </div>

          <div className="tracking-result-actions">
            <button
              className="secondary-repair-button"
              type="button"
              onClick={handleNewSearch}
            >
              <RotateCcw size={18} />
              <span>Track Another Repair</span>
            </button>
          </div>
        </>
      )}
    </section>
  );
}

export default TrackingPage;
