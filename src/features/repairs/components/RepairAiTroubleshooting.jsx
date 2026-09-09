import {
    useEffect,
    useRef,
    useState
} from "react";

import {
    Send,
    Bot,
    User,
    ClipboardPlus,
    ArrowRightCircle
} from "lucide-react";


function getInitialMessages() {

    return [
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
}


function getSuggestedStatusLabel(status) {

    if (!status) {
        return "";
    }


    return status
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(/\b\w/g, (letter) =>
            letter.toUpperCase()
        );
}


function getMockAiResponse(repair) {

    const device =
        repair.device;

    const problem =
        repair.reportedProblem;


    if (
        repair.status ===
            "AWAITING_PARTS"
    ) {

        return {
            text:
                `${device} is currently waiting for parts. ` +
                `Before resuming the repair, confirm that the required ` +
                `replacement component matches the reported problem: ` +
                `"${problem}". After installation, repeat functional ` +
                `testing before moving toward release.`,
            suggestedStatus:
                "IN_PROGRESS"
        };
    }


    if (
        repair.status ===
            "IN_PROGRESS"
    ) {

        return {
            text:
                `For ${device}, continue diagnosis around the reported ` +
                `problem: "${problem}". Verify the suspected component ` +
                `or subsystem with targeted testing. If a required ` +
                `replacement component is unavailable, document the ` +
                `finding and place the repair in Awaiting Parts.`,
            suggestedStatus:
                "AWAITING_PARTS"
        };
    }


    if (
        repair.status ===
            "RECEIVED"
    ) {

        return {
            text:
                `Begin with a structured inspection of ${device} based on ` +
                `the reported problem: "${problem}". Record objective ` +
                `findings first, then prepare an estimate or customer ` +
                `approval request when the likely repair is identified.`,
            suggestedStatus:
                "AWAITING_APPROVAL"
        };
    }


    if (
        repair.status ===
            "READY_FOR_RELEASE"
    ) {

        return {
            text:
                `${device} is marked Ready for Release. Perform a final ` +
                `functional check against the original reported problem: ` +
                `"${problem}" and confirm that the device is ready for ` +
                `customer handoff.`,
            suggestedStatus:
                null
        };
    }


    return {
        text:
            `Review ${device} against the reported problem: "${problem}". ` +
            `Use the repair history and saved findings as supporting ` +
            `context, and confirm any official action through the normal ` +
            `Cellbank repair workflow.`,
        suggestedStatus:
            null
    };
}


function RepairAiTroubleshooting({
    repair,
    onUseAsFinding,
    onSuggestStatus
}) {

    const responseTimeoutRef =
        useRef(null);


    // -----------------------------
    // CONVERSATION STATE
    // -----------------------------

    const [messages, setMessages] =
        useState(
            getInitialMessages
        );

    const [messageText, setMessageText] =
        useState("");

    const [isResponding, setIsResponding] =
        useState(false);


    // -----------------------------
    // REPAIR CHANGE SYNC
    // -----------------------------

    useEffect(() => {

        if (responseTimeoutRef.current) {

            clearTimeout(
                responseTimeoutRef.current
            );

            responseTimeoutRef.current =
                null;
        }


        setMessages(
            getInitialMessages()
        );

        setMessageText("");
        setIsResponding(false);


        return () => {

            if (responseTimeoutRef.current) {
                clearTimeout(
                    responseTimeoutRef.current
                );
            }
        };

    }, [repair.id]);


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


        if (
            !trimmedMessage ||
            isResponding
        ) {
            return;
        }


        const technicianMessage = {
            id:
                Date.now(),
            sender:
                "user",
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
        responseTimeoutRef.current =
            setTimeout(() => {

                const mockResponse =
                    getMockAiResponse(
                        repair
                    );


                const aiMessage = {
                    id:
                        Date.now() + 1,
                    sender:
                        "ai",
                    text:
                        mockResponse.text,
                    canUseAsFinding:
                        true,
                    suggestedStatus:
                        mockResponse.suggestedStatus
                };


                setMessages((currentMessages) => [
                    ...currentMessages,
                    aiMessage
                ]);


                setIsResponding(false);
                responseTimeoutRef.current =
                    null;

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

                <div>

                    <span>
                        Device
                    </span>

                    <strong>
                        {repair.device}
                    </strong>

                </div>


                <div>

                    <span>
                        Reported Problem
                    </span>

                    <strong>
                        {repair.reportedProblem}
                    </strong>

                </div>


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
                                ([problemCategory, count]) => (

                                    <p key={problemCategory}>
                                        {problemCategory} issue appeared{" "}
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

                        <div className="ai-message-icon">

                            {message.sender === "user"
                                ? <User size={18} />
                                : <Bot size={18} />
                            }

                        </div>


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


                            {(message.canUseAsFinding ||
                                message.suggestedStatus) && (

                                <div className="ai-message-actions">

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
                                                Suggest{" "}
                                                {getSuggestedStatusLabel(
                                                    message.suggestedStatus
                                                )}
                                            </span>
                                        </button>

                                    )}

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
                    disabled={isResponding}
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
