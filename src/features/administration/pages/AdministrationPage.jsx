import { useCallback, useEffect, useRef, useState } from "react";
import { Plus, Search } from "lucide-react";

import { isValidRoleCombination } from "../../../config/accessControl.js";
import { useAuth } from "../../auth/context/AuthContext.jsx";

import {
  getStaffAccounts,
  createStaffAccount,
  updateStaffAccount,
  updateStaffAccess,
} from "../../../api/staffApi.js";

import StaffTable from "../components/StaffTable.jsx";
import StaffAccountModal from "../components/StaffAccountModal.jsx";

import "../administration.css";

function getErrorMessage(error) {
  if (error.status === 401) {
    return "Your session has expired. Please sign in again.";
  }

  if (error.status === 403) {
    return "The request was not permitted. Refresh the page and try again.";
  }

  const validationMessages = Object.values(error.errors || {}).flat();

  if (validationMessages.length > 0) {
    return validationMessages.join(" ");
  }

  return error.status
    ? error.message
    : "Unable to connect to the server. Please try again.";
}

function AdministrationPage() {
  const { user: currentUser, refreshSession } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formError, setFormError] = useState("");

  const [saving, setSaving] = useState(false);
  const mutationInProgress = useRef(false);

  const loadStaff = useCallback(async () => {
    setLoading(true);
    setLoadError("");

    try {
      const accounts = await getStaffAccounts();
      setUsers(accounts);
    } catch (error) {
      setLoadError(getErrorMessage(error));

      if (error.status === 401) {
        await refreshSession();
      }
    } finally {
      setLoading(false);
    }
  }, [refreshSession]);

  useEffect(() => {
    void loadStaff();
  }, [loadStaff]);

  const search = searchTerm.trim().toLowerCase();

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(search) ||
      user.username.toLowerCase().includes(search) ||
      user.email.toLowerCase().includes(search);

    const matchesRole = roleFilter === "ALL" || user.roles.includes(roleFilter);

    const matchesStatus =
      statusFilter === "ALL" || user.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  function validateStaffAccount(data) {
    if (!data.name.trim()) {
      return "Please enter the staff member's name.";
    }

    if (!isValidRoleCombination(data.roles)) {
      return (
        "Select Technician, Front Desk, or both. " +
        "Administrator must remain exclusive."
      );
    }

    const wasAdmin = selectedUser?.roles.includes("ADMIN") ?? false;
    const assigningAdmin = data.roles.includes("ADMIN");

    if (wasAdmin && !assigningAdmin) {
      return "The Administrator role cannot be removed.";
    }

    if (!wasAdmin && assigningAdmin) {
      return "Additional Administrator accounts cannot be assigned.";
    }

    if (!selectedUser) {
      const password = data.initialPassword || "";

      if (!password.trim() || password.length < 8) {
        return "The initial password must contain at least 8 characters.";
      }

      if (new TextEncoder().encode(password).length > 72) {
        return "The initial password must not exceed 72 UTF-8 bytes.";
      }
    }

    return "";
  }

  function handleNewStaff() {
    if (loading || loadError || mutationInProgress.current) {
      return;
    }

    setSelectedUser(null);
    setFormError("");
    setStaffModalOpen(true);
  }

  function handleUserClick(userId) {
    if (mutationInProgress.current) {
      return;
    }

    const account = users.find((user) => user.id === userId);

    if (!account) {
      return;
    }

    setSelectedUser(account);
    setFormError("");
    setStaffModalOpen(true);
  }

  function handleModalClose() {
    if (mutationInProgress.current) {
      return;
    }

    setStaffModalOpen(false);
    setSelectedUser(null);
    setFormError("");
  }

  async function handleStaffSave(data) {
    if (mutationInProgress.current) {
      return;
    }

    const validationError = validateStaffAccount(data);

    if (validationError) {
      setFormError(validationError);
      return;
    }

    mutationInProgress.current = true;
    setSaving(true);
    setFormError("");

    const editedUserId = selectedUser?.id;

    try {
      const savedUser = selectedUser
        ? await updateStaffAccount(editedUserId, data)
        : await createStaffAccount(data);

      setUsers((existingUsers) =>
        editedUserId != null
          ? existingUsers.map((user) =>
              user.id === savedUser.id ? savedUser : user,
            )
          : [...existingUsers, savedUser],
      );

      setStaffModalOpen(false);
      setSelectedUser(null);

      if (savedUser.id === currentUser?.id) {
        await refreshSession();
      }
    } catch (error) {
      setFormError(getErrorMessage(error));

      if (error.status === 401) {
        await refreshSession();
      }
    } finally {
      mutationInProgress.current = false;
      setSaving(false);
    }
  }

  async function handleToggleStatus(userId) {
    if (mutationInProgress.current) {
      return;
    }

    const account = users.find((user) => user.id === userId);

    if (!account) {
      return;
    }

    if (account.roles.includes("ADMIN")) {
      setFormError("The Administrator account cannot be deactivated.");
      return;
    }

    mutationInProgress.current = true;
    setSaving(true);
    setFormError("");

    try {
      const savedUser = await updateStaffAccess(
        userId,
        account.status !== "ACTIVE",
      );

      setUsers((existingUsers) =>
        existingUsers.map((user) =>
          user.id === savedUser.id ? savedUser : user,
        ),
      );
    } catch (error) {
      setFormError(getErrorMessage(error));

      if (error.status === 401) {
        await refreshSession();
      }
    } finally {
      mutationInProgress.current = false;
      setSaving(false);
    }
  }

  return (
    <>
      <section className="page-header">
        <h2>Administration</h2>
        <p>Manage staff accounts, roles, and system access.</p>
      </section>

      <section className="page-content" aria-busy={loading || saving}>
        <div className="workspace-section-header">
          <div>
            <h3>Staff Accounts</h3>
            <p className="workspace-section-description">
              View and manage authorized staff accounts.
            </p>
          </div>

          <button
            className="create-repair-button"
            type="button"
            onClick={handleNewStaff}
            disabled={loading || saving || Boolean(loadError)}
          >
            <Plus size={18} />
            <span>New Staff Account</span>
          </button>
        </div>

        <div className="administration-filters">
          <div className="administration-search">
            <Search size={18} />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search staff..."
            />
          </div>

          <select
            aria-label="Filter by role"
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
          >
            <option value="ALL">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="TECHNICIAN">Technician</option>
            <option value="FRONT_DESK">Front Desk</option>
          </select>

          <select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>

        {!staffModalOpen && formError && (
          <div className="administration-error" role="alert">
            {formError}
          </div>
        )}

        {saving && <p role="status">Saving changes...</p>}

        {loading ? (
          <p role="status">Loading staff accounts...</p>
        ) : loadError ? (
          <div className="administration-error" role="alert">
            <p>{loadError}</p>
            <button type="button" onClick={() => void loadStaff()}>
              Try again
            </button>
          </div>
        ) : (
          <>
            <div className="administration-result-count">
              Showing <strong>{filteredUsers.length}</strong> of{" "}
              <strong>{users.length}</strong> staff accounts
            </div>

            {filteredUsers.length > 0 ? (
              <StaffTable
                users={filteredUsers}
                saving={saving}
                onUserClick={handleUserClick}
                onToggleStatus={handleToggleStatus}
              />
            ) : (
              <div className="workspace-empty-state">
                <strong>No staff accounts found</strong>
                <p>Try changing the search or account filters.</p>
              </div>
            )}
          </>
        )}
      </section>

      {staffModalOpen && (
        <StaffAccountModal
          initialUser={selectedUser}
          errorMessage={formError}
          saving={saving}
          onClose={handleModalClose}
          onSave={handleStaffSave}
        />
      )}
    </>
  );
}

export default AdministrationPage;
