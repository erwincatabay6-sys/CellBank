import { useState } from "react";

import {
    Send,
    Bot,
    User,
    ClipboardPlus,
    ArrowRightCircle
} from "lucide-react";


const initialMessages = [
    {
        id: 1,

        sender: "ai",

        text:
            "I can help troubleshoot this repair using the " +
            "device information, reported problem, findings, " +
            "and relevant repair history.",

        canUseAsFinding: false,

        suggestedStatus: null
    }
];


function RepairAiTroubleshooting({
    repair,
    onUseAsFinding,
    onSuggestStatus
}) {

    // -----------------------------
    // CONVERSATION STATE
    // -----------------------------

    const [messages, setMessages] =
        useState(initialMessages);

    const [messageText, setMessageText] =
        useState("");

    const [isResponding, setIsResponding] =
        useState(false);


    // -----------------------------
    // REPAIR HISTORY CONTEXT
    // -----------------------------

    const previousRepairs =
        repair.previousRepairs ?? [];


    const problemCounts =
        previousRepairs.reduce(
            (counts, previousRepair) => {

                const category =
                    previousRepair.problemCategory;


                counts[category] =
                    (counts[category] || 0) + 1;


                return counts;

            },
            {}
        );


    const repeatedProblems =
        Object.entries(problemCounts)
            .filter(([, count]) =>
                count > 1
            );


    // -----------------------------
    // MESSAGE SUBMISSION
    // -----------------------------

    function handleSubmit(event) {

        event.preventDefault();


        const trimmedMessage =
            messageText.trim();


        if (!trimmedMessage) {
            return;
        }


        const technicianMessage = {
            id: Date.now(),

            sender: "user",

            text:
                trimmedMessage,

            canUseAsFinding:
                false,

            suggestedStatus:
                null
        };


        setMessages((currentMessages) => [
            ...currentMessages,
            technicianMessage
        ]);


        setMessageText("");

        setIsResponding(true);


        // Temporary frontend AI simulation.
        // Later:
        // React -> Spring Boot -> AI service.
        setTimeout(() => {

            const aiMessage = {
                id: Date.now() + 1,

                sender: "ai",

                text:
                    "The charging port shows signs of intermittent " +
                    "contact. Inspect the port connection and power " +
                    "path. If the required replacement charging port " +
                    "is currently unavailable, the repair should wait " +
                    "for the necessary part.",

                canUseAsFinding:
                    true,

                // Temporary mock AI suggestion.
                suggestedStatus:
                    "AWAITING_PARTS"
            };


            setMessages((currentMessages) => [
                ...currentMessages,
                aiMessage
            ]);


            setIsResponding(false);

        }, 700);
    }


    // -----------------------------
    // AI ACTION HANDLERS
    // -----------------------------

    function handleUseAsFinding(text) {

        if (onUseAsFinding) {
            onUseAsFinding(text);
        }
    }


    function handleSuggestStatus(status) {

        if (onSuggestStatus) {
            onSuggestStatus(status);
        }
    }


    return (
        <section className="page-content repair-ai">

            {/* =========================
                HEADER
            ========================== */}
            <div className="workspace-section-header">

                <div>

                    <h3>
                        AI Troubleshooting
                    </h3>

                    <p className="workspace-section-description">
                        Use AI as a troubleshooting assistant
                        for this repair.
                    </p>

                </div>

            </div>


            {/* =========================
                REPAIR CONTEXT
            ========================== */}
            <div className="ai-repair-context">

                {/* DEVICE */}
                <div>

                    <span>
                        Device
                    </span>

                    <strong>
                        {repair.device}
                    </strong>

                </div>


                {/* REPORTED PROBLEM */}
                <div>

                    <span>
                        Reported Problem
                    </span>

                    <strong>
                        {repair.reportedProblem}
                    </strong>

                </div>


                {/* SERVICE TYPE */}
                <div>

                    <span>
                        Service Type
                    </span>

                    <strong>
                        {repair.serviceType}
                    </strong>

                </div>

            </div>


            {/* =========================
                PREVIOUS REPAIR CONTEXT
            ========================== */}
            {previousRepairs.length > 0 ? (

                <div className="ai-history-context">

                    <h4>
                        Previous Repair Context
                    </h4>


                    <p>
                        Previous Repairs:{" "}

                        <strong>
                            {previousRepairs.length}
                        </strong>
                    </p>


                    {repeatedProblems.length > 0 ? (

                        <div className="repeated-problem-alert">

                            <strong>
                                Repeated Problem Detected
                            </strong>


                            {repeatedProblems.map(
                                ([problem, count]) => (

                                    <p key={problem}>
                                        {problem} issue appeared{" "}
                                        {count} times in previous repairs.
                                    </p>

                                )
                            )}

                        </div>

                    ) : (

                        <p>
                            No repeated problem pattern detected.
                        </p>

                    )}

                </div>

            ) : (

                <div className="workspace-empty-state ai-history-empty">

                    <strong>
                        No previous repair history
                    </strong>

                    <p>
                        This device has no previous repair
                        records available for troubleshooting context.
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
                        className={
                            `ai-message ${
                                message.sender === "user"
                                    ? "technician-message"
                                    : "assistant-message"
                            }`
                        }
                    >

                        {/* MESSAGE ICON */}
                        <div className="ai-message-icon">

                            {message.sender === "user"
                                ? <User size={18} />
                                : <Bot size={18} />
                            }

                        </div>


                        {/* MESSAGE CONTENT */}
                        <div className="ai-message-content">

                            <span>
                                {message.sender === "user"
                                    ? "Technician"
                                    : "AI Assistant"
                                }
                            </span>


                            <p>
                                {message.text}
                            </p>


                            {/* AI ACTIONS */}
                            {(message.canUseAsFinding ||
                                message.suggestedStatus) && (

                                <div className="ai-message-actions">


                                    {/* USE AS FINDING */}
                                    {message.canUseAsFinding && (

                                        <button
                                            className="ai-finding-button"
                                            type="button"
                                            onClick={() =>
                                                handleUseAsFinding(
                                                    message.text
                                                )
                                            }
                                        >
                                            <ClipboardPlus size={16} />

                                            <span>
                                                Use as Finding
                                            </span>
                                        </button>

                                    )}


                                    {/* SUGGEST STATUS */}
                                    {message.suggestedStatus && (

                                        <button
                                            className="ai-status-button"
                                            type="button"
                                            onClick={() =>
                                                handleSuggestStatus(
                                                    message.suggestedStatus
                                                )
                                            }
                                        >
                                            <ArrowRightCircle size={16} />

                                            <span>
                                                Suggest Awaiting Parts
                                            </span>
                                        </button>

                                    )}

                                </div>

                            )}

                        </div>

                    </div>

                ))}


                {/* THINKING STATE */}
                {isResponding && (

                    <div className="ai-message assistant-message">

                        <div className="ai-message-icon">
                            <Bot size={18} />
                        </div>


                        <div className="ai-message-content">

                            <span>
                                AI Assistant
                            </span>

                            <p>
                                Thinking...
                            </p>

                        </div>

                    </div>

                )}

            </div>


            {/* =========================
                MESSAGE INPUT
            ========================== */}
            <form
                className="ai-message-form"
                onSubmit={handleSubmit}
            >

                <textarea
                    value={messageText}
                    onChange={(event) =>
                        setMessageText(
                            event.target.value
                        )
                    }
                    rows="3"
                    placeholder={
                        "Describe your observation or ask " +
                        "a troubleshooting question..."
                    }
                />


                <button
                    className="create-repair-button"
                    type="submit"
                    disabled={isResponding}
                >
                    <Send size={18} />

                    <span>
                        Send
                    </span>
                </button>

            </form>

        </section>
    );
}


export default RepairAiTroubleshooting;