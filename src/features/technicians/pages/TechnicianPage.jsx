import { useState } from "react";

import { useNavigate }
    from "react-router-dom";

import { Search }
    from "lucide-react";


import TechnicianTable
    from "../components/TechnicianTable.jsx";

import { mockTechnicians }
    from "../data/mockTechnicians.js";

import { mockRepairs }
    from "../../repairs/data/mockRepairs.js";

import "../technicians.css";


const terminalStatuses = [
    "COMPLETED",
    "CANCELLED"
];


function TechnicianPage() {

    const navigate =
        useNavigate();


    // -----------------------------
    // PAGE STATE
    // -----------------------------

    const [searchTerm, setSearchTerm] =
        useState("");


    // -----------------------------
    // TECHNICIAN WORKLOAD
    // -----------------------------

    const techniciansWithWorkload =
        mockTechnicians.map((technician) => {

            const assignedRepairs =
                mockRepairs.filter(
                    (repair) =>
                        repair.technicianId === technician.id
                );


            const activeRepairs =
                assignedRepairs.filter(
                    (repair) =>
                        !terminalStatuses.includes(
                            repair.status
                        )
                );


            return {
                ...technician,

                activeRepairs:
                    activeRepairs.length,

                totalRepairs:
                    assignedRepairs.length
            };
        });


    // -----------------------------
    // SEARCH
    // -----------------------------

    const filteredTechnicians =
        techniciansWithWorkload.filter(
            (technician) => {

                const search =
                    searchTerm
                        .trim()
                        .toLowerCase();


                return (
                    technician.name
                        .toLowerCase()
                        .includes(search) ||

                    technician.status
                        .toLowerCase()
                        .includes(search)
                );
            }
        );


    // -----------------------------
    // NAVIGATION
    // -----------------------------

    function handleTechnicianClick(
        technicianId
    ) {

        navigate(
            `/technicians/${technicianId}`
        );
    }


    return (
        <>

            {/* =========================
                PAGE HEADER
            ========================== */}
            <section className="page-header">

                <h2>
                    Technicians
                </h2>

                <p>
                    View technician workload
                    and assigned repair jobs.
                </p>

            </section>


            {/* =========================
                TECHNICIAN LIST
            ========================== */}
            <section className="page-content">

                <div className="technician-toolbar">

                    <div className="technician-search">

                        <Search size={18} />

                        <input
                            type="search"
                            value={searchTerm}
                            onChange={(event) =>
                                setSearchTerm(
                                    event.target.value
                                )
                            }
                            placeholder="Search technicians..."
                        />

                    </div>

                </div>


                {filteredTechnicians.length > 0 ? (

                    <TechnicianTable
                        technicians={
                            filteredTechnicians
                        }
                        onTechnicianClick={
                            handleTechnicianClick
                        }
                    />

                ) : (

                    <div className="workspace-empty-state">

                        <strong>
                            No technicians found
                        </strong>

                        <p>
                            Try another technician search.
                        </p>

                    </div>

                )}

            </section>

        </>
    );
}


export default TechnicianPage;