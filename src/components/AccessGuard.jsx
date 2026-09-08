import { Navigate }
    from "react-router-dom";

import { hasAccess }
    from "../config/accessControl.js";


function AccessGuard({
    currentRoles,
    permission,
    children
}) {

    const allowed =
        hasAccess(
            currentRoles,
            permission
        );


    if (!allowed) {

        return (
            <Navigate
                to="/access-denied"
                replace
            />
        );
    }


    return children;
}


export default AccessGuard;