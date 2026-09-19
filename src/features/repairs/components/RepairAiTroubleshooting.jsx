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

const MAX_ATTACHMENTS = 3;
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

function getInitialMessages() {
  return [
    {
      id: 1,
      sender: "ai",
      text:
        "I can help troubleshoot this repair using the " +
        "device information, reported problem, findings, " +
        "relevant repair history, and optional images.",
      canUseAsFinding: false,
      suggestedDiagnosis: null,
      suggestedStatus: null,
      recommendedParts: [],
      attachments: [],
    },
  ];
}

function getSuggestedStatusLabel(status) {
  if (!status) {
    return "";
  }

  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getMockRecommendation(repair) {
  const searchableText =
    `${repair.reportedProblem ?? ""} ` +
    `${repair.serviceType ?? ""} ` +
    `${repair.device ?? ""}`;

  const normalized = searchableText.toLowerCase();

  if (normalized.includes("charg") || normalized.includes("usb")) {
    return {
      diagnosis: "Possible charging-port, connector, or charging-path fault.",
      parts: ["Charging Port Assembly"],
    };
  }

  if (normalized.includes("battery") || normalized.includes("power")) {
    return {
      diagnosis: "Possible battery, power-delivery, or power-management fault.",
      parts: ["Replacement Battery"],
    };
  }

  if (
    normalized.includes("screen") ||
    normalized.includes("display") ||
    normalized.includes("lcd")
  ) {
    return {
      diagnosis: "Possible display assembly, connector, or display-path fault.",
      parts: ["Display Assembly"],
    };
  }

  if (normalized.includes("keyboard") || normalized.includes("key")) {
    return {
      diagnosis: "Possible keyboard assembly or connector fault.",
      parts: ["Keyboard Assembly"],
    };
  }

  if (
    normalized.includes("overheat") ||
    normalized.includes("cooling") ||
    normalized.includes("fan")
  ) {
    return {
      diagnosis: "Possible cooling-system, fan, or thermal-transfer issue.",
      parts: ["Cooling Fan Assembly"],
    };
  }

  return {
    diagnosis:
      "Possible hardware or subsystem fault requiring targeted confirmation.",
    parts: [],
  };
}

function getMockAiResponse(repair, hasImageAttachments) {
  const device = repair.device;

  const problem = repair.reportedProblem;

  const recommendation = getMockRecommendation(repair);

  const visualContextText = hasImageAttachments
    ? " I also considered the attached image context; confirm any visual observation with physical testing before acting on it."
    : "";

  if (repair.status === "AWAITING_PARTS") {
    return {
      text:
        `${device} is currently waiting for parts. ` +
        `Before resuming the repair, confirm that the required ` +
        `replacement component matches the reported problem: ` +
        `"${problem}". After installation, repeat functional ` +
        `testing before moving toward release.` +
        visualContextText,
      suggestedDiagnosis: recommendation.diagnosis,
      suggestedStatus: "IN_PROGRESS",
      recommendedParts: recommendation.parts,
    };
  }

  if (repair.status === "IN_PROGRESS") {
    return {
      text:
        `For ${device}, continue diagnosis around the reported ` +
        `problem: "${problem}". Verify the suspected component ` +
        `or subsystem with targeted testing. If a required ` +
        `replacement component is unavailable, document the ` +
        `finding and place the repair in Awaiting Parts.` +
        visualContextText,
      suggestedDiagnosis: recommendation.diagnosis,
      suggestedStatus: "AWAITING_PARTS",
      recommendedParts: recommendation.parts,
    };
  }

  if (repair.status === "RECEIVED") {
    return {
      text:
        `Begin with a structured inspection of ${device} based on ` +
        `the reported problem: "${problem}". Record objective ` +
        `findings first, then prepare an estimate or customer ` +
        `approval request when the likely repair is identified.` +
        visualContextText,
      suggestedDiagnosis: recommendation.diagnosis,
      suggestedStatus: "AWAITING_APPROVAL",
      recommendedParts: recommendation.parts,
    };
  }

  if (repair.status === "READY_FOR_RELEASE") {
    return {
      text:
        `${device} is marked Ready for Release. Perform a final ` +
        `functional check against the original reported problem: ` +
        `"${problem}" and confirm that the device is ready for ` +
        `customer handoff.` +
        visualContextText,
      suggestedDiagnosis: null,
      suggestedStatus: null,
      recommendedParts: [],
    };
  }

  return {
    text:
      `Review ${device} against the reported problem: "${problem}". ` +
      `Use the repair history and saved findings as supporting ` +
      `context, and confirm any official action through the normal ` +
      `Cellbank repair workflow.` +
      visualContextText,
    suggestedDiagnosis: recommendation.diagnosis,
    suggestedStatus: null,
    recommendedParts: recommendation.parts,
  };
}

function RepairAiTroubleshooting({
  repair,
  onUseAsFinding,
  onSuggestStatus,
  onSuggestPart,
}) {
  const responseTimeoutRef = useRef(null);

  const fileInputRef = useRef(null);

  const objectUrlsRef = useRef(new Set());

  // -----------------------------
  // CONVERSATION STATE
  // -----------------------------

  const [messages, setMessages] = useState(getInitialMessages);

  const [messageText, setMessageText] = useState("");

  const [isResponding, setIsResponding] = useState(false);

  const [attachments, setAttachments] = useState([]);

  const [attachmentError, setAttachmentError] = useState("");

  // -----------------------------
  // REPAIR CHANGE SYNC
  // -----------------------------

  useEffect(() => {
    if (responseTimeoutRef.current) {
      clearTimeout(responseTimeoutRef.current);

      responseTimeoutRef.current = null;
    }

    objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));

    objectUrlsRef.current.clear();

    setMessages(getInitialMessages());

    setMessageText("");
    setAttachments([]);
    setAttachmentError("");
    setIsResponding(false);

    return () => {
      if (responseTimeoutRef.current) {
        clearTimeout(responseTimeoutRef.current);
      }

      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));

      objectUrlsRef.current.clear();
    };
  }, [repair.id]);

  // -----------------------------
  // REPAIR HISTORY CONTEXT
  // -----------------------------

  const previousRepairs = repair.previousRepairs ?? [];

  const problemCounts = previousRepairs.reduce((counts, previousRepair) => {
    const category = previousRepair.problemCategory;

    counts[category] = (counts[category] || 0) + 1;

    return counts;
  }, {});

  const repeatedProblems = Object.entries(problemCounts).filter(
    ([, count]) => count > 1,
  );

  // -----------------------------
  // IMAGE ATTACHMENTS
  // -----------------------------

  function handleImageChange(event) {
    const files = Array.from(event.target.files ?? []);

    event.target.value = "";

    if (files.length === 0) {
      return;
    }

    const availableSlots = MAX_ATTACHMENTS - attachments.length;

    if (availableSlots <= 0) {
      setAttachmentError(
        `You can attach up to ${MAX_ATTACHMENTS} images per message.`,
      );

      return;
    }

    const validFiles = [];
    let invalidFileFound = false;

    files.forEach((file) => {
      const validType = ALLOWED_IMAGE_TYPES.includes(file.type);

      const validSize = file.size <= MAX_IMAGE_SIZE_BYTES;

      if (validType && validSize) {
        validFiles.push(file);
      } else {
        invalidFileFound = true;
      }
    });

    const selectedFiles = validFiles.slice(0, availableSlots);

    const newAttachments = selectedFiles.map((file) => {
      const previewUrl = URL.createObjectURL(file);

      objectUrlsRef.current.add(previewUrl);

      return {
        id: `${file.name}-${file.lastModified}-${previewUrl}`,
        file,
        previewUrl,
      };
    });

    if (newAttachments.length > 0) {
      setAttachments((current) => [...current, ...newAttachments]);
    }

    if (invalidFileFound || validFiles.length > selectedFiles.length) {
      setAttachmentError(
        "Only JPEG, PNG, or WebP images up to 10 MB are allowed, with a maximum of 3 images per message.",
      );
    } else {
      setAttachmentError("");
    }
  }

  function handleRemoveAttachment(id) {
    setAttachments((current) => {
      const attachment = current.find((item) => item.id === id);

      if (attachment) {
        URL.revokeObjectURL(attachment.previewUrl);

        objectUrlsRef.current.delete(attachment.previewUrl);
      }

      return current.filter((item) => item.id !== id);
    });

    setAttachmentError("");
  }

  // -----------------------------
  // MESSAGE SUBMISSION
  // -----------------------------

  function handleSubmit(event) {
    event.preventDefault();

    const trimmedMessage = messageText.trim();

    if ((!trimmedMessage && attachments.length === 0) || isResponding) {
      return;
    }

    const sentAttachments = attachments.map((attachment) => ({
      id: attachment.id,
      name: attachment.file.name,
      previewUrl: attachment.previewUrl,
    }));

    const technicianMessage = {
      id: Date.now(),
      sender: "user",
      text:
        trimmedMessage ||
        "Please review the attached image(s) for troubleshooting context.",
      attachments: sentAttachments,
      canUseAsFinding: false,
      suggestedDiagnosis: null,
      suggestedStatus: null,
      recommendedParts: [],
    };

    setMessages((currentMessages) => [...currentMessages, technicianMessage]);

    const hasImageAttachments = sentAttachments.length > 0;

    setMessageText("");
    setAttachments([]);
    setAttachmentError("");
    setIsResponding(true);

    // Temporary frontend AI simulation.
    // Later:
    // React -> Spring Boot -> AI service.
    // Images will be validated by Spring Boot
    // before being forwarded to the AI provider.
    responseTimeoutRef.current = setTimeout(() => {
      const mockResponse = getMockAiResponse(repair, hasImageAttachments);

      const aiMessage = {
        id: Date.now() + 1,
        sender: "ai",
        text: mockResponse.text,
        attachments: [],
        canUseAsFinding: true,
        suggestedDiagnosis: mockResponse.suggestedDiagnosis,
        suggestedStatus: mockResponse.suggestedStatus,
        recommendedParts: mockResponse.recommendedParts ?? [],
      };

      setMessages((currentMessages) => [...currentMessages, aiMessage]);

      setIsResponding(false);
      responseTimeoutRef.current = null;
    }, 700);
  }

  // -----------------------------
  // AI ACTION HANDLERS
  // -----------------------------

  function handleUseAsFinding(message) {
    if (onUseAsFinding) {
      onUseAsFinding(message.suggestedDiagnosis || message.text);
    }
  }

  function handleSuggestStatus(status) {
    if (onSuggestStatus) {
      onSuggestStatus(status);
    }
  }

  function handleSuggestPart(partName) {
    if (onSuggestPart) {
      onSuggestPart(partName);
    }
  }

  return (
    <section className="page-content repair-ai">
      {/* =========================
                HEADER
            ========================== */}
      <div className="workspace-section-header">
        <div>
          <h3>AI Troubleshooting</h3>

          <p className="workspace-section-description">
            Use AI as a troubleshooting assistant for this repair.
          </p>
        </div>
      </div>

      {/* =========================
                ADVISORY NOTICE
            ========================== */}
      <div className="ai-advisory-note">
        <Bot size={18} />

        <p>
          AI suggestions are advisory. Review diagnoses, status recommendations,
          and parts before applying them through the normal repair workflow.
        </p>
      </div>

      {/* =========================
                REPAIR CONTEXT
            ========================== */}
      <div className="ai-repair-context">
        <div>
          <span>Device</span>

          <strong>{repair.device}</strong>
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

      {/* =========================
                PREVIOUS REPAIR CONTEXT
            ========================== */}
      {previousRepairs.length > 0 ? (
        <div className="ai-history-context">
          <h4>Previous Repair Context</h4>

          <p>
            Previous Repairs: <strong>{previousRepairs.length}</strong>
          </p>

          {repeatedProblems.length > 0 ? (
            <div className="repeated-problem-alert">
              <strong>Repeated Problem Detected</strong>

              {repeatedProblems.map(([problemCategory, count]) => (
                <p key={problemCategory}>
                  {problemCategory} issue appeared {count} times in previous
                  repairs.
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
      )}

      {/* =========================
                CONVERSATION
            ========================== */}
      <div className="ai-conversation">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`ai-message ${
              message.sender === "user"
                ? "technician-message"
                : "assistant-message"
            }`}
          >
            <div className="ai-message-icon">
              {message.sender === "user" ? (
                <User size={18} />
              ) : (
                <Bot size={18} />
              )}
            </div>

            <div className="ai-message-content">
              <span>
                {message.sender === "user" ? "Technician" : "AI Assistant"}
              </span>

              <p>{message.text}</p>

              {message.attachments?.length > 0 && (
                <div className="ai-message-attachments">
                  {message.attachments.map((attachment) => (
                    <img
                      key={attachment.id}
                      src={attachment.previewUrl}
                      alt={attachment.name}
                    />
                  ))}
                </div>
              )}

              {message.suggestedDiagnosis && (
                <div className="ai-recommendation-block">
                  <span>Possible Diagnosis</span>

                  <strong>{message.suggestedDiagnosis}</strong>
                </div>
              )}

              {message.recommendedParts?.length > 0 && (
                <div className="ai-recommendation-block">
                  <span>Recommended Part</span>

                  {message.recommendedParts.map((part) => (
                    <strong key={part}>{part}</strong>
                  ))}
                </div>
              )}

              {message.suggestedStatus && (
                <div className="ai-recommendation-block">
                  <span>Suggested Status</span>

                  <strong>
                    {getSuggestedStatusLabel(message.suggestedStatus)}
                  </strong>
                </div>
              )}

              {(message.canUseAsFinding ||
                message.suggestedStatus ||
                message.recommendedParts?.length > 0) && (
                <div className="ai-message-actions">
                  {message.canUseAsFinding && (
                    <button
                      className="ai-finding-button"
                      type="button"
                      onClick={() => handleUseAsFinding(message)}
                    >
                      <ClipboardPlus size={16} />

                      <span>Use as Finding</span>
                    </button>
                  )}

                  {message.suggestedStatus && (
                    <button
                      className="ai-status-button"
                      type="button"
                      onClick={() =>
                        handleSuggestStatus(message.suggestedStatus)
                      }
                    >
                      <ArrowRightCircle size={16} />

                      <span>Review Suggested Status</span>
                    </button>
                  )}

                  {message.recommendedParts?.map((part) => (
                    <button
                      key={part}
                      className="ai-part-button"
                      type="button"
                      onClick={() => handleSuggestPart(part)}
                    >
                      <PackageSearch size={16} />

                      <span>Add Recommended Part</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isResponding && (
          <div className="ai-message assistant-message">
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

      {/* =========================
                MESSAGE INPUT
            ========================== */}
      <form className="ai-message-form" onSubmit={handleSubmit}>
        {attachments.length > 0 && (
          <div className="ai-attachment-preview-list">
            {attachments.map((attachment) => (
              <div key={attachment.id} className="ai-attachment-preview">
                <img src={attachment.previewUrl} alt={attachment.file.name} />

                <button
                  type="button"
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
          <p className="ai-attachment-error">{attachmentError}</p>
        )}

        <div className="ai-message-composer-row">
          <button
            className="ai-attachment-button"
            type="button"
            disabled={isResponding || attachments.length >= MAX_ATTACHMENTS}
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
            onChange={handleImageChange}
          />

          <textarea
            value={messageText}
            onChange={(event) => setMessageText(event.target.value)}
            rows="3"
            placeholder={
              "Describe your observation, attach an image, " +
              "or ask a troubleshooting question..."
            }
            disabled={isResponding}
          />

          <button
            className="create-repair-button"
            type="submit"
            disabled={
              isResponding || (!messageText.trim() && attachments.length === 0)
            }
          >
            <Send size={18} />

            <span>Send</span>
          </button>
        </div>
      </form>
    </section>
  );
}

export default RepairAiTroubleshooting;
