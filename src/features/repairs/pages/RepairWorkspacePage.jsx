import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";

import {
  getRepair,
  getRepairFindings,
  createRepairFinding,
  getRepairParts,
  createRepairPart,
  updateRepairEstimate,
  updateRepairAgreedPrice,
  getRepairPayments,
  createRepairPayment,
  getRepairStatusHistory,
  getRepairTechnicians,
  updateRepairAssignment,
  updateRepairStatus,
  updateRepairProblemCategory,
} from "../../../api/repairApi.js";

import { getCustomer } from "../../../api/customerApi.js";
import { hasAccess } from "../../../config/accessControl.js";
import { useAuth } from "../../auth/context/AuthContext.jsx";

import StatusBadge from "../../../components/StatusBadge.jsx";
import RepairOverview from "../components/RepairOverview.jsx";
import RepairFindings from "../components/RepairFindings.jsx";
import RepairPartsCosts from "../components/RepairPartsCosts.jsx";
import RepairPayments from "../components/RepairPayments.jsx";
import RepairStatusHistory from "../components/RepairStatusHistory.jsx";

import "../../customers/customers.css";
import "../repairs.css";

const workspaceTabs = [
  { id: "overview", label: "Overview" },
  {
    id: "findings",
    label: "Findings",
    permission: "technicalFindings",
  },
  { id: "status-history", label: "Status History" },
  { id: "parts-costs", label: "Parts & Costs" },
  { id: "payments", label: "Payments" },
  {
    id: "ai",
    label: "AI Troubleshooting",
    permission: "aiTroubleshooting",
  },
];

const pendingMessages = {
  ai: "AI troubleshooting assistance is not available yet.",
};

function RepairWorkspacePage() {
  const { repairId } = useParams();
  const { user } = useAuth();

  const sessionKey = [
    repairId,
    user?.id ?? "signed-out",
    ...[...(user?.roles ?? [])].sort(),
  ].join(":");

  return <RepairWorkspace key={sessionKey} repairId={repairId} user={user} />;
}

