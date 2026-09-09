import {
    useEffect,
    useState
} from "react";

import { Plus }
    from "lucide-react";

import { getMockFindings }
    from "../data/mockRepairWorkspaceData.js";


function RepairFindings({
    repairId,
    currentUserName,
    aiDraft = "",
    onDraftUsed
}) {

    const [findings, setFindings] =
        useState(() =>
            getMockFindings(
                repairId
            )
        );

    const [findingText, setFindingText] =
        useState(aiDraft);

    const [diagnosis, setDiagnosis] =
        useState("");

    const [actionTaken, setActionTaken] =
        useState("");

    const [formOpen, setFormOpen] =
        useState(Boolean(aiDraft));


    function resetForm() {

        setFindingText("");
        setDiagnosis("");
        setActionTaken("");
    }


    // -----------------------------
    // REPAIR CHANGE SYNC
    // -----------------------------

    useEffect(() => {

        setFindings(
            getMockFindings(
                repairId
            )
        );

        resetForm();
        setFormOpen(false);

    }, [repairId]);


    // -----------------------------
    // AI DRAFT SYNC
    // -----------------------------

    useEffect(() => {

        if (!aiDraft) {
            return;
        }

        setFindingText(aiDraft);
        setFormOpen(true);

    }, [aiDraft]);


    function handleSubmit(event) {

        event.preventDefault();


        const trimmedFinding =
            findingText.trim();


        if (!trimmedFinding) {
            return;
        }


        const newFinding = {
            id:
                Date.now(),

            finding:
                trimmedFinding,

            diagnosis:
                diagnosis.trim() || null,

            actionTaken:
                actionTaken.trim() || null,

            recordedBy:
                currentUserName ||
                "Unknown User"
        };


        setFindings((currentFindings) => [
            ...currentFindings,
            newFinding
        ]);


        resetForm();
        setFormOpen(false);


        if (onDraftUsed) {
            onDraftUsed();
        }
    }


    function handleCancel() {

        resetForm();
        setFormOpen(false);


        if (onDraftUsed) {
            onDraftUsed();
        }
    }


    function handleAddFinding() {

        if (formOpen) {

            handleCancel();
            return;
        }


        resetForm();
        setFormOpen(true);
    }


    return (
        <section className="page-content repair-findings">

            {/* HEADER */}
            <div className="workspace-section-header">

                <div>

                    <h3>
                        Findings
                    </h3>

                    <p className="workspace-section-description">
                        Technician findings recorded during
                        diagnosis and repair.
                    </p>

                </div>


                <button
                    className="secondary-repair-button"
                    type="button"
                    onClick={handleAddFinding}
                >
                    <Plus size={18} />

                    <span>
                        Add Finding
                    </span>
                </button>

            </div>


            {/* FINDING FORM */}
            {formOpen && (

                <form
                    className="finding-form"
                    onSubmit={handleSubmit}
                >

                    <div className="repair-form-group">

                        <label htmlFor="finding">
                            Finding
                        </label>

                        <textarea
                            id="finding"
                            value={findingText}
                            onChange={(event) =>
                                setFindingText(
                                    event.target.value
                                )
                            }
                            rows="3"
                            placeholder={
                                "Record what was observed " +
                                "during inspection"
                            }
                            required
                        />

                    </div>


                    <div className="repair-form-group">

                        <label htmlFor="diagnosis">
                            Diagnosis
                        </label>

                        <textarea
                            id="diagnosis"
                            value={diagnosis}
                            onChange={(event) =>
                                setDiagnosis(
                                    event.target.value
                                )
                            }
                            rows="3"
                            placeholder="Optional diagnosis"
                        />

                    </div>


                    <div className="repair-form-group">

                        <label htmlFor="action-taken">
                            Action Taken
                        </label>

                        <textarea
                            id="action-taken"
                            value={actionTaken}
                            onChange={(event) =>
                                setActionTaken(
                                    event.target.value
                                )
                            }
                            rows="3"
                            placeholder={
                                "Optional inspection, test, " +
                                "or repair action performed"
                            }
                        />

                    </div>


                    <div className="finding-form-actions">

                        <button
                            className="cancel-repair-button"
                            type="button"
                            onClick={handleCancel}
                        >
                            Cancel
                        </button>


                        <button
                            className="create-repair-button"
                            type="submit"
                        >
                            Save Finding
                        </button>

                    </div>

                </form>

            )}


            {/* FINDINGS */}
            {findings.length > 0 ? (

                <div className="findings-list">

                    {findings.map((finding) => (

                        <article
                            key={finding.id}
                            className="finding-item"
                        >

                            <div className="finding-field">

                                <span>
                                    Finding
                                </span>

                                <p>
                                    {finding.finding}
                                </p>

                            </div>


                            {finding.diagnosis && (

                                <div className="finding-field">

                                    <span>
                                        Diagnosis
                                    </span>

                                    <p>
                                        {finding.diagnosis}
                                    </p>

                                </div>

                            )}


                            {finding.actionTaken && (

                                <div className="finding-field">

                                    <span>
                                        Action Taken
                                    </span>

                                    <p>
                                        {finding.actionTaken}
                                    </p>

                                </div>

                            )}


                            {finding.recordedBy && (

                                <div className="finding-meta">
                                    Recorded by {finding.recordedBy}
                                </div>

                            )}

                        </article>

                    ))}

                </div>

            ) : (

                <div className="workspace-empty-state">

                    <strong>
                        No findings recorded
                    </strong>

                    <p>
                        Add a finding after inspecting
                        or diagnosing the device.
                    </p>

                </div>

            )}

        </section>
    );
}


export default RepairFindings;
