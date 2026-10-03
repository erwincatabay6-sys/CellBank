import { useRef, useState } from "react";
import { X } from "lucide-react";

import LoadingSpinner from "../../../components/LoadingSpinner.jsx";

function CustomerRegistrationModal({
  initialCustomer = null,
  onClose,
  onSave,
}) {
  const isEditing = initialCustomer != null;

  const [values, setValues] = useState({
    name: initialCustomer?.name ?? "",
    phone: initialCustomer?.phone ?? "",
    email: initialCustomer?.email ?? "",
    address: initialCustomer?.address ?? "",
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
      name: values.name.trim(),
      phone: values.phone.trim().replace(/[ ()-]/g, ""),
      email: values.email.trim() || null,
      address: values.address.trim() || null,
    };

    const errors = {};

    if (!data.name) {
      errors.name = "Customer name is required.";
    } else if (data.name.length > 120) {
      errors.name = "Name must not exceed 120 characters.";
    }

    if (!data.phone) {
      errors.phone = "Phone number is required.";
    } else if (!/^\+?[0-9]{7,15}$/.test(data.phone)) {
      errors.phone =
        "Enter 7 to 15 digits, optionally starting with +.";
    }

    if (data.email && data.email.length > 254) {
      errors.email = "Email must not exceed 254 characters.";
    }

    if (data.address && data.address.length > 255) {
      errors.address = "Address must not exceed 255 characters.";
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
            "Close this form and reload the customer list before " +
            "submitting again.",
        );
      } else if (error.status === 403) {
        setErrorMessage(
          "You do not have permission to save this customer, " +
            "or your security token has expired. Refresh the page " +
            "and try again.",
        );
      } else {
        setErrorMessage(
          error.message || "Unable to save the customer. Please try again.",
        );
      }
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  }

  function renderFieldError(field) {
    return fieldErrors[field] ? (
      <p
        id={`customer-${field}-error`}
        className="customer-field-error"
      >
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
        aria-labelledby="customer-modal-title"
      >
        <div className="modal-header">
          <div>
            <h3 id="customer-modal-title">
              {isEditing ? "Edit Customer" : "New Customer"}
            </h3>

            <p>
              {isEditing
                ? "Update customer information."
                : "Register a new customer in the system."}
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
            <label htmlFor="customer-name">Full Name</label>
            <input
              id="customer-name"
              name="name"
              type="text"
              value={values.name}
              onChange={handleChange}
              maxLength={120}
              disabled={saving}
              aria-invalid={Boolean(fieldErrors.name)}
              aria-describedby={
                fieldErrors.name ? "customer-name-error" : undefined
              }
              required
            />
            {renderFieldError("name")}
          </div>

          <div className="repair-form-group">
            <label htmlFor="customer-phone">Phone Number</label>
            <input
              id="customer-phone"
              name="phone"
              type="tel"
              value={values.phone}
              onChange={handleChange}
              maxLength={30}
              disabled={saving}
              aria-invalid={Boolean(fieldErrors.phone)}
              aria-describedby={
                fieldErrors.phone ? "customer-phone-error" : undefined
              }
              required
            />
            {renderFieldError("phone")}
          </div>

          <div className="repair-form-group">
            <label htmlFor="customer-email">Email Address</label>
            <input
              id="customer-email"
              name="email"
              type="email"
              value={values.email}
              onChange={handleChange}
              maxLength={254}
              placeholder="Optional email address"
              disabled={saving}
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={
                fieldErrors.email ? "customer-email-error" : undefined
              }
            />
            {renderFieldError("email")}
          </div>

          <div className="repair-form-group">
            <label htmlFor="customer-address">Address</label>
            <textarea
              id="customer-address"
              name="address"
              value={values.address}
              onChange={handleChange}
              maxLength={255}
              placeholder="Optional customer address"
              rows={3}
              disabled={saving}
              aria-invalid={Boolean(fieldErrors.address)}
              aria-describedby={
                fieldErrors.address ? "customer-address-error" : undefined
              }
            />
            {renderFieldError("address")}
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
                    : "Register Customer"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CustomerRegistrationModal;