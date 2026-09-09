import { mockUsers }
    from "../../administration/data/mockUsers.js";

import ProfileSettings
    from "../components/ProfileSettings.jsx";

import AccountInformation
    from "../components/AccountInformation.jsx";

import PasswordSettings
    from "../components/PasswordSettings.jsx";

import EmailVerificationSettings
    from "../components/EmailVerificationSettings.jsx";

import "../account.css";


function AccountSettingsPage({
    currentRoles,
    currentUserName
}) {

    // -----------------------------
    // CURRENT MOCK USER
    // -----------------------------

    const currentUser =
        mockUsers.find(
            (user) =>
                user.name ===
                    currentUserName
        );


    // -----------------------------
    // ACCOUNT NOT FOUND
    // -----------------------------

    if (!currentUser) {

        return (
            <>

                <section className="page-header">

                    <h2>
                        Account Settings
                    </h2>

                    <p>
                        Manage your personal account
                        information and security.
                    </p>

                </section>


                <section className="page-content">

                    <div className="workspace-empty-state">

                        <strong>
                            Account unavailable
                        </strong>

                        <p>
                            Your account information
                            could not be loaded.
                        </p>

                    </div>

                </section>

            </>
        );
    }


    return (
        <>

            {/* =========================
                PAGE HEADER
            ========================== */}
            <section className="page-header">

                <h2>
                    Account Settings
                </h2>

                <p>
                    Manage your personal account
                    information and security.
                </p>

            </section>


            {/* =========================
                PROFILE
            ========================== */}
            <ProfileSettings
                user={
                    currentUser
                }
            />


            {/* =========================
                ACCOUNT INFORMATION
            ========================== */}
            <AccountInformation
                user={
                    currentUser
                }
                currentRoles={
                    currentRoles
                }
            />


            {/* =========================
                CHANGE PASSWORD
            ========================== */}
            <PasswordSettings />


            {/* =========================
                EMAIL VERIFICATION
            ========================== */}
            <EmailVerificationSettings
                user={
                    currentUser
                }
            />

        </>
    );
}


export default AccountSettingsPage;