import { useState } from "react";

import {
    Plus,
    Search
} from "lucide-react";


import StaffTable
    from "../components/StaffTable.jsx";

import StaffAccountModal
    from "../components/StaffAccountModal.jsx";

import { mockUsers }
    from "../data/mockUsers.js";

import "../administration.css";


function AdministrationPage() {

    // -----------------------------
    // STAFF STATE
    // -----------------------------

    const [users, setUsers] =
        useState(mockUsers);


    // -----------------------------
    // FILTER STATE
    // -----------------------------

    const [searchTerm, setSearchTerm] =
        useState("");

    const [roleFilter, setRoleFilter] =
        useState("ALL");

    const [statusFilter, setStatusFilter] =
        useState("ALL");


    // -----------------------------
    // MODAL STATE
    // -----------------------------

    const [
        staffModalOpen,
        setStaffModalOpen
    ] = useState(false);

    const [
        selectedUser,
        setSelectedUser
    ] = useState(null);

    const [
        formError,
        setFormError
    ] = useState("");


    // -----------------------------
    // FILTERED STAFF
    // -----------------------------

    const filteredUsers =
        users.filter((user) => {

            const search =
                searchTerm
                    .trim()
                    .toLowerCase();


            const matchesSearch =
                user.name
                    .toLowerCase()
                    .includes(search) ||

                user.username
                    .toLowerCase()
                    .includes(search) ||

                user.email
                    .toLowerCase()
                    .includes(search);


            const matchesRole =
                roleFilter === "ALL" ||
                user.roles.includes(
                    roleFilter
                );


            const matchesStatus =
                statusFilter === "ALL" ||
                user.status ===
                    statusFilter;


            return (
                matchesSearch &&
                matchesRole &&
                matchesStatus
            );
        });


    // -----------------------------
    // ACCOUNT VALIDATION
    // -----------------------------

    function validateStaffAccount(
        userData,
        ignoredUserId = null
    ) {

        const normalizedUsername =
            userData.username
                .trim()
                .toLowerCase();


        const normalizedEmail =
            userData.email
                .trim()
                .toLowerCase();


        const duplicateUsername =
            users.some(
                (user) =>
                    user.id !== ignoredUserId &&
                    user.username
                        .toLowerCase() ===
                        normalizedUsername
            );


        if (duplicateUsername) {

            return (
                "That username is already used " +
                "by another staff account."
            );
        }


        const duplicateEmail =
            users.some(
                (user) =>
                    user.id !== ignoredUserId &&
                    user.email
                        .toLowerCase() ===
                        normalizedEmail
            );


        if (duplicateEmail) {

            return (
                "That email address is already used " +
                "by another staff account."
            );
        }


        if (
            !userData.roles ||
            userData.roles.length === 0
        ) {

            return (
                "A staff account must have " +
                "at least one role."
            );
        }


        return "";
    }


    // -----------------------------
    // CREATE STAFF
    // -----------------------------

    function handleNewStaff() {

        setSelectedUser(null);

        setFormError("");

        setStaffModalOpen(true);
    }


    function handleCreateStaff(
        newUser
    ) {

        const validationError =
            validateStaffAccount(
                newUser
            );


        if (validationError) {

            setFormError(
                validationError
            );

            return;
        }


        const userWithId = {
            id:
                Date.now(),

            name:
                newUser.name,

            username:
                newUser.username,

            email:
                newUser.email,

            roles:
                newUser.roles,

            status:
                "ACTIVE"
        };


        setUsers((currentUsers) => [
            ...currentUsers,
            userWithId
        ]);


        setStaffModalOpen(false);

        setSelectedUser(null);

        setFormError("");
    }


    // -----------------------------
    // EDIT STAFF
    // -----------------------------

    function handleUserClick(userId) {

        const user =
            users.find(
                (user) =>
                    user.id === userId
            );


        if (!user) {
            return;
        }


        setSelectedUser(user);

        setFormError("");

        setStaffModalOpen(true);
    }


    function handleUpdateStaff(
        updatedUser
    ) {

        if (!selectedUser) {
            return;
        }


        const validationError =
            validateStaffAccount(
                updatedUser,
                selectedUser.id
            );


        if (validationError) {

            setFormError(
                validationError
            );

            return;
        }


        const removingAdminRole =
            selectedUser.roles.includes(
                "ADMIN"
            ) &&
            !updatedUser.roles.includes(
                "ADMIN"
            );


        if (removingAdminRole) {

            const otherActiveAdmins =
                users.filter(
                    (user) =>
                        user.id !==
                            selectedUser.id &&

                        user.status ===
                            "ACTIVE" &&

                        user.roles.includes(
                            "ADMIN"
                        )
                );


            if (
                selectedUser.status ===
                    "ACTIVE" &&
                otherActiveAdmins.length === 0
            ) {

                setFormError(
                    "At least one active administrator " +
                    "must remain in the system."
                );

                return;
            }
        }


        setUsers((currentUsers) =>
            currentUsers.map(
                (user) =>
                    user.id === selectedUser.id
                        ? {
                            ...user,

                            name:
                                updatedUser.name,

                            username:
                                updatedUser.username,

                            email:
                                updatedUser.email,

                            roles:
                                updatedUser.roles
                        }
                        : user
            )
        );


        setStaffModalOpen(false);

        setSelectedUser(null);

        setFormError("");
    }


    // -----------------------------
    // ACCOUNT ACCESS
    // -----------------------------

    function handleToggleStatus(userId) {

        const user =
            users.find(
                (user) =>
                    user.id === userId
            );


        if (!user) {
            return;
        }


        const isActiveAdmin =
            user.status === "ACTIVE" &&
            user.roles.includes("ADMIN");


        if (isActiveAdmin) {

            const otherActiveAdmins =
                users.filter(
                    (otherUser) =>
                        otherUser.id !== user.id &&
                        otherUser.status ===
                            "ACTIVE" &&
                        otherUser.roles.includes(
                            "ADMIN"
                        )
                );


            if (
                otherActiveAdmins.length === 0
            ) {

                setFormError(
                    "The last active administrator " +
                    "cannot be deactivated."
                );

                return;
            }
        }


        setUsers((currentUsers) =>
            currentUsers.map(
                (currentUser) => {

                    if (
                        currentUser.id !== userId
                    ) {
                        return currentUser;
                    }


                    return {
                        ...currentUser,

                        status:
                            currentUser.status ===
                                "ACTIVE"
                                ? "INACTIVE"
                                : "ACTIVE"
                    };
                }
            )
        );


        setFormError("");
    }


    // -----------------------------
    // MODAL
    // -----------------------------

    function handleModalClose() {

        setStaffModalOpen(false);

        setSelectedUser(null);

        setFormError("");
    }


    function handleStaffSave(userData) {

        if (selectedUser) {

            handleUpdateStaff(
                userData
            );

            return;
        }


        handleCreateStaff(
            userData
        );
    }


    return (
        <>

            {/* =========================
                PAGE HEADER
            ========================== */}
            <section className="page-header">

                <h2>
                    Administration
                </h2>

                <p>
                    Manage staff accounts,
                    roles, and system access.
                </p>

            </section>


            {/* =========================
                STAFF ACCOUNTS
            ========================== */}
            <section className="page-content">

                <div className="workspace-section-header">

                    <div>

                        <h3>
                            Staff Accounts
                        </h3>

                        <p className="workspace-section-description">
                            View and manage authorized
                            staff accounts.
                        </p>

                    </div>


                    <button
                        className="create-repair-button"
                        type="button"
                        onClick={
                            handleNewStaff
                        }
                    >
                        <Plus size={18} />

                        <span>
                            New Staff Account
                        </span>
                    </button>

                </div>


                {/* =========================
                    FILTERS
                ========================== */}
                <div className="administration-filters">

                    <div className="administration-search">

                        <Search size={18} />

                        <input
                            type="search"
                            value={searchTerm}
                            onChange={(event) =>
                                setSearchTerm(
                                    event.target.value
                                )
                            }
                            placeholder="Search staff..."
                        />

                    </div>


                    <select
                        value={roleFilter}
                        onChange={(event) =>
                            setRoleFilter(
                                event.target.value
                            )
                        }
                    >

                        <option value="ALL">
                            All Roles
                        </option>

                        <option value="ADMIN">
                            Admin
                        </option>

                        <option value="TECHNICIAN">
                            Technician
                        </option>

                        <option value="FRONT_DESK">
                            Front Desk
                        </option>

                    </select>


                    <select
                        value={statusFilter}
                        onChange={(event) =>
                            setStatusFilter(
                                event.target.value
                            )
                        }
                    >

                        <option value="ALL">
                            All Statuses
                        </option>

                        <option value="ACTIVE">
                            Active
                        </option>

                        <option value="INACTIVE">
                            Inactive
                        </option>

                    </select>

                </div>


                {/* =========================
                    ACCESS ERROR
                ========================== */}
                {!staffModalOpen &&
                    formError && (

                    <div className="administration-error">

                        {formError}

                    </div>

                )}


                {/* =========================
                    RESULT COUNT
                ========================== */}
                <div className="administration-result-count">

                    Showing{" "}

                    <strong>
                        {filteredUsers.length}
                    </strong>

                    {" "}of{" "}

                    <strong>
                        {users.length}
                    </strong>

                    {" "}staff accounts

                </div>


                {/* =========================
                    STAFF TABLE
                ========================== */}
                {filteredUsers.length > 0 ? (

                    <StaffTable
                        users={
                            filteredUsers
                        }
                        onUserClick={
                            handleUserClick
                        }
                        onToggleStatus={
                            handleToggleStatus
                        }
                    />

                ) : (

                    <div className="workspace-empty-state">

                        <strong>
                            No staff accounts found
                        </strong>

                        <p>
                            Try changing the search
                            or account filters.
                        </p>

                    </div>

                )}

            </section>


            {/* =========================
                STAFF ACCOUNT MODAL
            ========================== */}
            {staffModalOpen && (

                <StaffAccountModal
                    initialUser={
                        selectedUser
                    }
                    errorMessage={
                        formError
                    }
                    onClose={
                        handleModalClose
                    }
                    onSave={
                        handleStaffSave
                    }
                />

            )}

        </>
    );
}


export default AdministrationPage;