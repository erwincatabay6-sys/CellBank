import {
    Route,
    Routes
} from "react-router-dom";


import StaffLayout
    from "../layouts/StaffLayout.jsx";

import PublicLayout
    from "../layouts/PublicLayout.jsx";

import AccessGuard
    from "../components/AccessGuard.jsx";


import LandingPage
    from "../features/tracking/pages/LandingPage.jsx";

import TrackingPage
    from "../features/tracking/pages/TrackingPage.jsx";

import LoginPage
    from "../features/auth/pages/LoginPage.jsx";

import AccessDeniedPage
    from "../features/auth/pages/AccessDeniedPage.jsx";


import DashboardPage
    from "../features/dashboard/pages/DashboardPage.jsx";


import RepairListPage
    from "../features/repairs/pages/RepairListPage.jsx";

import NewRepairPage
    from "../features/repairs/pages/NewRepairPage.jsx";

import RepairWorkspacePage
    from "../features/repairs/pages/RepairWorkspacePage.jsx";


import CustomerListPage
    from "../features/customers/pages/CustomerListPage.jsx";

import CustomerDetailsPage
    from "../features/customers/pages/CustomerDetailsPage.jsx";

import DeviceDetailsPage
    from "../features/customers/pages/DeviceDetailsPage.jsx";


import TechnicianPage
    from "../features/technicians/pages/TechnicianPage.jsx";

import TechnicianDetailsPage
    from "../features/technicians/pages/TechnicianDetailsPage.jsx";


import ReportsPage
    from "../features/reports/pages/ReportsPage.jsx";


import AdministrationPage
    from "../features/administration/pages/AdministrationPage.jsx";


import AccountSettingsPage
    from "../features/account/pages/AccountSettingsPage.jsx";


function App() {

    // -----------------------------
    // TEMPORARY AUTHENTICATED USER
    // -----------------------------
    // These will eventually come from
    // the real authentication/session state.

    const currentRoles = [
        "ADMIN"
        
    ];


    const currentUserName =
        "Administrator";


    // -----------------------------
    // STAFF PAGE WRAPPER
    // -----------------------------

    function renderStaffPage(
        permission,
        page
    ) {

        return (
            <AccessGuard
                currentRoles={
                    currentRoles
                }
                permission={
                    permission
                }
            >

                <StaffLayout
                    currentRoles={
                        currentRoles
                    }
                    currentUserName={
                        currentUserName
                    }
                >

                    {page}

                </StaffLayout>

            </AccessGuard>
        );
    }


    return (
        <Routes>

            {/* =========================
                PUBLIC ROUTES
            ========================== */}

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


            {/* =========================
                ACCESS DENIED
                MUST REMAIN UNPROTECTED
            ========================== */}

            <Route
                path="/access-denied"
                element={
                    <PublicLayout>

                        <AccessDeniedPage
                            currentRoles={
                                currentRoles
                            }
                        />

                    </PublicLayout>
                }
            />


            {/* =========================
                DASHBOARD
            ========================== */}

            <Route
                path="/dashboard"
                element={
                    renderStaffPage(
                        "dashboard",

                        <DashboardPage
                            currentRoles={
                                currentRoles
                            }
                            currentUserName={
                                currentUserName
                            }
                        />
                    )
                }
            />


            {/* =========================
                REPAIRS
            ========================== */}

            <Route
                path="/repairs"
                element={
                    renderStaffPage(
                        "repairs",

                        <RepairListPage
                            currentRoles={
                                currentRoles
                            }
                        />
                    )
                }
            />


            <Route
                path="/repairs/new"
                element={
                    renderStaffPage(
                        "createRepair",

                        <NewRepairPage />
                    )
                }
            />


            <Route
                path="/repairs/:repairId"
                element={
                    renderStaffPage(
                        "repairs",

                        <RepairWorkspacePage
                            currentRoles={
                                currentRoles
                            }
                        />
                    )
                }
            />


            {/* =========================
                CUSTOMERS & DEVICES
            ========================== */}

            <Route
                path="/customers"
                element={
                    renderStaffPage(
                        "customers",

                        <CustomerListPage />
                    )
                }
            />


            <Route
                path="/customers/:customerId"
                element={
                    renderStaffPage(
                        "customers",

                        <CustomerDetailsPage />
                    )
                }
            />


            <Route
                path="/customers/:customerId/devices/:deviceId"
                element={
                    renderStaffPage(
                        "customers",

                        <DeviceDetailsPage />
                    )
                }
            />


            {/* =========================
                TECHNICIANS
            ========================== */}

            <Route
                path="/technicians"
                element={
                    renderStaffPage(
                        "technicians",

                        <TechnicianPage />
                    )
                }
            />


            <Route
                path="/technicians/:technicianId"
                element={
                    renderStaffPage(
                        "technicians",

                        <TechnicianDetailsPage />
                    )
                }
            />


            {/* =========================
                REPORTS
            ========================== */}

            <Route
                path="/reports"
                element={
                    renderStaffPage(
                        "reports",

                        <ReportsPage />
                    )
                }
            />


            {/* =========================
                ADMINISTRATION
            ========================== */}

            <Route
                path="/administration"
                element={
                    renderStaffPage(
                        "administration",

                        <AdministrationPage />
                    )
                }
            />


            {/* =========================
                ACCOUNT SETTINGS
            ========================== */}

            <Route
                path="/account"
                element={
                    renderStaffPage(
                        "accountSettings",

                        <AccountSettingsPage />
                    )
                }
            />

        </Routes>
    );
}


export default App;