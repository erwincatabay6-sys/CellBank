import { useState } from "react";
import { useLocation } from "react-router-dom";

import Header from "../components/Header.jsx";
import Sidebar from "../components/Sidebar.jsx";

function StaffLayout({ children, currentRoles, currentUserName }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();

  function toggleSidebar() {
    setSidebarCollapsed((collapsed) => !collapsed);
  }

  return (
    <div className="staff-layout">
      <Header
        currentRoles={currentRoles}
        currentUserName={currentUserName}
      />

      <div className="staff-body">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={toggleSidebar}
          currentRoles={currentRoles}
          currentUserName={currentUserName}
        />

        <main
          key={location.pathname}
          className="main-content page-transition"
        >
          {children}
        </main>
      </div>
    </div>
  );
}

export default StaffLayout;
