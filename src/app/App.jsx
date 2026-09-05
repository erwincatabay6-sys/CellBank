import { Route, Routes } from "react-router-dom";

import StaffLayout from "../layouts/StaffLayout.jsx";
import PublicLayout from "../layouts/PublicLayout.jsx";

import LandingPage from "../features/tracking/pages/LandingPage.jsx";
import TrackingPage from "../features/tracking/pages/TrackingPage.jsx";
import LoginPage from "../features/auth/pages/LoginPage.jsx";
import DashboardPage from "../features/dashboard/pages/DashboardPage.jsx";
import RepairListPage from "../features/repairs/pages/RepairListPage.jsx";
import CustomerListPage from "../features/customers/pages/CustomerListPage.jsx";
import TechnicianPage from "../features/technicians/pages/TechnicianPage.jsx";
import ReportsPage from "../features/reports/pages/ReportsPage.jsx";
import AdministrationPage from "../features/administration/pages/AdministrationPage.jsx";
import AccountSettingsPage from "../features/account/pages/AccountSettingsPage.jsx";
import NewRepairPage from "../features/repairs/pages/NewRepairPage.jsx";
import RepairWorkspacePage from "../features/repairs/pages/RepairWorkspacePage.jsx";
import CustomerDetailsPage from "../features/customers/pages/CustomerDetailsPage.jsx";
import DeviceDetailsPage from "../features/customers/pages/DeviceDetailsPage.jsx";
import TechnicianDetailsPage from "../features/technicians/pages/TechnicianDetailsPage.jsx";

function App() {
    return (
        <Routes>

            <Route
                path="/"
                element={
                    <PublicLayout>
                        <LandingPage />
                    </PublicLayout>
                }
            />

            <Route
                path="/track"
                element={
                    <PublicLayout>
                        <TrackingPage />
                    </PublicLayout>
                }
            />

            <Route
                path="/login"
                element={
                    <PublicLayout>
                        <LoginPage />
                    </PublicLayout>
                }
            />

            <Route
                path="/dashboard"
                element={
                    <StaffLayout>
                        <DashboardPage />
                    </StaffLayout>
                }
            />

            <Route
                path="/repairs"
                element={
                    <StaffLayout>
                        <RepairListPage />
                    </StaffLayout>
                }
            />

            <Route
                path="/customers"
                element={
                    <StaffLayout>
                        <CustomerListPage />
                    </StaffLayout>
                }
            />

            <Route
                path="/customers/:customerId"
                element={<CustomerDetailsPage />}
            />

            <Route
                path="/technicians"
                element={
                    <StaffLayout>
                        <TechnicianPage />
                    </StaffLayout>
                }
            />

            <Route
                path="/reports"
                element={
                    <StaffLayout>
                        <ReportsPage />
                    </StaffLayout>
                }
            />

            <Route
                path="/administration"
                element={
                    <StaffLayout>
                        <AdministrationPage />
                    </StaffLayout>
                }
            />

            <Route
                path="/account"
                element={
                    <StaffLayout>
                        <AccountSettingsPage />
                    </StaffLayout>
                }
            />

            <Route
                path="/repairs/new"
                element={
                    <StaffLayout>
                        <NewRepairPage />
                    </StaffLayout>
                }
            />


            <Route
                path="/repairs/:repairId"
                element={
                    <StaffLayout>
                        <RepairWorkspacePage />
                    </StaffLayout>
                }
            />

            <Route
                path="/customers/:customerId/devices/:deviceId"
                element={<DeviceDetailsPage />}
            />

            <Route
                path="/technicians/:technicianId"
                element={<TechnicianDetailsPage />}
            />

        </Routes>
    );
}

export default App;