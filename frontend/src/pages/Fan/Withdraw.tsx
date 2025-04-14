import React, { useState } from "react";
import { useWallet } from "../../contexts/WalletContext";
import { Transaction__factory } from "../../typechain-types";
import { CONTRACT_ADDRESSES } from "../../constants/contracts";
import { useNavigate } from "react-router-dom";
import ProjectList from "../../components/ProjectList";
import { ProjectOnChain } from "../../types/project";

const Withdraw = () => {
    const { signer } = useWallet();
    const navigate = useNavigate();

    const [selected, setSelected] = useState<ProjectOnChain | null>(null);
    const [withdrawing, setWithdrawing] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleWithdraw = async () => {
        if (!signer || !selected) return;

        setWithdrawing(true);
        setError("");
        setSuccess(false);

        try {
            const tx = Transaction__factory.connect(CONTRACT_ADDRESSES.Transaction, signer);
            const withdrawTx = await tx.withdraw(selected.id);
            await withdrawTx.wait();
            setSuccess(true);
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Withdraw failed");
        } finally {
            setWithdrawing(false);
        }
    };

    return (
        <div style={{ padding: "2rem" }}>
            <button onClick={() => navigate("/")}>← Back to Home</button>
            <h1>Withdraw Contributions</h1>

            {!selected && (
                <>
                    <p>Select a project you contributed to:</p>
                    <ProjectList
                        ownedOnly={false}
                        contributedOnly={true}
                        onSelect={(id) => setSelected({ ...selected!, id })}
                    />
                </>
            )}

            {selected && (
                <div style={{ marginTop: "1rem" }}>
                    <p><strong>Selected Project:</strong> #{selected.id.toString()}</p>

                    <button onClick={handleWithdraw} disabled={withdrawing}>
                        {withdrawing ? "Withdrawing..." : "Withdraw ETH"}
                    </button>

                    {success && <p style={{ color: "green" }}>✅ Withdraw successful</p>}
                    {error && <p style={{ color: "red" }}>{error}</p>}

                    <br />
                    <button onClick={() => setSelected(null)} style={{ marginTop: "1rem" }}>
                        ← Change Project
                    </button>
                </div>
            )}
        </div>
    );
};

export default Withdraw;
