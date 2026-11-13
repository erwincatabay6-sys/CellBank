import { useState } from "react";

export default function StaffAvatar({ name = "", profileImageUrl }) {
  const [failedUrl, setFailedUrl] = useState(null);
  const initials = name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  return (
    <span className="dashboard-technician-avatar" aria-hidden="true">
      {profileImageUrl && failedUrl !== profileImageUrl ? (
        <img src={profileImageUrl} alt="" onError={() => setFailedUrl(profileImageUrl)} />
      ) : initials}
    </span>
  );
}
