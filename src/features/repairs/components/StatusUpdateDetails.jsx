import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import StatusBadge from "../../../components/StatusBadge.jsx";

export default function StatusUpdateDetails({ entry, changedBy, timestamp, onClose }) {
  const dialogRef = useRef(null);
  const closeRef = useRef(null);
  const bodyRef = useRef(null);

  useEffect(() => {
    const trigger = document.activeElement;
    const dialog = dialogRef.current;
    dialog.showModal();
    return () => {
      dialog.close();
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    };
  }, []);

  return createPortal(
    <dialog
      ref={dialogRef}
      className="device-modal status-details-modal"
      aria-labelledby="status-details-title"
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        if (event.shiftKey && document.activeElement === closeRef.current) {
          event.preventDefault();
          bodyRef.current.focus();
        } else if (!event.shiftKey && document.activeElement === bodyRef.current) {
          event.preventDefault();
          closeRef.current.focus();
        }
      }}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className="modal-header">
        <h3 id="status-details-title">Status update details</h3>
        <button ref={closeRef} type="button" className="modal-close-button" autoFocus
          aria-label="Close status update details" onClick={onClose}>
          <X size={20} aria-hidden="true" />
        </button>
      </div>
      <div ref={bodyRef} className="status-details-body" tabIndex={0} role="region" aria-label="Status update messages">
        <StatusBadge status={entry.newStatus} />
        <p><strong>Changed by:</strong>{" "}{changedBy}</p>
        <p><strong>Timestamp:</strong>{" "}{timestamp}</p>
        {[["Internal note", entry.note], ["Customer update", entry.customerUpdate]].map(
          ([label, value]) => typeof value === "string" && value.trim() ? (
            <div className="status-details-message" key={label}>
              <strong>{label}</strong>
              <p>{value}</p>
            </div>
          ) : null,
        )}
      </div>
    </dialog>,
    document.body,
  );
}
