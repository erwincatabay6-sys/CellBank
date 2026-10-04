import { useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  getRepairs,
  getRepairTechnicians,
} from "../../../api/repairApi.js";
import { getCustomers } from "../../../api/customerApi.js";
import { hasRole } from "../../../config/accessControl.js";
import { useAuth } from "../../auth/context/AuthContext.jsx";
import RepairTable from "../components/RepairTable.jsx";

import "../../customers/customers.css";
import "../repairs.css";

const statuses = [
  ["RECEIVED", "Received"],
  ["AWAITING_APPROVAL", "Awaiting Approval"],
  ["IN_PROGRESS", "In Progress"],
  ["AWAITING_PARTS", "Awaiting Parts"],
  ["READY_FOR_RELEASE", "Ready for Release"],
  ["COMPLETED", "Completed"],
  ["CANCELLED", "Cancelled"],
];

function RepairListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const canCreateRepair =
    hasRole(user?.roles, "ADMIN") ||
    hasRole(user?.roles, "FRONT_DESK");

  const [data, setData] = useState({
    repairs: [],
    customers: [],
    technicians: [],
  });

  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [reloadVersion, setReloadVersion] = useState(0);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [technicianFilter, setTechnicianFilter] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    async function loadRecords() {
      setLoading(true);
      setLoadError("");

      try {
        const [repairs, customers, technicians] = await Promise.all([
          getRepairs({ signal: controller.signal }),
          getCustomers({ signal: controller.signal }),
          getRepairTechnicians({ signal: controller.signal }),
        ]);

        if (
          !Array.isArray(repairs) ||
          !Array.isArray(customers) ||
          !Array.isArray(technicians) ||
          customers.some((customer) => !Array.isArray(customer.devices))
        ) {
          throw new Error("The server returned invalid repair list data.");
        }

        if (active) {
          setData({ repairs, customers, technicians });
          setLoaded(true);
        }
      } catch (error) {
        if (active && error.code !== "CANCELLED") {
          setLoadError(
            error.status === 403
              ? "You do not have permission to view these records."
              : error.message || "Unable to load repairs.",
          );
        }

        controller.abort();
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadRecords();

    return () => {
      active = false;
      controller.abort();
    };
  }, [reloadVersion]);

  const customersById = new Map(
    data.customers.map((customer) => [customer.id, customer]),
  );

  const devicesById = new Map(
    data.customers.flatMap((customer) =>
      customer.devices.map((device) => [device.id, device]),
    ),
  );

  const technicianNames = new Map(
    data.technicians.map((technician) => [
      technician.id,
      technician.name,
    ]),
  );

  for (const repair of data.repairs) {
    const technicianId = repair.assignedTechnicianId;

    if (technicianId != null && !technicianNames.has(technicianId)) {
      technicianNames.set(technicianId, `Staff #${technicianId}`);
    }
  }

  const technicianOptions = Array.from(
    technicianNames,
    ([id, name]) => ({ id, name }),
  ).sort((a, b) => a.name.localeCompare(b.name));

  const repairs = data.repairs.map((repair) => {
    const customer = customersById.get(repair.customerId);
    const device = devicesById.get(repair.deviceId);

    return {
      ...repair,
      reference: repair.repairReference,
      customer: customer?.name ?? `Customer #${repair.customerId}`,
      device: device
        ? `${device.brand} ${device.model}`
        : `Device #${repair.deviceId}`,
      technicianId: repair.assignedTechnicianId,
      technician:
        repair.assignedTechnicianId == null
          ? "Unassigned"
          : technicianNames.get(repair.assignedTechnicianId),
    };
  });

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredRepairs = repairs.filter((repair) => {
    const searchableText = [
      repair.reference,
      repair.customer,
      repair.device,
      repair.technician,
      repair.reportedProblem,
      repair.status.replaceAll("_", " "),
    ]
      .join(" ")
      .toLowerCase();

    const matchesSearch =
      !normalizedSearch || searchableText.includes(normalizedSearch);

    const matchesStatus =
      !statusFilter || repair.status === statusFilter;

    const matchesTechnician =
      !technicianFilter ||
      (technicianFilter === "UNASSIGNED"
        ? repair.technicianId == null
        : String(repair.technicianId) === technicianFilter);

    return matchesSearch && matchesStatus && matchesTechnician;
  });

  return (
    <>
      <section className="page-header">
        <h2>Repairs</h2>
        <p>Manage and monitor Cellbank repair jobs.</p>
      </section>

      <section className="repair-toolbar">
        <div className="repair-search">
          <Search size={18} />
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search repairs..."
            aria-label="Search repair records"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          aria-label="Filter by repair status"
        >
          <option value="">All Statuses</option>
          {statuses.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <select
          value={technicianFilter}
          onChange={(event) => setTechnicianFilter(event.target.value)}
          aria-label="Filter by technician"
        >
          <option value="">All Technicians</option>
          {technicianOptions.map((technician) => (
            <option key={technician.id} value={technician.id}>
              {technician.name}
            </option>
          ))}
          <option value="UNASSIGNED">Unassigned</option>
        </select>

        {canCreateRepair && (
          <button
            className="new-repair-button"
            type="button"
            onClick={() => navigate("/repairs/new")}
          >
            <Plus size={18} />
            <span>New Repair</span>
          </button>
        )}
      </section>

      {loaded && (
        <div className="repair-result-count" role="status">
          Showing {filteredRepairs.length} of {repairs.length} repairs
        </div>
      )}

      <section className="page-content" aria-busy={loading}>
        {loadError && (
          <div className="customer-form-error" role="alert">
            <p>{loadError}</p>

            {loaded && (
              <p>
                Previously loaded records are shown and may be out of date.
              </p>
            )}

            <button
              className="secondary-repair-button"
              type="button"
              onClick={() => setReloadVersion((value) => value + 1)}
              disabled={loading}
            >
              Try Again
            </button>
          </div>
        )}

        {!loaded && loading && (
          <div role="status" aria-label="Loading repairs">
            <div className="repair-table-wrapper" aria-hidden="true">
              <table className="repair-table">
                <thead>
                  <tr>
                    {[
                      "Reference",
                      "Customer",
                      "Device",
                      "Technician",
                      "Status",
                    ].map((label) => (
                      <th key={label}>{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 5 }, (_, row) => (
                    <tr key={row}>
                      {Array.from({ length: 5 }, (_, column) => (
                        <td key={column}>
                          <span className="customer-skeleton-line" />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {loaded && repairs.length === 0 && (
          <div className="workspace-empty-state">
            <strong>No repairs yet</strong>
            <p>Saved repair jobs will appear here.</p>
          </div>
        )}

        {loaded && repairs.length > 0 && (
          <RepairTable repairs={filteredRepairs} />
        )}
      </section>
    </>
  );
}

export default RepairListPage;