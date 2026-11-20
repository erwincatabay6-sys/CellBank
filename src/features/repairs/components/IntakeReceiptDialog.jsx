import { useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Printer, X } from "lucide-react";

import IntakeReceipt from "./IntakeReceipt.jsx";
import "./intakeReceipt.css";

export default function IntakeReceiptDialog({ repair, device, trigger, onClose }) {
  const dialogRef = useRef(null);
  const closeRef = useRef(null);
  const printRef = useRef(null);

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    dialog.showModal();
    closeRef.current.focus();

    return () => {
      dialog.close();
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    };
  }, [trigger]);

  function handleKeyDown(event) {
    if (event.key !== "Tab") return;

    const first = event.shiftKey ? closeRef.current : printRef.current;
    const last = event.shiftKey ? printRef.current : closeRef.current;
    if (document.activeElement === first) {
      event.preventDefault();
      last.focus();
    }
  }

  return createPortal(
    <dialog
      ref={dialogRef}
      className="device-modal status-details-modal intake-receipt-dialog"
      aria-labelledby="intake-receipt-title"
      onKeyDown={handleKeyDown}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      {/* Chromium applies the unnamed page size reliably to content in a dialog. */}
      <style media="print">{"@page { size: 80mm 180mm; margin: 4mm 0; background: #fff; }"}</style>
      <div className="modal-header">
        <h3 id="intake-receipt-title">Intake receipt</h3>
        <button ref={closeRef} type="button" className="modal-close-button"
          aria-label="Close intake receipt" onClick={onClose}>
          <X size={20} aria-hidden="true" />
        </button>
      </div>

      <div className="intake-receipt-preview" tabIndex={0} role="region" aria-label="Receipt preview">
        <IntakeReceipt repair={repair} device={device} />
      </div>

      <div className="intake-receipt-actions">
        <button ref={printRef} type="button" className="create-repair-button"
          onClick={() => window.print()}>
          <Printer size={16} aria-hidden="true" />
          Print receipt
        </button>
      </div>
    </dialog>,
    document.body,
  );
}
