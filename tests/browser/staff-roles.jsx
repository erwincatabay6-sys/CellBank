import React from "react";
import { createRoot } from "react-dom/client";
import StaffAccountModal from "../../src/features/administration/components/StaffAccountModal.jsx";
import "../../src/styles/global.css";
import "../../src/styles/layout.css";
const role = new URLSearchParams(location.search).get("role");
const initialUser = role ? {name: "Local staff", username: "local", email: "local@example.test", roles: role.split(",")} : null;
createRoot(document.getElementById("root")).render(
  <StaffAccountModal initialUser={initialUser} onClose={() => {}} onSave={(data) => { window.savedStaff = data; }} />,
);
