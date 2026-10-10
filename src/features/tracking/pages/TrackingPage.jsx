import { useEffect, useRef, useState } from "react";
import { Search, RotateCcw } from "lucide-react";

import StatusBadge from "../../../components/StatusBadge.jsx";
import { trackRepair } from "../../../api/trackingApi.js";

import "../tracking.css";

const TRACKING_CODE_PATTERN = /^[A-Za-z0-9_-]{43}$/;

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
  const [trackingCode, setTrackingCode] = useState("");
  const [trackingResult, setTrackingResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const requestRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    return () => {
      requestRef.current?.abort();
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();

    if (requestRef.current) {
      return;
    }

    const code = trackingCode.trim();

    setErrorMessage("");

    if (!code) {
      setErrorMessage("Enter your tracking code.");
      return;
    }

    if (!TRACKING_CODE_PATTERN.test(code)) {
      setErrorMessage(NOT_FOUND_MESSAGE);
      return;
    }

    const controller = new AbortController();
    requestRef.current = controller;

    setSubmitting(true);
    setTrackingResult(null);

    try {
      const result = await trackRepair(code, {
        signal: controller.signal,
      });

      if (
        result?.trackingCode !== code ||
        typeof result.device !== "string" ||
        typeof result.status !== "string" ||
        !result.receivedAt ||
        !result.lastUpdated ||
        !Array.isArray(result.statusHistory)
      ) {
        throw new Error(
          "The server returned unexpected tracking data. Please try again.",
        );
      }

      if (!controller.signal.aborted) {
        setTrackingResult(result);
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        setErrorMessage(
          error?.status === 404
            ? NOT_FOUND_MESSAGE
            : error?.message ||
                "Repair tracking is temporarily unavailable. Please try again.",
        );
      }
    } finally {
      if (requestRef.current === controller) {
        requestRef.current = null;
      }

      if (!controller.signal.aborted) {
        setSubmitting(false);
      }
    }
  }

  function handleNewSearch() {
    setTrackingCode("");
    setTrackingResult(null);
    setErrorMessage("");

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
                onChange={(event) => setTrackingCode(event.target.value)}
                placeholder="Paste your tracking code"
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                disabled={submitting}
                aria-invalid={Boolean(errorMessage)}
                aria-describedby={
                  errorMessage
                    ? "tracking-code-help tracking-error"
                    : "tracking-code-help"
                }
              />

              <small id="tracking-code-help">
                Codes are case-sensitive. Paste the code exactly as provided.
              </small>
            </div>

            {errorMessage && (
              <div
                id="tracking-error"
                className="public-form-error"
                role="alert"
              >
                {errorMessage}
              </div>
            )}

            <button
              className="primary-action"
              type="submit"
              disabled={submitting}
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
