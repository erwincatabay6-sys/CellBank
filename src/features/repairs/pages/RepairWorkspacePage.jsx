import {
    useEffect,
    useState
} from "react";

import {
    useNavigate,
    useParams
} from "react-router-dom";


import { hasAccess }
    from "../../../config/accessControl.js";

import StatusBadge
    from "../../../components/StatusBadge.jsx";

import RepairOverview
    from "../components/RepairOverview.jsx";

import RepairFindings
    from "../components/RepairFindings.jsx";

import RepairStatusHistory
    from "../components/RepairStatusHistory.jsx";

import RepairPartsCosts
    from "../components/RepairPartsCosts.jsx";

import RepairPayments
    from "../components/RepairPayments.jsx";

import RepairAiTroubleshooting
    from "../components/RepairAiTroubleshooting.jsx";

import { mockRepairs }
    from "../data/mockRepairs.js";


// =====================================================
// WORKSPACE TABS
// =====================================================

const workspaceTabs = [
    {
        id: "overview",
        label: "Overview"
    },

    {
        id: "findings",
        label: "Findings",
        permission: "technicalFindings"
    },

    {
        id: "status-history",
        label: "Status History"
    },

    {
        id: "parts-costs",
        label: "Parts & Costs"
    },

    {
        id: "payments",
        label: "Payments"
    },

    {
        id: "ai",
        label: "AI Troubleshooting",
        permission: "aiTroubleshooting"
    }
];


