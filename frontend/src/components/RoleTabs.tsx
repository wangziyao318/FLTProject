import React from "react";

type Props = {
    role: "creator" | "fan";
    setRole: (role: "creator" | "fan") => void;
};

const RoleTabs = ({ role, setRole }: Props) => {
    return (
        <div style={{ marginBottom: "1.5rem" }}>
            <button
                onClick={() => setRole("creator")}
                style={{
                    marginRight: "1rem",
                    fontWeight: role === "creator" ? "bold" : "normal"
                }}
            >
                I’m a Creator
            </button>
            <button
                onClick={() => setRole("fan")}
                style={{
                    fontWeight: role === "fan" ? "bold" : "normal"
                }}
            >
                I’m a Fan
            </button>
        </div>
    );
};

export default RoleTabs;
