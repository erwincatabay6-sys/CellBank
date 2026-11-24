import { useRef } from "react";
import { ChevronDown, Laptop, Monitor, Package, Plus, Search, Smartphone, Tablet } from "lucide-react";
import { Link } from "react-router-dom";

import CustomerRecordPagination from "./CustomerRecordPagination.jsx";

export const DEVICE_PAGE_SIZE = 5;

const deviceIcons = {
  "Mobile Phone": Smartphone,
  Laptop,
  "Desktop Computer": Monitor,
  Tablet,
};

function deviceName(device) {
  return [device.brand, device.model].filter(Boolean).join(" ");
}

function CustomerDeviceList({
  devices,
  customerId,
  search,
  page,
  onSearch,
  onPageChange,
  onNewDevice,
  canManage = false,
  disabled = false,
}) {
  const searchRef = useRef(null);
  const query = search.trim().toLowerCase();
  const matches = devices.filter((device) =>
    [deviceName(device), device.imei, device.serialNumber].some((value) =>
      String(value ?? "").toLowerCase().includes(query),
    ),
  );
  const pageCount = Math.max(1, Math.ceil(matches.length / DEVICE_PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * DEVICE_PAGE_SIZE;
  const visible = matches.slice(start, start + DEVICE_PAGE_SIZE);
  const range = visible.length === 1 ? start + 1 : `${start + 1}–${start + visible.length}`;

  function devicePath(device) {
    return `/customers/${customerId}/devices/${device.id}`;
  }

  return (
    <section aria-label="Registered devices">
      <div className="customer-detail-device-toolbar">
        <label className="customer-search">
          <Search size={18} aria-hidden="true" />
          <input
            ref={searchRef}
            type="search"
            aria-label="Search registered devices"
            placeholder="Search model, IMEI or serial number"
            value={search}
            onChange={(event) => onSearch(event.target.value)}
          />
        </label>

        {canManage && (
          <button
            className="secondary-repair-button"
            type="button"
            onClick={onNewDevice}
            disabled={disabled}
          >
            <Plus size={18} aria-hidden="true" />
            New Device
          </button>
        )}
      </div>

      {visible.length === 0 ? (
        <div className="workspace-empty-state" role="status">
          {devices.length === 0 ? (
            <>
              <strong>No registered devices</strong>
              <p>Devices registered for this customer will appear here.</p>
            </>
          ) : (
            <>
              <strong>No matching devices</strong>
              <p>Try a different model, IMEI or serial number.</p>
              <button
                className="secondary-repair-button"
                type="button"
                onClick={() => {
                  onSearch("");
                  searchRef.current?.focus();
                }}
              >
                Clear search
              </button>
            </>
          )}
        </div>
      ) : (
        <>
          <div className="customer-detail-device-table">
            <table className="customer-table" aria-label="Registered devices">
              <thead>
                <tr>
                  <th scope="col">Device</th>
                  <th scope="col">Type</th>
                  <th scope="col">IMEI</th>
                  <th scope="col">Serial number</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((device) => {
                  const Icon = deviceIcons[device.type] ?? Package;
                  return (
                    <tr key={device.id}>
                      <td>
                        <Link className="record-link customer-detail-device-link" to={devicePath(device)}>
                          <Icon size={18} aria-hidden="true" />
                          <span>{deviceName(device)}</span>
                        </Link>
                      </td>
                      <td>{device.type}</td>
                      <td>{device.imei ?? "Not recorded"}</td>
                      <td>{device.serialNumber ?? "Not recorded"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <ul className="customer-detail-device-mobile" aria-label="Registered devices">
            {visible.map((device) => {
              const Icon = deviceIcons[device.type] ?? Package;
              const name = deviceName(device);
              return (
                <li key={device.id}>
                  <details>
                    <summary aria-label={`${name}, ${device.type}, device identifiers`}>
                      <Icon size={18} aria-hidden="true" />
                      <span><strong>{name}</strong><small>{device.type}</small></span>
                      <ChevronDown className="customer-detail-device-chevron" size={18} aria-hidden="true" />
                    </summary>
                    <dl>
                      <div>
                        <dt>IMEI</dt>
                        <dd>{device.imei ?? "Not recorded"}</dd>
                      </div>
                      <div>
                        <dt>Serial number</dt>
                        <dd>{device.serialNumber ?? "Not recorded"}</dd>
                      </div>
                    </dl>
                    <Link
                      className="record-link customer-detail-open-device"
                      aria-label={`Open device ${name}`}
                      to={devicePath(device)}
                    >
                      Open device details
                    </Link>
                  </details>
                </li>
              );
            })}
          </ul>

          <CustomerRecordPagination
            label="Device pages"
            page={currentPage}
            pageCount={pageCount}
            onPageChange={onPageChange}
            numbered
          >
            {pageCount > 1
              ? `${range} of ${matches.length} devices`
              : `${matches.length} ${matches.length === 1 ? "device" : "devices"}`}
          </CustomerRecordPagination>
        </>
      )}
    </section>
  );
}

export default CustomerDeviceList;