function RepairWorkspacePage({
    currentRole = "ADMIN"
}) {

    const { repairId } =
        useParams();

    const navigate =
        useNavigate();


    // -----------------------------
    // CURRENT REPAIR
    // -----------------------------

    const repair =
        mockRepairs.find(
            (repair) =>
                repair.id === Number(repairId)
        );


    // -----------------------------
    // WORKSPACE STATE
    // -----------------------------

    const [activeTab, setActiveTab] =
        useState("overview");


    const [
        currentStatus,
        setCurrentStatus
    ] = useState(
        repair?.status ?? ""
    );


    const [
        estimatedCost,
        setEstimatedCost
    ] = useState(
        repair?.estimatedCost ?? null
    );


    const [
        agreedPrice,
        setAgreedPrice
    ] = useState(
        repair?.agreedPrice ?? null
    );


    // -----------------------------
    // AI ASSISTANCE STATE
    // -----------------------------

    const [
        aiFindingDraft,
        setAiFindingDraft
    ] = useState("");


    const [
        aiStatusSuggestion,
        setAiStatusSuggestion
    ] = useState("");


    // -----------------------------
    // ROLE PERMISSIONS
    // -----------------------------

    const canUseFindings =
        hasAccess(
            currentRole,
            "technicalFindings"
        );


    const canUseAi =
        hasAccess(
            currentRole,
            "aiTroubleshooting"
        );


    const visibleWorkspaceTabs =
        workspaceTabs.filter(
            (tab) =>
                !tab.permission ||
                hasAccess(
                    currentRole,
                    tab.permission
                )
        );


    // -----------------------------
    // REPAIR CHANGE SYNC
    // -----------------------------

    useEffect(() => {

        if (!repair) {
            return;
        }


        setCurrentStatus(
            repair.status
        );


        setEstimatedCost(
            repair.estimatedCost ?? null
        );


        setAgreedPrice(
            repair.agreedPrice ?? null
        );


        setAiFindingDraft("");

        setAiStatusSuggestion("");

        setActiveTab("overview");

    }, [repair]);


    // -----------------------------
    // ROLE CHANGE SYNC
    // -----------------------------

    useEffect(() => {

        if (
            activeTab === "findings" &&
            !canUseFindings
        ) {

            setActiveTab("overview");

            return;
        }


        if (
            activeTab === "ai" &&
            !canUseAi
        ) {

            setActiveTab("overview");
        }

    }, [
        activeTab,
        canUseFindings,
        canUseAi
    ]);


    // -----------------------------
    // AI ACTION HANDLERS
    // -----------------------------

    function handleUseAsFinding(text) {

        if (!canUseFindings) {
            return;
        }


        setAiFindingDraft(text);

        setActiveTab("findings");
    }


    function handleStatusSuggestion(status) {

        setAiStatusSuggestion(status);

        setActiveTab("status-history");
    }


    // -----------------------------
    // TAB NAVIGATION
    // -----------------------------

    function handleTabChange(tabId) {

        setActiveTab(tabId);
    }


    // -----------------------------
    // REPAIR NOT FOUND
    // -----------------------------

    if (!repair) {

        return (
            <>

                <section className="page-header">

                    <h2>
                        Repair Not Found
                    </h2>

                    <p>
                        The requested repair record
                        does not exist.
                    </p>

                </section>


                <section className="page-content repair-overview">

                    <button
                        className="secondary-repair-button"
                        type="button"
                        onClick={() =>
                            navigate("/repairs")
                        }
                    >
                        Back to Repairs
                    </button>

                </section>

            </>
        );
    }


    return (
        <>

            {/* =========================
                PAGE HEADER
            ========================== */}
            <section className="page-header">

                <h2>
                    {repair.reference}
                </h2>

                <p>
                    Repair workspace for{" "}
                    {repair.device}.
                </p>

            </section>


            {/* =========================
                REPAIR SUMMARY
            ========================== */}
            <section className="repair-workspace-header">

                {/* CUSTOMER */}
                <div>

                    <span className="workspace-label">
                        Customer
                    </span>

                    <strong>
                        {repair.customer}
                    </strong>

                </div>


                {/* DEVICE */}
                <div>

                    <span className="workspace-label">
                        Device
                    </span>

                    <strong>
                        {repair.device}
                    </strong>

                </div>


                {/* TECHNICIAN */}
                <div>

                    <span className="workspace-label">
                        Technician
                    </span>

                    <strong>
                        {repair.technician}
                    </strong>

                </div>


                {/* CURRENT STATUS */}
                <div>

                    <span className="workspace-label">
                        Status
                    </span>

                    <StatusBadge
                        status={currentStatus}
                    />

                </div>

            </section>


            {/* =========================
                WORKSPACE TABS
            ========================== */}
            <nav className="repair-workspace-tabs">

                {visibleWorkspaceTabs.map((tab) => (

                    <button
                        key={tab.id}
                        className={
                            `workspace-tab ${
                                activeTab === tab.id
                                    ? "active"
                                    : ""
                            }`
                        }
                        type="button"
                        onClick={() =>
                            handleTabChange(
                                tab.id
                            )
                        }
                    >
                        {tab.label}
                    </button>

                ))}

            </nav>


            {/* =========================
                OVERVIEW
            ========================== */}
            <div
                hidden={
                    activeTab !== "overview"
                }
            >

                <RepairOverview
                    repair={repair}
                    estimatedCost={
                        estimatedCost
                    }
                    agreedPrice={
                        agreedPrice
                    }
                />

            </div>


            {/* =========================
                FINDINGS
                ADMIN + TECHNICIAN ONLY
            ========================== */}
            {canUseFindings && (

                <div
                    hidden={
                        activeTab !== "findings"
                    }
                >

                    <RepairFindings
                        aiDraft={
                            aiFindingDraft
                        }
                        onDraftUsed={() =>
                            setAiFindingDraft("")
                        }
                    />

                </div>

            )}


            {/* =========================
                STATUS HISTORY
            ========================== */}
            <div
                hidden={
                    activeTab !==
                        "status-history"
                }
            >

                <RepairStatusHistory
                    currentRole={
                        currentRole
                    }

                    currentStatus={
                        currentStatus
                    }
                    onStatusChange={
                        setCurrentStatus
                    }
                    suggestedStatus={
                        aiStatusSuggestion
                    }
                    onSuggestionHandled={() =>
                        setAiStatusSuggestion("")
                    }
                />

            </div>


            {/* =========================
                PARTS & COSTS
            ========================== */}
            <div
                hidden={
                    activeTab !==
                        "parts-costs"
                }
            >

                <RepairPartsCosts
                    currentRole={
                        currentRole
                    }
                    estimatedCost={
                        estimatedCost
                    }
                    onEstimatedCostChange={
                        setEstimatedCost
                    }
                    agreedPrice={
                        agreedPrice
                    }
                    onAgreedPriceChange={
                        setAgreedPrice
                    }
                />

            </div>


            {/* =========================
                PAYMENTS
            ========================== */}
            <div
                hidden={
                    activeTab !== "payments"
                }
            >

                <RepairPayments
                    currentRole={
                        currentRole
                    }
                    repairId={
                        repair.id
                    }
                    repairTotal={
                        agreedPrice
                    }
                />

            </div>


            {/* =========================
                AI TROUBLESHOOTING
                ADMIN + TECHNICIAN ONLY
            ========================== */}
            {canUseAi && (

                <div
                    hidden={
                        activeTab !== "ai"
                    }
                >

                    <RepairAiTroubleshooting
                        repair={
                            repair
                        }
                        onUseAsFinding={
                            handleUseAsFinding
                        }
                        onSuggestStatus={
                            handleStatusSuggestion
                        }
                    />

                </div>

            )}

        </>
    );
}


export default RepairWorkspacePage;