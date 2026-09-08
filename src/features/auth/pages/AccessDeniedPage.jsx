import { useNavigate }
    from "react-router-dom";

import { ShieldX }
    from "lucide-react";

import { hasAccess }
    from "../../../config/accessControl.js";


function AccessDeniedPage({
    currentRoles
}) {

    const navigate =
        useNavigate();


    // -----------------------------
    // SAFE RETURN DESTINATION
    // -----------------------------

    const canViewDashboard =
        hasAccess(
            currentRoles,
            "dashboard"
        );


    function handleReturn() {

        if (canViewDashboard) {

            navigate(
                "/dashboard"
            );

            return;
        }


        navigate(
            "/login"
        );
    }


    return (
        <section className="page-content">

            <div className="workspace-empty-state">

                <ShieldX
                    size={40}
                />


                <strong>
                    Access Denied
                </strong>


                <p>
                    You do not have permission
                    to access this page.
                </p>


                <button
                    className="create-repair-button"
                    type="button"
                    onClick={
                        handleReturn
                    }
                >
                    {canViewDashboard
                        ? "Back to Dashboard"
                        : "Return to Login"
                    }
                </button>

            </div>

        </section>
    );
}


export default AccessDeniedPage;