import { useState } from "react";

import StatusBadge from "../../../components/StatusBadge.jsx";
import { getProblemCategoryLabel } from "../../repairs/problemCategories.js";
import CustomerRecordPagination from "./CustomerRecordPagination.jsx";

const REPAIRS_PER_PAGE = 5;

const serviceLabels = {
  DIAGNOSTIC: "Diagnostic",
  HARDWARE_REPAIR: "Hardware Repair",
  SOFTWARE_REPAIR: "Software Repair",
  MAINTENANCE: "Maintenance / Cleaning",
  OTHER: "Other",
};

function RepairReference({ repair, disabled, onRepairClick }) {
  return (
    <button
      className="record-link"
      type="button"
      aria-label={`Open repair ${repair.repairReference}`}
      onClick={() => onRepairClick(repair.id)}
      disabled={disabled}
    >
      {repair.repairReference}
    </button>
  );
}

export default function DeviceRepairList({ repairs, onRepairClick, disabled }) {
  const [page, setPage] = useState(1);
  const pageCount = Math.ceil(repairs.length / REPAIRS_PER_PAGE);
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * REPAIRS_PER_PAGE;
  const visible = repairs.slice(start, start + REPAIRS_PER_PAGE);
  const end = start + visible.length;
  const range = start + 1 === end ? end : `${start + 1}–${end}`;

  return (
    <>
      <div className="device-history-table">
        <table className="customer-table" aria-label="Device repair history">
          <thead>
            <tr>
              <th scope="col">Repair reference</th>
              <th scope="col">Reported problem</th>
              <th scope="col">Service type</th>
              <th scope="col">Problem category</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((repair, index) => (
              <tr key={`${start + index}:${repair.id}`}>
                <td><RepairReference repair={repair} disabled={disabled} onRepairClick={onRepairClick} /></td>
                <td className="device-history-problem">{repair.reportedProblem}</td>
                <td>{serviceLabels[repair.serviceType] ?? repair.serviceType}</td>
                <td>{getProblemCategoryLabel(repair.problemCategory)}</td>
                <td><StatusBadge status={repair.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="device-history-mobile" role="list" aria-label="Device repair history">
        {visible.map((repair, index) => (
          <li key={`${start + index}:${repair.id}`}>
            <div className="device-history-row-top">
              <RepairReference repair={repair} disabled={disabled} onRepairClick={onRepairClick} />
              <StatusBadge status={repair.status} />
            </div>
            <p className="device-history-problem">{repair.reportedProblem}</p>
            <p className="device-history-row-meta">
              {serviceLabels[repair.serviceType] ?? repair.serviceType}
              <span aria-hidden="true"> · </span>
              {getProblemCategoryLabel(repair.problemCategory)}
            </p>
          </li>
        ))}
      </ul>

      <CustomerRecordPagination
        label="Repair history pages"
        page={currentPage}
        pageCount={pageCount}
        onPageChange={setPage}
        disabled={disabled}
      >
        Showing {range} of {repairs.length} {repairs.length === 1 ? "repair" : "repairs"}
      </CustomerRecordPagination>
    </>
  );
}
