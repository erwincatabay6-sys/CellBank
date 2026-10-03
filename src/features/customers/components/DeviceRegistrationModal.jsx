import { useRef, useState } from "react";
import { X } from "lucide-react";

import LoadingSpinner from "../../../components/LoadingSpinner.jsx";

const deviceTypes = [
  "Mobile Phone",
  "Laptop",
  "Desktop Computer",
  "Tablet",
  "Other",
];

const textFields = [
  { name: "brand", label: "Brand", maxLength: 80, required: true },
  { name: "model", label: "Model", maxLength: 120, required: true },
  { name: "serialNumber", label: "Serial Number", maxLength: 120 },
  { name: "imei", label: "IMEI", maxLength: 20 },
];

function DeviceRegistrationModal({
  customerName,
  initialDevice = null,
  onClose,
  onSave,
}) {
  const isEditing = initialDevice != null;

  const [values, setValues] = useState({
    type: initialDevice?.type ?? "",
    brand: initialDevice?.brand ?? "",
    model: initialDevice?.model ?? "",
    serialNumber: initialDevice?.serialNumber ?? "",
    imei: initialDevice?.imei ?? "",
    notes: initialDevice?.notes ?? "",
  });

  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState("");
  const [outcomeUncertain, setOutcomeUncertain] = useState(false);

  const submitting = useRef(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setValues((current) => ({
      ...current,
      [name]: value,
    }));

    setFieldErrors((current) => ({
      ...current,
      [name]: "",
    }));
  }

  function handleClose() {
    if (!submitting.current) {
      onClose();
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (submitting.current || outcomeUncertain) {
      return;
    }

    const data = {
      type: values.type,
      brand: values.brand.trim(),
      model: values.model.trim(),
      serialNumber: values.serialNumber.trim() || null,
      imei: values.imei.trim() || null,
      notes: values.notes.trim() || null,
    };

    const errors = {};

    if (!deviceTypes.includes(data.type)) {
      errors.type = "Select a supported device type.";
    }

    for (const field of textFields) {
      const value = data[field.name];

      if (field.required && !value) {
        errors[field.name] = `${field.label} is required.`;
      } else if (value && value.length > field.maxLength) {
        errors[field.name] =
          `${field.label} must not exceed ${field.maxLength} characters.`;
      }
    }

    if (data.notes && data.notes.length > 2000) {
      errors.notes = "Notes must not exceed 2000 characters.";
    }

    setFieldErrors(errors);
    setErrorMessage("");

    if (Object.keys(errors).length > 0) {
      return;
    }

    submitting.current = true;
    setSaving(true);

    try {
      await onSave(data);
      onClose();
    } catch (error) {
      setFieldErrors(error.errors || {});

      if (error.outcomeUncertain) {
        setOutcomeUncertain(true);
        setErrorMessage(
          "The save could not be confirmed. It may have completed. " +
            "Close this form and reload the customer record before " +
            "submitting again.",
        );
      } else if (error.status === 409) {
        setErrorMessage(
          "The device conflicts with an existing record. " +
            "Check whether its serial number or IMEI is already registered.",
        );
      } else if (error.status === 403) {
        setErrorMessage(
          "You do not have permission to save this device, " +
            "or your security token has expired. Refresh the page " +
            "and try again.",
        );
      } else {
        setErrorMessage(
          error.message || "Unable to save the device. Please try again.",
        );
      }
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  }

  function renderFieldError(field) {
    return fieldErrors[field] ? (
      <p id={`device-${field}-error`} className="customer-field-error">
        {fieldErrors[field]}
      </p>
    ) : null;
  }

  return (
    <div className="modal-backdrop">
      <div
        className="device-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="device-modal-title"
      >
        <div className="modal-header">
          <div>
            <h3 id="device-modal-title">
              {isEditing ? "Edit Device" : "New Device"}
            </h3>

            <p>
              {isEditing
                ? `Update device information for ${customerName}.`
                : `Register a device for ${customerName}.`}
            </p>
          </div>

          <button
            className="modal-close-button"
            type="button"
            onClick={handleClose}
            disabled={saving}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <form
          className="device-registration-form"
          onSubmit={handleSubmit}
          aria-busy={saving}
        >
          <div className="repair-form-group">
            <label htmlFor="device-type">Device Type</label>

            <select
              id="device-type"
              name="type"
              value={values.type}
              onChange={handleChange}
              disabled={saving}
              aria-invalid={Boolean(fieldErrors.type)}
              aria-describedby={
                fieldErrors.type ? "device-type-error" : undefined
              }
              required
            >
              <option value="">Select device type</option>

              {deviceTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>

            {renderFieldError("type")}
          </div>

          <div className="modal-form-grid">
            {textFields.map((field) => (
              <div className="repair-form-group" key={field.name}>
                <label htmlFor={`device-${field.name}`}>{field.label}</label>

                <input
                  id={`device-${field.name}`}
                  name={field.name}
                  type="text"
                  value={values[field.name]}
                  onChange={handleChange}
                  maxLength={field.maxLength}
                  required={Boolean(field.required)}
                  placeholder={field.required ? "" : "Optional"}
                  disabled={saving}
                  aria-invalid={Boolean(fieldErrors[field.name])}
                  aria-describedby={
                    fieldErrors[field.name]
                      ? `device-${field.name}-error`
                      : undefined
                  }
                />

                {renderFieldError(field.name)}
              </div>
            ))}
          </div>

          <div className="repair-form-group">
            <label htmlFor="device-notes">Notes</label>

            <textarea
              id="device-notes"
              name="notes"
              value={values.notes}
              onChange={handleChange}
              maxLength={2000}
              rows={3}
              placeholder="Optional identifying notes"
              disabled={saving}
              aria-invalid={Boolean(fieldErrors.notes)}
              aria-describedby={
                fieldErrors.notes ? "device-notes-error" : undefined
              }
            />

            {renderFieldError("notes")}
          </div>

          {errorMessage && (
            <div className="customer-form-error" role="alert">
              {errorMessage}
            </div>
          )}

          <div className="modal-actions">
            <button
              className="cancel-repair-button"
              type="button"
              onClick={handleClose}
              disabled={saving}
            >
              {outcomeUncertain ? "Close" : "Cancel"}
            </button>

            <button
              className="create-repair-button"
              type="submit"
              disabled={saving || outcomeUncertain}
            >
              {saving && <LoadingSpinner size={16} />}

              <span>
                {saving
                  ? "Saving..."
                  : isEditing
                    ? "Save Changes"
                    : "Register Device"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default DeviceRegistrationModal;
