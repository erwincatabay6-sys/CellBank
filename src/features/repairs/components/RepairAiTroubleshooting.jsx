import { useEffect, useRef, useState } from "react";

import {
  Send,
  Bot,
  User,
  ClipboardPlus,
  ArrowRightCircle,
  ImagePlus,
  X,
  PackageSearch,
} from "lucide-react";

import {
  getRepairAiMessages,
  getRepairAiContext,
  sendRepairAiMessage,
} from "../../../api/repairAiApi.js";

import { RequestError } from "../../../api/http.js";
import { getProblemCategoryLabel } from "../problemCategories.js";

const MAX_ATTACHMENTS = 3;
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const INTRODUCTION =
  "I can help troubleshoot this repair using the device information, " +
  "reported problem, findings, relevant repair history, and optional images.";

function getStatusLabel(status) {
  return (status || "")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getErrorMessage(error) {
  const fieldErrors = Object.values(error?.errors || {}).filter(
    (value) => typeof value === "string",
  );

  return (
    fieldErrors[0] || error?.message || "The AI request could not be completed."
  );
}

// Reset this tab's local state when navigating to another repair.
function RepairAiTroubleshooting(props) {
  return <RepairAiConversation key={props.repair.id} {...props} />;
}

function RepairAiConversation({
  repair,
  controlsDisabled = false,
  allowedStatuses = [],
  onUseAsFinding,
  onSuggestStatus,
  onSuggestPart,
}) {
  const fileInputRef = useRef(null);
  const objectUrlsRef = useRef(new Set());
  const mountedRef = useRef(false);
  const sendingRef = useRef(false);
  const sendControllerRef = useRef(null);
  const loadControllerRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [context, setContext] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [attachments, setAttachments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [isResponding, setIsResponding] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [sendError, setSendError] = useState("");
  const [attachmentError, setAttachmentError] = useState("");
  const [reloadRequired, setReloadRequired] = useState(false);
  const [reloadCount, setReloadCount] = useState(0);

  const isClosed = ["COMPLETED", "CANCELLED"].includes(repair.status);

  const interactionDisabled =
    controlsDisabled ||
    loading ||
    Boolean(loadError) ||
    isResponding ||
    reloadRequired ||
    isClosed;

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      sendControllerRef.current?.abort();
      loadControllerRef.current?.abort();

      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      objectUrlsRef.current.clear();
    };
  }, []);

  useEffect(() => {
    // Refresh after the active send finishes instead.
    if (sendingRef.current) {
      return;
    }

    const controller = new AbortController();
    loadControllerRef.current = controller;

    setLoading(true);
    setLoadError("");

    async function loadConversation() {
      try {
        const [savedMessages, savedContext] = await Promise.all([
          getRepairAiMessages(repair.id, {
            signal: controller.signal,
          }),
          getRepairAiContext(repair.id, {
            signal: controller.signal,
          }),
        ]);

        if (!Array.isArray(savedMessages) || !savedContext?.device) {
          throw new Error("The server returned invalid AI conversation data.");
        }

        if (!mountedRef.current || controller.signal.aborted) {
          return;
        }

        setMessages(savedMessages);
        setContext(savedContext);
      } catch (error) {
        if (mountedRef.current && !controller.signal.aborted) {
          setLoadError(getErrorMessage(error));
        }
      } finally {
        if (mountedRef.current && !controller.signal.aborted) {
          setLoading(false);
        }

        if (loadControllerRef.current === controller) {
          loadControllerRef.current = null;
        }
      }
    }

    loadConversation();

    return () => controller.abort();
  }, [repair.id, repair.updatedAt, reloadCount]);

  function clearAttachments() {
    objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    objectUrlsRef.current.clear();
    setAttachments([]);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleImageChange(event) {
    const files = Array.from(event.target.files || []);
    event.target.value = "";

    if (interactionDisabled || files.length === 0) {
      return;
    }

    const availableSlots = MAX_ATTACHMENTS - attachments.length;
    const validFiles = files.filter(
      (file) =>
        ALLOWED_IMAGE_TYPES.includes(file.type) &&
        file.size > 0 &&
        file.size <= MAX_IMAGE_SIZE_BYTES,
    );

    const selectedFiles = validFiles.slice(0, availableSlots);

    const newAttachments = selectedFiles.map((file) => {
      const previewUrl = URL.createObjectURL(file);
      objectUrlsRef.current.add(previewUrl);

      return {
        id: previewUrl,
        file,
        previewUrl,
      };
    });

    setAttachments((current) => [...current, ...newAttachments]);

    setAttachmentError(
      validFiles.length !== files.length ||
        selectedFiles.length !== validFiles.length
        ? "Only non-empty JPEG, PNG, or WebP images up to 10 MB are allowed, with a maximum of 3 images per message."
        : "",
    );
  }

  function handleRemoveAttachment(id) {
    if (interactionDisabled) {
      return;
    }

    const attachment = attachments.find((item) => item.id === id);

    if (attachment) {
      URL.revokeObjectURL(attachment.previewUrl);
      objectUrlsRef.current.delete(attachment.previewUrl);
    }

    setAttachments((current) => current.filter((item) => item.id !== id));
    setAttachmentError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (interactionDisabled || sendingRef.current) {
      return;
    }

    const trimmedMessage = messageText.trim();

    if (!trimmedMessage && attachments.length === 0) {
      return;
    }

    if (trimmedMessage.length > 5000) {
      setSendError("Message must not exceed 5000 characters.");
      return;
    }

    if (!repair.updatedAt || context?.repairUpdatedAt !== repair.updatedAt) {
      setSendError(
        "The repair information changed. Reload the page before sending.",
      );
      setReloadRequired(true);
      return;
    }

    sendingRef.current = true;
    setIsResponding(true);
    setSendError("");
    setAttachmentError("");

    loadControllerRef.current?.abort();

    const controller = new AbortController();
    sendControllerRef.current = controller;

    try {
      const savedMessages = await sendRepairAiMessage(
        repair.id,
        {
          messageText: trimmedMessage,
          expectedUpdatedAt: repair.updatedAt,
          attachments: attachments.map((attachment) => attachment.file),
        },
        { signal: controller.signal },
      );

      if (!Array.isArray(savedMessages)) {
        throw new RequestError(
          "INVALID_RESPONSE",
          "The server returned an unexpected response. Reload the page to check whether the exchange was saved before sending again.",
          true,
        );
      }

      if (!mountedRef.current || controller.signal.aborted) {
        return;
      }

      setMessages(savedMessages);
      setMessageText("");
      clearAttachments();
    } catch (error) {
      if (!mountedRef.current || controller.signal.aborted) {
        return;
      }

      const mustReload =
        error?.outcomeUncertain ||
        [401, 403, 409, 500, 502, 504].includes(error?.status);

      setReloadRequired(Boolean(mustReload));
      setSendError(
        getErrorMessage(error) +
          (mustReload ? " Reload the page before sending again." : ""),
      );
    } finally {
      sendingRef.current = false;

      if (sendControllerRef.current === controller) {
        sendControllerRef.current = null;
      }

      if (mountedRef.current) {
        setIsResponding(false);
        setReloadCount((current) => current + 1);
      }
    }
  }

  const previousRepairs = context?.previousRepairs || [];
  const repeatedProblems = context?.repeatedProblems || [];

  const deviceLabel =
    repair.device ||
    [context?.device?.brand, context?.device?.model]
      .filter(Boolean)
      .join(" ") ||
    "—";

  return (
    <section className="page-content repair-ai">
      <div className="workspace-section-header">
        <div>
          <h3>AI Troubleshooting</h3>

          <p className="workspace-section-description">
            Use AI as a troubleshooting assistant for this repair.
          </p>
        </div>
      </div>

      <div className="ai-advisory-note">
        <Bot size={18} />

        <p>
          AI suggestions are advisory. Review diagnoses, status recommendations,
          and parts before applying them through the normal repair workflow.
        </p>
      </div>

      <div className="ai-repair-context">
        <div>
          <span>Device</span>
          <strong>{deviceLabel}</strong>
        </div>

        <div>
          <span>Reported Problem</span>
          <strong>{repair.reportedProblem}</strong>
        </div>

        <div>
          <span>Service Type</span>
          <strong>{repair.serviceType}</strong>
        </div>
      </div>

      {loading && (
        <div className="workspace-empty-state" role="status">
          <p>Loading AI conversation and repair context...</p>
        </div>
      )}

      {loadError && (
        <div className="customer-form-error" role="alert">
          <p>{loadError}</p>

          <button
            type="button"
            className="ai-status-button"
            disabled={loading || isResponding}
            onClick={() => setReloadCount((current) => current + 1)}
          >
            Try Again
          </button>
        </div>
      )}

      {!loading &&
        !loadError &&
        context &&
        (previousRepairs.length > 0 ? (
          <div className="ai-history-context">
            <h4>Previous Repair Context</h4>

            <p>
              Previous Repairs: <strong>{previousRepairs.length}</strong>
            </p>

            {repeatedProblems.length > 0 ? (
              <div className="repeated-problem-alert">
                <strong>Repeated Problem Detected</strong>

                {repeatedProblems.map((problem) => (
                  <p key={problem.problemCategory}>
                    {getProblemCategoryLabel(problem.problemCategory)} issue
                    recorded in {problem.repairCount} repair visits.
                  </p>
                ))}
              </div>
            ) : (
              <p>No repeated problem pattern detected.</p>
            )}
          </div>
        ) : (
          <div className="workspace-empty-state ai-history-empty">
            <strong>No previous repair history</strong>

            <p>
              This device has no previous repair records available for
              troubleshooting context.
            </p>
          </div>
        ))}

      <div className="ai-conversation" aria-busy={loading || isResponding}>
        {!loading && !loadError && messages.length === 0 && (
          <div className="ai-message assistant-message">
            <div className="ai-message-icon">
              <Bot size={18} />
            </div>

            <div className="ai-message-content">
              <span>AI Assistant</span>
              <p>{INTRODUCTION}</p>
            </div>
          </div>
        )}

        {messages.map((message) => {
          const isStaff = message.senderType === "STAFF";
          const isAi = message.senderType === "AI";

          const canUseAsFinding =
            isAi && Boolean(message.suggestedDiagnosis?.trim());

          const parts = Array.isArray(message.recommendedParts)
            ? [...new Set(message.recommendedParts)]
            : [];

          const canReviewStatus = allowedStatuses.includes(
            message.suggestedStatus,
          );

          return (
            <div
              key={message.id}
              className={`ai-message ${
                isStaff ? "technician-message" : "assistant-message"
              }`}
            >
              <div className="ai-message-icon">
                {isStaff ? <User size={18} /> : <Bot size={18} />}
              </div>

              <div className="ai-message-content">
                <span>
                  {isStaff ? message.senderName || "Staff" : "AI Assistant"}
                </span>

                {message.messageText && (
                  <p style={{ whiteSpace: "pre-wrap" }}>
                    {message.messageText}
                  </p>
                )}

                {message.attachments?.length > 0 && (
                  <div className="ai-message-attachments">
                    {message.attachments.map((attachment) => (
                      <img
                        key={attachment.id}
                        src={attachment.imageUrl}
                        alt={attachment.originalFilename || "Repair attachment"}
                        loading="lazy"
                      />
                    ))}
                  </div>
                )}

                {isAi && message.suggestedDiagnosis && (
                  <div className="ai-recommendation-block">
                    <span>Possible Diagnosis</span>
                    <strong>{message.suggestedDiagnosis}</strong>
                  </div>
                )}

                {isAi && parts.length > 0 && (
                  <div className="ai-recommendation-block">
                    <span>Recommended Part</span>

                    {parts.map((part) => (
                      <strong key={part}>{part}</strong>
                    ))}
                  </div>
                )}

                {isAi && message.suggestedStatus && (
                  <div className="ai-recommendation-block">
                    <span>Suggested Status</span>
                    <strong>{getStatusLabel(message.suggestedStatus)}</strong>
                  </div>
                )}

                {isAi &&
                  (canUseAsFinding ||
                    message.suggestedStatus ||
                    parts.length > 0) && (
                    <div className="ai-message-actions">
                      {canUseAsFinding && (
                        <button
                          className="ai-finding-button"
                          type="button"
                          disabled={
                            interactionDisabled ||
                            typeof onUseAsFinding !== "function"
                          }
                          onClick={() =>
                            onUseAsFinding(message.suggestedDiagnosis)
                          }
                        >
                          <ClipboardPlus size={16} />
                          <span>Use as Finding</span>
                        </button>
                      )}

                      {message.suggestedStatus && (
                        <button
                          className="ai-status-button"
                          type="button"
                          disabled={
                            interactionDisabled ||
                            !canReviewStatus ||
                            typeof onSuggestStatus !== "function"
                          }
                          onClick={() =>
                            onSuggestStatus(message.suggestedStatus)
                          }
                        >
                          <ArrowRightCircle size={16} />
                          <span>Review Suggested Status</span>
                        </button>
                      )}

                      {parts.map((part) => (
                        <button
                          key={part}
                          className="ai-part-button"
                          type="button"
                          disabled={
                            interactionDisabled ||
                            typeof onSuggestPart !== "function"
                          }
                          onClick={() => onSuggestPart(part)}
                        >
                          <PackageSearch size={16} />
                          <span>Add Recommended Part</span>
                        </button>
                      ))}
                    </div>
                  )}
              </div>
            </div>
          );
        })}

        {isResponding && (
          <div className="ai-message assistant-message" role="status">
            <div className="ai-message-icon">
              <Bot size={18} />
            </div>

            <div className="ai-message-content">
              <span>AI Assistant</span>
              <p>Thinking...</p>
            </div>
          </div>
        )}
      </div>

      {sendError && (
        <div className="customer-form-error" role="alert">
          <p>{sendError}</p>

          {reloadRequired && (
            <button
              type="button"
              className="ai-status-button"
              onClick={() => window.location.reload()}
            >
              Reload Page
            </button>
          )}
        </div>
      )}

      {isClosed && (
        <div className="workspace-empty-state">
          <p>
            This repair is closed. You can view its saved AI conversation, but
            cannot send new messages or apply suggestions.
          </p>
        </div>
      )}

      <form className="ai-message-form" onSubmit={handleSubmit}>
        {attachments.length > 0 && (
          <div className="ai-attachment-preview-list">
            {attachments.map((attachment) => (
              <div key={attachment.id} className="ai-attachment-preview">
                <img src={attachment.previewUrl} alt={attachment.file.name} />

                <button
                  type="button"
                  disabled={interactionDisabled}
                  aria-label={`Remove ${attachment.file.name}`}
                  onClick={() => handleRemoveAttachment(attachment.id)}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {attachmentError && (
          <p className="ai-attachment-error" role="alert">
            {attachmentError}
          </p>
        )}

        <div className="ai-message-composer-row">
          <button
            className="ai-attachment-button"
            type="button"
            disabled={
              interactionDisabled || attachments.length >= MAX_ATTACHMENTS
            }
            onClick={() => fileInputRef.current?.click()}
          >
            <ImagePlus size={18} />
            <span>Attach Image</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            hidden
            disabled={interactionDisabled}
            onChange={handleImageChange}
          />

          <textarea
            value={messageText}
            onChange={(event) => setMessageText(event.target.value)}
            rows="3"
            maxLength={5000}
            aria-label="Message to AI troubleshooting assistant"
            placeholder={
              "Describe your observation, attach an image, " +
              "or ask a troubleshooting question..."
            }
            disabled={interactionDisabled}
          />

          <button
            className="create-repair-button"
            type="submit"
            disabled={
              interactionDisabled ||
              (!messageText.trim() && attachments.length === 0)
            }
          >
            <Send size={18} />
            <span>{isResponding ? "Sending..." : "Send"}</span>
          </button>
        </div>
      </form>
    </section>
  );
}

export default RepairAiTroubleshooting;
