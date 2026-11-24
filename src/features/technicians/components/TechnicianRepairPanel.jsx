import { useState } from "react";

import StatusBadge from "../../../components/StatusBadge.jsx";
import CustomerRecordPagination from "../../customers/components/CustomerRecordPagination.jsx";

const REPAIRS_PER_PAGE = 5;

export default function TechnicianRepairPanel({
  activeRepairs, repairHistory, canViewRepairs, onRepairClick,
}) {
  const [selected, setSelected] = useState("active");
  const tabs = [
    {
      id: "active",
      label: "Active repairs",
      repairs: activeRepairs,
      emptyTitle: "No active repairs",
      emptyMessage: "This technician currently has no active repair assignments.",
    },
    {
      id: "history",
      label: "Repair history",
      repairs: repairHistory,
      emptyTitle: "No repair history",
      emptyMessage: "Completed or cancelled repairs will appear here.",
    },
  ];

  function handleKeyDown(event, index) {
    let next;
    switch (event.key) {
      case "ArrowLeft":
      case "ArrowRight": next = 1 - index; break;
      case "Home": next = 0; break;
      case "End": next = 1; break;
      default: return;
    }
    event.preventDefault();
    event.currentTarget.parentElement.querySelectorAll('[role="tab"]')[next].focus();
    setSelected(tabs[next].id);
  }

  return (
    <section className="page-content technician-detail-repairs">
      <div className="technician-detail-tabs" role="tablist" aria-label="Technician repairs">
        {tabs.map(({ id, label, repairs }, index) => (
          <button
            key={id}
            id={`technician-tab-${id}`}
            type="button"
            role="tab"
            aria-selected={selected === id}
            aria-controls={`technician-panel-${id}`}
            tabIndex={selected === id ? 0 : -1}
            onClick={() => setSelected(id)}
            onKeyDown={(event) => handleKeyDown(event, index)}
          >
            {label} ({repairs.length})
          </button>
        ))}
      </div>

      {tabs.map(({ id, label, repairs, emptyTitle, emptyMessage }) => (
        <div
          key={id}
          id={`technician-panel-${id}`}
          role="tabpanel"
          aria-labelledby={`technician-tab-${id}`}
          tabIndex={0}
          hidden={selected !== id}
        >
          {repairs.length ? (
            <TechnicianRepairList
              label={label}
              repairs={repairs}
              canViewRepairs={canViewRepairs}
              onRepairClick={onRepairClick}
            />
          ) : (
            <div className="workspace-empty-state">
              <strong>{emptyTitle}</strong>
              <p>{emptyMessage}</p>
            </div>
          )}
        </div>
      ))}
    </section>
  );
}

function RepairReference({ repair, canViewRepairs, onRepairClick }) {
  if (!canViewRepairs) return <strong>{repair.reference}</strong>;

  return (
    <button
      className="record-link"
      type="button"
      aria-label={`Open repair ${repair.reference}`}
      onClick={() => onRepairClick(repair.id)}
    >
      {repair.reference}
    </button>
  );
}

function TechnicianRepairList({ label, repairs, canViewRepairs, onRepairClick }) {
  const [page, setPage] = useState(1);
  const pageCount = Math.ceil(repairs.length / REPAIRS_PER_PAGE);
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * REPAIRS_PER_PAGE;
  const visible = repairs.slice(start, start + REPAIRS_PER_PAGE);
  const end = start + visible.length;
  const range = start + 1 === end ? end : `${start + 1}–${end}`;

  return (
    <>
      <div className="technician-detail-repair-table">
        <table className="technician-table" aria-label={label}>
          <thead>
            <tr>
              <th scope="col">Repair reference</th>
              <th scope="col">Customer</th>
              <th scope="col">Device</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((repair) => (
              <tr key={repair.id}>
                <td><RepairReference repair={repair} canViewRepairs={canViewRepairs} onRepairClick={onRepairClick} /></td>
                <td>{repair.customer}</td>
                <td>{repair.device}</td>
                <td><StatusBadge status={repair.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="technician-detail-mobile-repairs" role="list" aria-label={label}>
        {visible.map((repair) => (
          <li key={repair.id}>
            <div className="technician-detail-repair-top">
              <RepairReference repair={repair} canViewRepairs={canViewRepairs} onRepairClick={onRepairClick} />
              <StatusBadge status={repair.status} />
            </div>
            <dl className="technician-detail-repair-fields">
              <div>
                <dt>Customer</dt>
                <dd>{repair.customer}</dd>
              </div>
              <div>
                <dt>Device</dt>
                <dd>{repair.device}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>

      <CustomerRecordPagination label={`${label} pages`} page={currentPage} pageCount={pageCount} onPageChange={setPage}>
        Showing {range} of {repairs.length} {repairs.length === 1 ? "repair" : "repairs"}
      </CustomerRecordPagination>
    </>
  );
}