function RepairWorkspace({ repairId, user }) {
  const canView = hasAccess(user?.roles, "repairs");
  const canAssign = hasAccess(user?.roles, "assignTechnician");
  const canFindings = hasAccess(user?.roles, "technicalFindings");

  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [reloadVersion, setReloadVersion] = useState(0);
  const [activeTab, setActiveTab] = useState("overview");

  const [technicianAssignmentOpen, setTechnicianAssignmentOpen] =
    useState(false);
  const [technicianSelection, setTechnicianSelection] = useState("");
  const [assignmentSaving, setAssignmentSaving] = useState(false);
  const [assignmentError, setAssignmentError] = useState("");
  const [assignmentBlocked, setAssignmentBlocked] = useState(false);
  const [assignmentMessage, setAssignmentMessage] = useState("");

  const assignmentSubmitting = useRef(false);

  const [statusSaving, setStatusSaving] = useState(false);
  const [statusError, setStatusError] = useState("");
  const [statusBlocked, setStatusBlocked] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const statusSubmittingRef = useRef(false);

  const [findingSaving, setFindingSaving] = useState(false);
  const [findingError, setFindingError] = useState("");
  const [findingBlocked, setFindingBlocked] = useState(false);
  const [findingMessage, setFindingMessage] = useState("");

  const findingSubmittingRef = useRef(false);

  const [costsSaving, setCostsSaving] = useState(false);
  const [costsError, setCostsError] = useState("");
  const [costsBlocked, setCostsBlocked] = useState(false);
  const [costsMessage, setCostsMessage] = useState("");

  const costsSubmittingRef = useRef(false);

  const [paymentSaving, setPaymentSaving] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [paymentBlocked, setPaymentBlocked] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState("");

  const paymentSubmittingRef = useRef(false);

  const [categorySaving, setCategorySaving] = useState(false);
  const [categoryError, setCategoryError] = useState("");
  const [categoryBlocked, setCategoryBlocked] = useState(false);
  const [categoryMessage, setCategoryMessage] = useState("");

  const categorySubmittingRef = useRef(false);

  useEffect(() => {
    if (!canView) return;

    if (!/^[1-9]\d*$/.test(repairId ?? "")) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    let active = true;

    async function loadWorkspace() {
      setLoading(true);
      setLoadError("");
      setNotFound(false);

      let repairLoaded = false;

      try {
        const repair = await getRepair(repairId, {
          signal: controller.signal,
        });

        repairLoaded = true;

        if (
          !repair?.id ||
          !repair.customerId ||
          !repair.status ||
          !repair.updatedAt
        ) {
          throw new Error("The server returned invalid repair data.");
        }

        const [customer, history, technicians, findings, parts, payments] =
          await Promise.all([
            getCustomer(repair.customerId, {
              signal: controller.signal,
            }),
            getRepairStatusHistory(repairId, {
              signal: controller.signal,
            }),
            getRepairTechnicians({
              signal: controller.signal,
            }),
            canFindings
              ? getRepairFindings(repairId, {
                  signal: controller.signal,
                })
              : Promise.resolve([]),
            getRepairParts(repairId, {
              signal: controller.signal,
            }),
            getRepairPayments(repairId, {
              signal: controller.signal,
            }),
          ]);

        if (
          !Array.isArray(customer?.devices) ||
          !Array.isArray(history) ||
          !Array.isArray(technicians) ||
          !Array.isArray(findings) ||
          !Array.isArray(parts) ||
          !Array.isArray(payments)
        ) {
          throw new Error("The server returned invalid workspace data.");
        }

        const device = customer.devices.find(
          (item) => item.id === repair.deviceId,
        );

        if (!device) {
          throw new Error(
            "The repair's device could not be found under its customer.",
          );
        }

        if (active) {
          setRecord({
            repair,
            customer,
            device,
            history,
            technicians,
            findings,
            parts,
            payments,
          });
        }
      } catch (error) {
        if (active && error.code !== "CANCELLED") {
          if (!repairLoaded && error.status === 404) {
            setRecord(null);
            setNotFound(true);
          } else {
            setLoadError(
              error.status === 403
                ? "You do not have permission to view these records."
                : error.message || "Unable to load the repair workspace.",
            );
          }
        }

        controller.abort();
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadWorkspace();

    return () => {
      active = false;
      controller.abort();
    };
  }, [repairId, canView, canFindings, reloadVersion]);

  const visibleTabs = workspaceTabs.filter(
    (tab) => !tab.permission || hasAccess(user?.roles, tab.permission),
  );

  const anySaving =
    assignmentSaving ||
    statusSaving ||
    findingSaving ||
    costsSaving ||
    paymentSaving ||
    categorySaving;

  const anyBlocked =
    assignmentBlocked ||
    statusBlocked ||
    findingBlocked ||
    costsBlocked ||
    paymentBlocked ||
    categoryBlocked;

  const controlsDisabled =
    loading || Boolean(loadError) || anySaving || anyBlocked;

  function isSubmitting() {
    return (
      assignmentSubmitting.current ||
      statusSubmittingRef.current ||
      findingSubmittingRef.current ||
      costsSubmittingRef.current ||
      paymentSubmittingRef.current ||
      categorySubmittingRef.current
    );
  }

  function cannotChangeRepair() {
    return (
      isSubmitting() ||
      anyBlocked ||
      loading ||
      Boolean(loadError) ||
      !record ||
      !canView ||
      ["COMPLETED", "CANCELLED"].includes(record.repair.status)
    );
  }

  function staffName(staffId) {
    if (staffId == null) return "Unassigned";

    const repair = record?.repair;

    if (staffId === repair?.createdById && repair.createdByName) {
      return repair.createdByName;
    }

    if (
      staffId === repair?.assignedTechnicianId &&
      repair.assignedTechnicianName
    ) {
      return repair.assignedTechnicianName;
    }

    const historyEntry = record?.history.find(
      (entry) => entry.changedById === staffId && entry.changedByName,
    );

    if (historyEntry) return historyEntry.changedByName;

    return (
      record?.technicians.find((staff) => staff.id === staffId)?.name ??
      `Staff #${staffId}`
    );
  }

  function handleTechnicianAssignmentToggle() {
    if (!canAssign || cannotChangeRepair()) return;

    setTechnicianSelection(
      record.repair.assignedTechnicianId == null
        ? ""
        : String(record.repair.assignedTechnicianId),
    );

    setAssignmentError("");
    setAssignmentMessage("");
    setTechnicianAssignmentOpen((open) => !open);
  }

  async function handleTechnicianAssignmentSave(event) {
    event.preventDefault();

    if (!canAssign || cannotChangeRepair()) return;

    const selectedTechnician = record.technicians.find(
      (technician) => String(technician.id) === technicianSelection,
    );

    if (technicianSelection && !selectedTechnician) {
      setAssignmentError("Select an available technician.");
      return;
    }

    const assignedTechnicianId = selectedTechnician?.id ?? null;

    if (assignedTechnicianId === record.repair.assignedTechnicianId) {
      return;
    }

    assignmentSubmitting.current = true;
    setAssignmentSaving(true);
    setAssignmentError("");
    setAssignmentMessage("");

    try {
      const saved = await updateRepairAssignment(record.repair.id, {
        assignedTechnicianId,
        expectedUpdatedAt: record.repair.updatedAt,
      });

      if (
        !saved ||
        saved.id !== record.repair.id ||
        !saved.updatedAt ||
        saved.assignedTechnicianId !== assignedTechnicianId
      ) {
        setAssignmentBlocked(true);
        setAssignmentError(
          "The save could not be confirmed. Reload the page and check the assignment before trying again.",
        );
        return;
      }

      setRecord((current) =>
        current ? { ...current, repair: saved } : current,
      );

      setTechnicianAssignmentOpen(false);
      setAssignmentMessage("Technician assignment saved.");
    } catch (error) {
      if (error.outcomeUncertain || !error.status || error.status >= 500) {
        setAssignmentBlocked(true);
        setAssignmentError(
          "The assignment may have saved. Reload the page and check it before trying again.",
        );
      } else if ([401, 403, 404, 409].includes(error.status)) {
        setAssignmentBlocked(true);
        setAssignmentError(
          error.status === 409
            ? "This repair changed since you opened it. Reload the page before changing its assignment."
            : error.message ||
                "The assignment cannot be changed. Reload the page before trying again.",
        );
      } else {
        setAssignmentError(
          error.errors?.assignedTechnicianId ||
            error.errors?.expectedUpdatedAt ||
            error.message ||
            "Unable to save the assignment.",
        );
      }
    } finally {
      assignmentSubmitting.current = false;
      setAssignmentSaving(false);
    }
  }

  async function handleStatusSubmit(data) {
    if (cannotChangeRepair()) return false;

    statusSubmittingRef.current = true;
    setStatusSaving(true);
    setStatusError("");
    setStatusMessage("");

    try {
      const saved = await updateRepairStatus(record.repair.id, {
        status: data.status,
        note: data.note,
        expectedUpdatedAt: record.repair.updatedAt,
      });

      if (
        saved?.id !== record.repair.id ||
        !saved.updatedAt ||
        saved.status !== data.status
      ) {
        setStatusBlocked(true);
        setStatusError(
          "The status update could not be confirmed. Reload the page before making another change.",
        );
        return false;
      }

      setRecord((current) =>
        current ? { ...current, repair: saved } : current,
      );

      setTechnicianAssignmentOpen(false);
      setAssignmentError("");
      setAssignmentMessage("");
      setStatusMessage("Repair status updated successfully.");

      try {
        const history = await getRepairStatusHistory(repairId);

        if (!Array.isArray(history)) {
          throw new Error("The server returned invalid status history.");
        }

        setRecord((current) => (current ? { ...current, history } : current));
      } catch {
        setLoadError(
          "The repair status was saved, but its history could not be loaded. Use Try Again to load the latest records.",
        );
      }

      return true;
    } catch (error) {
      if (error.outcomeUncertain || !error.status || error.status >= 500) {
        setStatusBlocked(true);
        setStatusError(
          "The status change may have been saved. Reload the page to confirm before making another change.",
        );
      } else if ([401, 403, 404, 409].includes(error.status)) {
        setStatusBlocked(true);
        setStatusError(
          error.status === 409
            ? "This repair changed or the transition is no longer allowed. Reload the page before trying again."
            : error.message ||
                "The status cannot be changed. Reload the page before trying again.",
        );
      } else {
        setStatusError(
          error.errors?.status ||
            error.errors?.note ||
            error.errors?.expectedUpdatedAt ||
            error.message ||
            "Unable to update the repair status.",
        );
      }

      return false;
    } finally {
      statusSubmittingRef.current = false;
      setStatusSaving(false);
    }
  }

  async function handleFindingSubmit(data) {
    if (!canFindings || cannotChangeRepair()) return false;

    findingSubmittingRef.current = true;
    setFindingSaving(true);
    setFindingError("");
    setFindingMessage("");

    try {
      const saved = await createRepairFinding(record.repair.id, {
        finding: data.finding,
        diagnosis: data.diagnosis,
        actionTaken: data.actionTaken,
        expectedUpdatedAt: record.repair.updatedAt,
      });

      if (
        !saved?.id ||
        saved.repairJobId !== record.repair.id ||
        typeof saved.finding !== "string" ||
        !saved.finding.trim() ||
        !saved.recordedAt ||
        !saved.recordedById
      ) {
        setFindingBlocked(true);
        setFindingError(
          "The save could not be confirmed. Reload the page and check the findings before trying again.",
        );
        return false;
      }

      setRecord((current) =>
        current
          ? {
              ...current,
              findings: [
                saved,
                ...current.findings.filter((entry) => entry.id !== saved.id),
              ],
            }
          : current,
      );

      setTechnicianAssignmentOpen(false);
      setAssignmentMessage("");
      setFindingMessage("Finding recorded successfully.");

      try {
        const findings = await getRepairFindings(repairId);

        if (!Array.isArray(findings)) {
          throw new Error("The server returned invalid findings.");
        }

        setRecord((current) => (current ? { ...current, findings } : current));
      } catch {
        setLoadError(
          "The finding was saved, but the findings list could not be refreshed. Use Try Again to load the latest records.",
        );
      }

      return true;
    } catch (error) {
      if (error.outcomeUncertain || !error.status || error.status >= 500) {
        setFindingBlocked(true);
        setFindingError(
          "The finding may have been saved. Reload the page and check the findings before trying again.",
        );
      } else if ([401, 403, 404, 409].includes(error.status)) {
        setFindingBlocked(true);
        setFindingError(
          error.status === 409
            ? "This repair changed or is already closed. Reload the page before recording a finding."
            : error.message ||
                "The finding cannot be recorded. Reload the page before trying again.",
        );
      } else {
        setFindingError(
          error.errors?.finding ||
            error.errors?.diagnosis ||
            error.errors?.actionTaken ||
            error.errors?.expectedUpdatedAt ||
            error.message ||
            "Unable to record the finding.",
        );
      }

      return false;
    } finally {
      findingSubmittingRef.current = false;
      setFindingSaving(false);
    }
  }

  async function handleCostsSubmit(action, data) {
    const actions = {
      part: {
        permission: "editPartsCosts",
        request: createRepairPart,
        message: "Part recorded successfully.",
      },
      estimate: {
        permission: "editEstimatedCost",
        request: updateRepairEstimate,
        field: "estimatedCost",
        message: "Repair estimate updated successfully.",
      },
      agreement: {
        permission: "editAgreedPrice",
        request: updateRepairAgreedPrice,
        field: "agreedPrice",
        message: "Agreed repair price saved successfully.",
      },
    };

    const selectedAction = actions[action];

    if (
      !selectedAction ||
      !hasAccess(user?.roles, selectedAction.permission) ||
      cannotChangeRepair()
    ) {
      return false;
    }

    costsSubmittingRef.current = true;
    setCostsSaving(true);
    setCostsError("");
    setCostsMessage("");

    try {
      const saved = await selectedAction.request(record.repair.id, {
        ...data,
        expectedUpdatedAt: record.repair.updatedAt,
      });

      if (action === "part") {
        if (
          !saved?.id ||
          saved.repairJobId !== record.repair.id ||
          saved.name !== data.partName ||
          saved.quantity !== data.quantity ||
          saved.unitCost == null ||
          Number(saved.unitCost) !== Number(data.unitCost) ||
          !saved.recordedAt ||
          !saved.recordedById
        ) {
          setCostsBlocked(true);
          setCostsError(
            "The part save could not be confirmed. Reload the page and check the parts list before trying again.",
          );
          return false;
        }

        setRecord((current) =>
          current
            ? {
                ...current,
                parts: [
                  saved,
                  ...current.parts.filter((entry) => entry.id !== saved.id),
                ],
              }
            : current,
        );
      } else {
        const field = selectedAction.field;

        if (
          saved?.id !== record.repair.id ||
          !saved.updatedAt ||
          saved[field] == null ||
          Number(saved[field]) !== Number(data[field])
        ) {
          setCostsBlocked(true);
          setCostsError(
            "The price update could not be confirmed. Reload the page and check the repair pricing before trying again.",
          );
          return false;
        }

        setRecord((current) =>
          current ? { ...current, repair: saved } : current,
        );
      }

      setTechnicianAssignmentOpen(false);
      setAssignmentMessage("");
      setCostsMessage(selectedAction.message);

      if (action === "part") {
        try {
          const parts = await getRepairParts(repairId);

          if (!Array.isArray(parts)) {
            throw new Error("The server returned invalid parts.");
          }

          setRecord((current) => (current ? { ...current, parts } : current));
        } catch {
          setLoadError(
            "The part was saved, but the parts list could not be refreshed. Use Try Again to load the latest records.",
          );
        }
      }

      return true;
    } catch (error) {
      if (error.outcomeUncertain || !error.status || error.status >= 500) {
        setCostsBlocked(true);
        setCostsError(
          "The change may have been saved. Reload the page and check Parts & Costs before trying again.",
        );
      } else if ([401, 403, 404, 409].includes(error.status)) {
        setCostsBlocked(true);
        setCostsError(
          error.status === 409
            ? "This repair changed or is already closed. Reload the page before updating Parts & Costs."
            : error.message ||
                "This change is not permitted. Reload the page before trying again.",
        );
      } else {
        setCostsError(
          error.errors?.partName ||
            error.errors?.quantity ||
            error.errors?.unitCost ||
            error.errors?.estimatedCost ||
            error.errors?.agreedPrice ||
            error.errors?.expectedUpdatedAt ||
            error.message ||
            "Unable to save the change.",
        );
      }

      return false;
    } finally {
      costsSubmittingRef.current = false;
      setCostsSaving(false);
    }
  }

  function handlePartSubmit(data) {
    return handleCostsSubmit("part", data);
  }

  function handleEstimateSubmit(data) {
    return handleCostsSubmit("estimate", data);
  }

  function handleAgreedPriceSubmit(data) {
    return handleCostsSubmit("agreement", data);
  }

  async function handlePaymentSubmit(data) {
    if (!hasAccess(user?.roles, "recordPayments") || cannotChangeRepair()) {
      return false;
    }

    paymentSubmittingRef.current = true;
    setPaymentSaving(true);
    setPaymentError("");
    setPaymentMessage("");

    try {
      const saved = await createRepairPayment(record.repair.id, {
        amount: data.amount,
        note: data.note,
        expectedUpdatedAt: record.repair.updatedAt,
      });

      if (
        !saved?.id ||
        saved.repairJobId !== record.repair.id ||
        saved.amount == null ||
        !Number.isFinite(Number(saved.amount)) ||
        Number(saved.amount) !== Number(data.amount) ||
        !saved.paidAt ||
        !saved.recordedById
      ) {
        setPaymentBlocked(true);
        setPaymentError(
          "The payment save could not be confirmed. Reload the page and check payment history before trying again.",
        );
        return false;
      }

      setRecord((current) =>
        current
          ? {
              ...current,
              payments: [
                saved,
                ...current.payments.filter(
                  (payment) => payment.id !== saved.id,
                ),
              ],
            }
          : current,
      );

      setTechnicianAssignmentOpen(false);
      setAssignmentMessage("");
      setPaymentMessage("Payment recorded successfully.");

      try {
        const [latestRepair, payments] = await Promise.all([
          getRepair(repairId),
          getRepairPayments(repairId),
        ]);

        if (
          latestRepair?.id !== record.repair.id ||
          !latestRepair.updatedAt ||
          !latestRepair.status ||
          !Array.isArray(payments) ||
          !payments.some((payment) => payment.id === saved.id)
        ) {
          throw new Error(
            "The server returned incomplete payment or repair data.",
          );
        }

        setRecord((current) =>
          current
            ? {
                ...current,
                repair: latestRepair,
                payments,
              }
            : current,
        );
      } catch {
        setLoadError(
          "The payment was saved, but the latest repair and payment records could not be loaded. Use Try Again before making another change.",
        );
      }

      return true;
    } catch (error) {
      if (error.outcomeUncertain || !error.status || error.status >= 500) {
        setPaymentBlocked(true);
        setPaymentError(
          "The payment may have been saved. Reload the page and check payment history before trying again.",
        );
      } else if ([401, 403, 404, 409].includes(error.status)) {
        setPaymentBlocked(true);

        if (error.status === 401) {
          setPaymentError(
            "Your session has expired. Sign in again and reload this repair before recording a payment.",
          );
        } else if (error.status === 403) {
          setPaymentError(
            "The payment request was denied. Reload the page and check that your account has permission to record payments.",
          );
        } else if (error.status === 404) {
          setPaymentError(
            "The repair could not be found. Reload the page before continuing.",
          );
        } else {
          setPaymentError(
            "The repair or its payment eligibility changed. Reload the page and check its status, agreed price, and payment history before trying again.",
          );
        }
      } else {
        setPaymentError(
          error.errors?.amount ||
            error.errors?.note ||
            error.errors?.expectedUpdatedAt ||
            error.message ||
            "Unable to record the payment.",
        );
      }

      return false;
    } finally {
      paymentSubmittingRef.current = false;
      setPaymentSaving(false);
    }
  }

  async function handleProblemCategorySubmit(data) {
    if (!canFindings || cannotChangeRepair()) {
      return false;
    }

    categorySubmittingRef.current = true;
    setCategorySaving(true);
    setCategoryError("");
    setCategoryMessage("");

    try {
      const saved = await updateRepairProblemCategory(record.repair.id, {
        problemCategory: data.problemCategory,
        expectedUpdatedAt: record.repair.updatedAt,
      });

      if (
        saved?.id !== record.repair.id ||
        !saved.updatedAt ||
        saved.problemCategory !== data.problemCategory
      ) {
        setCategoryBlocked(true);
        setCategoryError(
          "The category update could not be confirmed. Reload the page and check the category before trying again.",
        );
        return false;
      }

      setRecord((current) =>
        current ? { ...current, repair: saved } : current,
      );

      setTechnicianAssignmentOpen(false);
      setAssignmentMessage("");
      setCategoryMessage("Problem category updated successfully.");

      return true;
    } catch (error) {
      if (error.outcomeUncertain || !error.status || error.status >= 500) {
        setCategoryBlocked(true);
        setCategoryError(
          "The category may have been saved. Reload the page and check it before trying again.",
        );
      } else if ([401, 403, 404, 409].includes(error.status)) {
        setCategoryBlocked(true);

        if (error.status === 401) {
          setCategoryError(
            "Your session has expired. Sign in again and reload this repair before updating its category.",
          );
        } else if (error.status === 403) {
          setCategoryError(
            "The category update was denied. Reload the page and check that your account has permission to update categories.",
          );
        } else if (error.status === 404) {
          setCategoryError(
            "The repair could not be found. Reload the page before continuing.",
          );
        } else {
          setCategoryError(
            "This repair changed or is already closed. Reload the page before updating its problem category.",
          );
        }
      } else {
        setCategoryError(
          error.errors?.problemCategory ||
            error.errors?.expectedUpdatedAt ||
            error.message ||
            "Unable to update the problem category.",
        );
      }

      return false;
    } finally {
      categorySubmittingRef.current = false;
      setCategorySaving(false);
    }
  }

  if (!canView) {
    return (
      <section className="page-content">
        <h2>Access denied</h2>
        <p>You do not have permission to view repairs.</p>
      </section>
    );
  }

  const repair = record?.repair;
  const customer = record?.customer;
  const device = record?.device;

  const canManageTechnician =
    canAssign && repair && !["COMPLETED", "CANCELLED"].includes(repair.status);

  const assignmentUnchanged =
    technicianSelection ===
    (repair?.assignedTechnicianId == null
      ? ""
      : String(repair.assignedTechnicianId));

  return (
    <>
      <section className="page-header">
        <h2>{repair?.repairReference ?? "Repair Workspace"}</h2>

        <p>
          {device
            ? `Repair workspace for ${device.brand} ${device.model}.`
            : "View repair information and status history."}
        </p>
      </section>

      {(loadError || notFound || (!record && loading)) && (
        <section className="page-content">
          {loadError && (
            <div className="customer-form-error" role="alert">
              <p>{loadError}</p>

              {record && (
                <p>
                  Previously loaded information is shown and may be out of date.
                </p>
              )}

              <button
                className="secondary-repair-button"
                type="button"
                onClick={() => {
                  if (loading || isSubmitting()) return;
                  setReloadVersion((value) => value + 1);
                }}
                disabled={loading || anySaving}
              >
                Try Again
              </button>
            </div>
          )}

          {!record && loading && (
            <div role="status" aria-label="Loading repair workspace">
              <div className="customer-info-grid" aria-hidden="true">
                {Array.from({ length: 6 }, (_, index) => (
                  <div key={index}>
                    <span className="customer-skeleton-line" />
                    <span className="customer-skeleton-line" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {notFound && !loading && (
            <div className="workspace-empty-state">
              <strong>Repair not found</strong>
              <p>The requested repair record does not exist.</p>
            </div>
          )}
        </section>
      )}

      {record && (
        <>
          <section className="repair-workspace-header">
            <div>
              <span className="workspace-label">Customer</span>
              <strong>{customer.name}</strong>
            </div>

            <div>
              <span className="workspace-label">Device</span>
              <strong>
                {device.brand} {device.model}
              </strong>
            </div>

            <div>
              <span className="workspace-label">Technician</span>
              <strong>{staffName(repair.assignedTechnicianId)}</strong>

              {canManageTechnician && (
                <button
                  className="workspace-inline-action"
                  type="button"
                  onClick={handleTechnicianAssignmentToggle}
                  disabled={controlsDisabled}
                  aria-expanded={technicianAssignmentOpen}
                >
                  {repair.assignedTechnicianId != null
                    ? "Change Technician"
                    : "Assign Technician"}
                </button>
              )}
            </div>

            <div>
              <span className="workspace-label">Status</span>
              <StatusBadge status={repair.status} />
            </div>
          </section>

          {assignmentMessage && (
            <div className="repair-success-message" role="status">
              {assignmentMessage}
            </div>
          )}

          {assignmentBlocked && !technicianAssignmentOpen && (
            <p className="customer-form-error" role="alert">
              {assignmentError}
            </p>
          )}

          {technicianAssignmentOpen && canManageTechnician && (
            <section className="page-content technician-assignment-panel">
              <div className="workspace-section-header">
                <div>
                  <h3>
                    {repair.assignedTechnicianId != null
                      ? "Reassign Technician"
                      : "Assign Technician"}
                  </h3>

                  <p className="workspace-section-description">
                    Assign this repair to an active technician.
                  </p>
                </div>
              </div>

              {assignmentError && (
                <div
                  className="customer-form-error"
                  role="alert"
                  style={{ marginBottom: "16px" }}
                >
                  {assignmentError}
                </div>
              )}

              <form
                className="technician-assignment-form"
                onSubmit={handleTechnicianAssignmentSave}
                aria-busy={assignmentSaving}
              >
                <div className="repair-form-group">
                  <label htmlFor="workspace-technician">
                    Assigned Technician
                  </label>

                  <select
                    id="workspace-technician"
                    value={technicianSelection}
                    onChange={(event) => {
                      setTechnicianSelection(event.target.value);
                      setAssignmentError("");
                    }}
                    disabled={controlsDisabled}
                  >
                    <option value="">Unassigned</option>

                    {repair.assignedTechnicianId != null &&
                      !record.technicians.some(
                        (technician) =>
                          technician.id === repair.assignedTechnicianId,
                      ) && (
                        <option value={repair.assignedTechnicianId} disabled>
                          {staffName(repair.assignedTechnicianId)}
                          {" — unavailable"}
                        </option>
                      )}

                    {record.technicians.map((technician) => (
                      <option key={technician.id} value={technician.id}>
                        {technician.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="finding-form-actions">
                  <button
                    className="cancel-repair-button"
                    type="button"
                    disabled={anySaving}
                    onClick={() => {
                      if (!isSubmitting()) {
                        setTechnicianAssignmentOpen(false);
                      }
                    }}
                  >
                    {anyBlocked ? "Close" : "Cancel"}
                  </button>

                  <button
                    className="create-repair-button"
                    type="submit"
                    disabled={controlsDisabled || assignmentUnchanged}
                  >
                    {assignmentSaving ? "Saving..." : "Save Assignment"}
                  </button>
                </div>
              </form>
            </section>
          )}

          <nav
            className="repair-workspace-tabs"
            aria-label="Repair workspace sections"
          >
            {visibleTabs.map((tab) => (
              <button
                key={tab.id}
                className={`workspace-tab ${
                  activeTab === tab.id ? "active" : ""
                }`}
                type="button"
                aria-pressed={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <div hidden={activeTab !== "overview"}>
            <RepairOverview
              repair={repair}
              estimatedCost={repair.estimatedCost}
              agreedPrice={repair.agreedPrice}
              staffName={staffName}
              currentRoles={user?.roles ?? []}
              onUpdateProblemCategory={handleProblemCategorySubmit}
              categorySaving={categorySaving}
              disabled={controlsDisabled}
              categoryBlocked={categoryBlocked}
              categoryError={categoryError}
              categoryMessage={categoryMessage}
            />
          </div>

          {canFindings && (
            <div hidden={activeTab !== "findings"}>
              <RepairFindings
                repairId={repairId}
                findings={record.findings}
                currentStatus={repair.status}
                canAdd={canFindings}
                onSubmitFinding={handleFindingSubmit}
                saving={findingSaving}
                disabled={controlsDisabled}
                blocked={findingBlocked}
                error={findingError}
                message={findingMessage}
              />
            </div>
          )}

          <div hidden={activeTab !== "status-history"}>
            <RepairStatusHistory
              repairId={repairId}
              history={record.history}
              staffName={staffName}
              currentRoles={user?.roles ?? []}
              currentStatus={repair.status}
              onSubmitStatus={handleStatusSubmit}
              saving={statusSaving}
              disabled={controlsDisabled}
              blocked={statusBlocked}
              error={statusError}
              message={statusMessage}
            />
          </div>

          <div hidden={activeTab !== "parts-costs"}>
            <RepairPartsCosts
              repairId={repairId}
              currentRoles={user?.roles ?? []}
              currentStatus={repair.status}
              parts={record.parts}
              estimatedCost={repair.estimatedCost}
              agreedPrice={repair.agreedPrice}
              onCreatePart={handlePartSubmit}
              onUpdateEstimate={handleEstimateSubmit}
              onUpdateAgreedPrice={handleAgreedPriceSubmit}
              saving={costsSaving}
              disabled={controlsDisabled}
              blocked={costsBlocked}
              error={costsError}
              message={costsMessage}
            />
          </div>

          <div hidden={activeTab !== "payments"}>
            <RepairPayments
              repairId={repairId}
              currentRoles={user?.roles ?? []}
              currentStatus={repair.status}
              repairTotal={repair.agreedPrice}
              payments={record.payments}
              onCreatePayment={handlePaymentSubmit}
              saving={paymentSaving}
              disabled={controlsDisabled}
              blocked={paymentBlocked}
              error={paymentError}
              message={paymentMessage}
            />
          </div>

          {pendingMessages[activeTab] && (
            <section className="page-content">
              <h3>{visibleTabs.find((tab) => tab.id === activeTab)?.label}</h3>

              <div className="workspace-empty-state">
                <strong>Not available yet</strong>
                <p>{pendingMessages[activeTab]}</p>
              </div>
            </section>
          )}
        </>
      )}
    </>
  );
}

export default RepairWorkspacePage;
