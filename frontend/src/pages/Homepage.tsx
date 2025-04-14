import React, { useState } from "react";
import ConnectButton from "../components/ConnectButton";
import RoleTabs from "../components/RoleTabs";

const HomePage = () => {
    const [role, setRole] = useState<"creator" | "fan">("creator");

    return (
        <div style={{ padding: "2rem" }}>
            <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>
                🎨 Welcome to the Crowdfunding dApp
            </h1>

            <ConnectButton />
            <RoleTabs role={role} setRole={setRole} />

            {role === "creator" ? (
                <div>
                    <h2>👩‍🎨 Creator Actions</h2>
                    <ul>
                        <li><a href="/creator/create">Create Project</a></li>
                        <li><a href="/creator/cancel">Cancel Project</a></li>
                        <li><a href="/creator/submit">Submit Milestone</a></li>
                        <li><a href="/creator/execute">Execute Proposal</a></li>
                    </ul>
                </div>
            ) : (
                <div>
                    <h2>🧑‍💻 Fan Actions</h2>
                    <ul>
                        <li><a href="/fan/contribute">Contribute to Project</a></li>
                        <li><a href="/fan/withdraw">Withdraw Contribution</a></li>
                        <li><a href="/fan/vote">Vote on Proposal</a></li>
                    </ul>
                </div>
            )}
        </div>
    );
};

export default HomePage;
