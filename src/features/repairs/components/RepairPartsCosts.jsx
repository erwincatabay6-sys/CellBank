import {
    useEffect,
    useState
} from "react";

import { Plus }
    from "lucide-react";

import { hasAccess }
    from "../../../config/accessControl.js";


// =====================================================
// TEMPORARY PARTS DATA
// =====================================================

const initialParts = [
    {
        id: 1,
        name: "Charging Port",
        quantity: 1,
        unitCost: 450
    },

    {
        id: 2,
        name: "USB-C Cable",
        quantity: 1,
        unitCost: 180
    }
];


function RepairPartsCosts({
    currentRoles,
    estimatedCost,
    onEstimatedCostChange,
    agreedPrice,
    onAgreedPriceChange
}) {

    // -----------------------------
    // ROLE PERMISSIONS
    // -----------------------------

    const canEditEstimatedCost =
        hasAccess(
            currentRoles,
            "editEstimatedCost"
        );


    const canEditPartsCosts =
        hasAccess(
            currentRoles,
            "editPartsCosts"
        );


    const canEditAgreedPrice =
        hasAccess(
            currentRoles,
            "editAgreedPrice"
        );


    // -----------------------------
    // PARTS STATE
    // -----------------------------

    const [parts, setParts] =
        useState(initialParts);


    const [
        partFormOpen,
        setPartFormOpen
    ] = useState(false);


    const [partName, setPartName] =
        useState("");


    const [quantity, setQuantity] =
        useState(1);


    const [unitCost, setUnitCost] =
        useState("");


    // -----------------------------
    // ESTIMATE STATE
    // -----------------------------

    const [
        estimateFormOpen,
        setEstimateFormOpen
    ] = useState(false);


    const [
        estimateInput,
        setEstimateInput
    ] = useState(
        estimatedCost != null
            ? String(estimatedCost)
            : ""
    );


    // -----------------------------
    // AGREEMENT STATE
    // -----------------------------

    const [
        priceFormOpen,
        setPriceFormOpen
    ] = useState(false);


    const [
        priceInput,
        setPriceInput
    ] = useState(
        agreedPrice != null
            ? String(agreedPrice)
            : ""
    );


    // -----------------------------
    // PERMISSION SYNC
    // -----------------------------

    useEffect(() => {

        if (!canEditEstimatedCost) {

            setEstimateFormOpen(false);

            setEstimateInput(
                estimatedCost != null
                    ? String(estimatedCost)
                    : ""
            );
        }


        if (!canEditPartsCosts) {

            setPartFormOpen(false);

            setPartName("");
            setQuantity(1);
            setUnitCost("");
        }


        if (!canEditAgreedPrice) {

            setPriceFormOpen(false);

            setPriceInput(
                agreedPrice != null
                    ? String(agreedPrice)
                    : ""
            );
        }

    }, [
        canEditEstimatedCost,
        canEditPartsCosts,
        canEditAgreedPrice,
        estimatedCost,
        agreedPrice
    ]);


    // -----------------------------
    // DERIVED VALUES
    // -----------------------------

    const partsTotal =
        parts.reduce(
            (total, part) =>
                total +
                (
                    part.quantity *
                    part.unitCost
                ),
            0
        );


    // -----------------------------
    // PART FORM HELPERS
    // -----------------------------

    function resetPartForm() {

        setPartName("");

        setQuantity(1);

        setUnitCost("");
    }


    function handlePartFormToggle() {

        if (!canEditPartsCosts) {
            return;
        }


        if (partFormOpen) {

            resetPartForm();
        }


        setPartFormOpen(
            !partFormOpen
        );
    }


    function handlePartCancel() {

        resetPartForm();

        setPartFormOpen(false);
    }


    // -----------------------------
    // PART SUBMISSION
    // -----------------------------

    function handlePartSubmit(event) {

        event.preventDefault();


        if (!canEditPartsCosts) {
            return;
        }


        const newPart = {
            id:
                Date.now(),

            name:
                partName.trim(),

            quantity:
                Number(quantity),

            unitCost:
                Number(unitCost)
        };


        setParts((currentParts) => [
            ...currentParts,
            newPart
        ]);


        resetPartForm();

        setPartFormOpen(false);
    }


    // -----------------------------
    // ESTIMATE HANDLERS
    // -----------------------------

    function handleEstimateFormToggle() {

        if (!canEditEstimatedCost) {
            return;
        }


        setEstimateInput(
            estimatedCost != null
                ? String(estimatedCost)
                : ""
        );


        setEstimateFormOpen(
            !estimateFormOpen
        );


        // Keep only one pricing form open.
        setPriceFormOpen(false);
    }


    function handleEstimateSubmit(event) {

        event.preventDefault();


        if (!canEditEstimatedCost) {
            return;
        }


        const newEstimatedCost =
            Number(estimateInput);


        if (onEstimatedCostChange) {

            onEstimatedCostChange(
                newEstimatedCost
            );
        }


        setEstimateFormOpen(false);
    }


    // -----------------------------
    // PRICE AGREEMENT HANDLERS
    // -----------------------------

    function handlePriceFormToggle() {

        if (!canEditAgreedPrice) {
            return;
        }


        setPriceInput(
            agreedPrice != null
                ? String(agreedPrice)
                : ""
        );


        setPriceFormOpen(
            !priceFormOpen
        );


        // Keep only one pricing form open.
        setEstimateFormOpen(false);
    }


    function handlePriceSubmit(event) {

        event.preventDefault();


        if (!canEditAgreedPrice) {
            return;
        }


        const newAgreedPrice =
            Number(priceInput);


        if (onAgreedPriceChange) {

            onAgreedPriceChange(
                newAgreedPrice
            );
        }


        setPriceFormOpen(false);
    }


    return (
        <section className="page-content repair-parts-costs">

            {/* =========================
                PAGE HEADER
            ========================== */}
            <div className="workspace-section-header">

                <div>

                    <h3>
                        Parts & Costs
                    </h3>

                    <p className="workspace-section-description">
                        Review repair pricing,
                        customer agreement,
                        and parts used for this repair.
                    </p>

                </div>

            </div>


            {/* =========================
                PRICE AGREEMENT
            ========================== */}
            <div className="price-agreement-section">

                <div className="price-agreement-header">

                    <div>

                        <h4>
                            Price Agreement
                        </h4>

                        <p>
                            Review the estimated cost
                            and customer-approved repair price.
                        </p>

                    </div>


                    {/* ADMIN + FRONT DESK */}
                    {canEditAgreedPrice && (

                        <button
                            className="secondary-repair-button"
                            type="button"
                            onClick={
                                handlePriceFormToggle
                            }
                        >
                            {agreedPrice != null
                                ? "Update Agreement"
                                : "Record Agreement"
                            }
                        </button>

                    )}

                </div>


                {/* =========================
                    PRICE SUMMARY
                ========================== */}
                <div className="price-summary">

                    {/* ESTIMATED COST */}
                    <div>

                        <span>
                            Estimated Cost
                        </span>

                        <strong>
                            {estimatedCost != null
                                ? `₱${estimatedCost.toFixed(2)}`
                                : "Not estimated"
                            }
                        </strong>


                        {/* ADMIN + TECHNICIAN */}
                        {canEditEstimatedCost && (

                            <button
                                className="inline-cost-button"
                                type="button"
                                onClick={
                                    handleEstimateFormToggle
                                }
                            >
                                {estimatedCost != null
                                    ? "Update Estimate"
                                    : "Set Estimate"
                                }
                            </button>

                        )}

                    </div>


                    {/* AGREED PRICE */}
                    <div>

                        <span>
                            Agreed Price
                        </span>

                        <strong>
                            {agreedPrice != null
                                ? `₱${agreedPrice.toFixed(2)}`
                                : "Awaiting customer approval"
                            }
                        </strong>

                    </div>


                    {/* AGREEMENT STATUS */}
                    <div>

                        <span>
                            Agreement Status
                        </span>

                        <strong>
                            {agreedPrice != null
                                ? "Approved"
                                : "Pending"
                            }
                        </strong>

                    </div>

                </div>


                {/* =========================
                    ESTIMATE FORM
                    ADMIN + TECHNICIAN
                ========================== */}
                {estimateFormOpen &&
                    canEditEstimatedCost && (

                    <form
                        className="price-agreement-form"
                        onSubmit={
                            handleEstimateSubmit
                        }
                    >

                        <div className="repair-form-group">

                            <label htmlFor="estimated-cost-workspace">
                                Estimated Repair Cost
                            </label>

                            <input
                                id="estimated-cost-workspace"
                                type="number"
                                min="0"
                                step="0.01"
                                value={estimateInput}
                                onChange={(event) =>
                                    setEstimateInput(
                                        event.target.value
                                    )
                                }
                                placeholder="0.00"
                                required
                            />

                        </div>


                        <div className="finding-form-actions">

                            <button
                                className="cancel-repair-button"
                                type="button"
                                onClick={() =>
                                    setEstimateFormOpen(
                                        false
                                    )
                                }
                            >
                                Cancel
                            </button>


                            <button
                                className="create-repair-button"
                                type="submit"
                            >
                                Save Estimate
                            </button>

                        </div>

                    </form>

                )}


                {/* =========================
                    AGREED PRICE FORM
                    ADMIN + FRONT DESK
                ========================== */}
                {priceFormOpen &&
                    canEditAgreedPrice && (

                    <form
                        className="price-agreement-form"
                        onSubmit={
                            handlePriceSubmit
                        }
                    >

                        <div className="repair-form-group">

                            <label htmlFor="agreed-price">
                                Agreed Repair Price
                            </label>

                            <input
                                id="agreed-price"
                                type="number"
                                min="0"
                                step="0.01"
                                value={priceInput}
                                onChange={(event) =>
                                    setPriceInput(
                                        event.target.value
                                    )
                                }
                                placeholder="0.00"
                                required
                            />

                        </div>


                        <div className="finding-form-actions">

                            <button
                                className="cancel-repair-button"
                                type="button"
                                onClick={() =>
                                    setPriceFormOpen(
                                        false
                                    )
                                }
                            >
                                Cancel
                            </button>


                            <button
                                className="create-repair-button"
                                type="submit"
                            >
                                Confirm Agreement
                            </button>

                        </div>

                    </form>

                )}

            </div>


            {/* =========================
                PARTS USED
            ========================== */}
            <div className="parts-section-header">

                <div>

                    <h4>
                        Parts Used
                    </h4>

                    <p>
                        Review parts actually used
                        during the repair.
                    </p>

                </div>


                {/* ADMIN + TECHNICIAN */}
                {canEditPartsCosts && (

                    <button
                        className="secondary-repair-button"
                        type="button"
                        onClick={
                            handlePartFormToggle
                        }
                    >

                        <Plus size={18} />

                        <span>
                            Add Part
                        </span>

                    </button>

                )}

            </div>


            {/* =========================
                ADD PART FORM
                ADMIN + TECHNICIAN
            ========================== */}
            {partFormOpen &&
                canEditPartsCosts && (

                <form
                    className="part-form"
                    onSubmit={
                        handlePartSubmit
                    }
                >

                    <div className="repair-form-grid">

                        {/* PART NAME */}
                        <div className="repair-form-group">

                            <label htmlFor="part-name">
                                Part Name
                            </label>

                            <input
                                id="part-name"
                                type="text"
                                value={partName}
                                onChange={(event) =>
                                    setPartName(
                                        event.target.value
                                    )
                                }
                                placeholder="e.g. Charging Port"
                                required
                            />

                        </div>


                        {/* QUANTITY */}
                        <div className="repair-form-group">

                            <label htmlFor="part-quantity">
                                Quantity
                            </label>

                            <input
                                id="part-quantity"
                                type="number"
                                min="1"
                                value={quantity}
                                onChange={(event) =>
                                    setQuantity(
                                        event.target.value
                                    )
                                }
                                required
                            />

                        </div>


                        {/* UNIT COST */}
                        <div className="repair-form-group">

                            <label htmlFor="part-unit-cost">
                                Unit Cost
                            </label>

                            <input
                                id="part-unit-cost"
                                type="number"
                                min="0"
                                step="0.01"
                                value={unitCost}
                                onChange={(event) =>
                                    setUnitCost(
                                        event.target.value
                                    )
                                }
                                placeholder="0.00"
                                required
                            />

                        </div>

                    </div>


                    <div className="finding-form-actions">

                        <button
                            className="cancel-repair-button"
                            type="button"
                            onClick={
                                handlePartCancel
                            }
                        >
                            Cancel
                        </button>


                        <button
                            className="create-repair-button"
                            type="submit"
                        >
                            Add Part
                        </button>

                    </div>

                </form>

            )}


            {/* =========================
                PARTS LIST / EMPTY STATE
            ========================== */}
            {parts.length > 0 ? (

                <>

                    <div className="parts-table-wrapper">

                        <table className="parts-table">

                            <thead>

                                <tr>

                                    <th>
                                        Part
                                    </th>

                                    <th>
                                        Quantity
                                    </th>

                                    <th>
                                        Unit Cost
                                    </th>

                                    <th>
                                        Subtotal
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                {parts.map((part) => (

                                    <tr key={part.id}>

                                        <td>
                                            {part.name}
                                        </td>

                                        <td>
                                            {part.quantity}
                                        </td>

                                        <td>
                                            ₱{
                                                part.unitCost
                                                    .toFixed(2)
                                            }
                                        </td>

                                        <td>
                                            ₱{
                                                (
                                                    part.quantity *
                                                    part.unitCost
                                                ).toFixed(2)
                                            }
                                        </td>

                                    </tr>

                                ))}

                            </tbody>

                        </table>

                    </div>


                    <div className="parts-total">

                        <span>
                            Parts Total
                        </span>

                        <strong>
                            ₱{partsTotal.toFixed(2)}
                        </strong>

                    </div>

                </>

            ) : (

                <div className="workspace-empty-state">

                    <strong>
                        No parts recorded
                    </strong>

                    <p>
                        {canEditPartsCosts
                            ? "Add a part when a component is used for this repair."
                            : "Parts used for this repair will appear here."
                        }
                    </p>

                </div>

            )}

        </section>
    );
}


export default RepairPartsCosts;