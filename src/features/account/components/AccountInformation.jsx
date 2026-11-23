import { Activity, Mail, Shield, UserRound } from "lucide-react";

const roleLabels = {
  ADMIN: "Administrator",

  TECHNICIAN: "Technician",

  FRONT_DESK: "Front Desk",
};

function AccountInformation({ user, currentRoles }) {
  // -----------------------------
  // DISPLAYED ROLES
  // -----------------------------

  const roleText = currentRoles
    .map((role) => roleLabels[role] ?? role)
    .join(" / ");

  return (
    <section className="page-content">
      <div className="workspace-section-header">
        <div>
          <h3>Account Information</h3>

          <p className="workspace-section-description">
            Review your system account and assigned access.
          </p>
        </div>
      </div>

      <div className="account-information-grid">
        {/* USERNAME */}
        <div className="account-information-item">
          <UserRound className="account-information-icon" size={20} aria-hidden="true" />
          <span>Username</span>

          <strong>{user.username}</strong>

          <small>Managed by the Administrator</small>
        </div>

        {/* REGISTERED EMAIL */}
        <div className="account-information-item">
          <Mail className="account-information-icon" size={20} aria-hidden="true" />
          <span>Registered Email</span>

          <strong>{user.email}</strong>

          <small>Managed by the Administrator</small>
        </div>

        {/* ROLES */}
        <div className="account-information-item">
          <Shield className="account-information-icon" size={20} aria-hidden="true" />
          <span>Role(s)</span>

          <strong>{roleText}</strong>

          <small>Assigned through Administration</small>
        </div>

        {/* STATUS */}
        <div className="account-information-item">
          <Activity className="account-information-icon" size={20} aria-hidden="true" />
          <span>Account Status</span>

          <strong className={user.status === "ACTIVE" ? "account-status-active" : "account-status-inactive"}>
            {user.status === "ACTIVE" ? "Active" : "Inactive"}
          </strong>

          <small>Managed by the Administrator</small>
        </div>
      </div>
    </section>
  );
}

export default AccountInformation;
