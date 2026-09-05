import { useState } from "react";

import Header from "../components/Header.jsx";
import Sidebar from "../components/Sidebar.jsx";

function StaffLayout({ 
    children,
    currentRole,
    currentUserName 
}) {

    const [sidebarCollapsed, setSidebarCollapsed] =
        useState(false);

    function toggleSidebar() {
        setSidebarCollapsed(!sidebarCollapsed);
    }

    return (
        <div className="staff-layout">

            <Header />

            <div className="staff-body">

                <Sidebar
                    collapsed={sidebarCollapsed}
                    onToggle={toggleSidebar}
                    currentRole={currentRole}
                    currentUserName={currentUserName}
                />

                <main className="main-content">
                    {children}
                </main>

            </div>

        </div>
    );
}

export default StaffLayout;