import { Navigate } from "react-router-dom";

import { hasAccess }
    from "../config/accessControl.js";


function AccessGuard({
    currentRole,
    permission,
    children
}) {

    const allowed =
        hasAccess(
            currentRole,
            permission
        );


    if (!allowed) {

        return (
            <Navigate
                to="/dashboard"
                replace
            />
        );
    }


    return children;
}


export default AccessGuard;