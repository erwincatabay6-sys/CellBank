import { useLayoutEffect, useRef } from "react";
import { X } from "lucide-react";

import Brand from "./Brand.jsx";
import Sidebar from "./Sidebar.jsx";

export default function MobileStaffDrawer({
  opener, onDismiss, currentRoles, currentUserName, children,
}) {
  const dialogRef = useRef(null);
  const closeRef = useRef(null);

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    dialog.showModal();
    closeRef.current.focus();

    return () => {
      dialog.close();
      if (opener?.getClientRects().length) {
        opener.focus({ preventScroll: true });
      }
    };
  }, [opener]);

  function handleKeys(event) {
    if (event.key !== "Tab") return;

    const controls = dialogRef.current.querySelectorAll("button:not(:disabled)");
    const first = controls[0];
    const last = controls[controls.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <dialog
      ref={dialogRef}
      id="staff-navigation-drawer"
      className="staff-drawer"
      aria-label="Staff navigation"
      onKeyDown={handleKeys}
      onCancel={(event) => {
        event.preventDefault();
        onDismiss();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onDismiss();
      }}
    >
      <div className="staff-drawer-inner">
        <div className="staff-drawer-heading">
          <Brand nameAs="span" />
          <button
            ref={closeRef}
            className="icon-button"
            type="button"
            aria-label="Close navigation menu"
            onClick={onDismiss}
          >
            <X size={22} aria-hidden="true" />
          </button>
        </div>
        <Sidebar
          drawer
          onNavigate={onDismiss}
          currentRoles={currentRoles}
          currentUserName={currentUserName}
        >
          {children}
        </Sidebar>
      </div>
    </dialog>
  );
}
