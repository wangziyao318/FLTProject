import { useState } from "react";
import { useWallet } from "../../contexts/WalletContext";
import { Transaction__factory } from "../../typechain-types";
import { CONTRACT_ADDRESSES } from "../../constants/contracts";
import ProjectList from "../../components/ProjectList";
import { ProjectOnChain } from "../../types/project";

const Contribute = () => {
    const { signer } = useWallet();

    const [selected, setSelected] = useState<ProjectOnChain | null>(null);
    const [ethAmount, setEthAmount] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleContribute = async () => {
        if (!signer || !selected || !ethAmount) return;

        setSubmitting(true);
        setError("");
        setSuccess(false);

        try {
            const tx = Transaction__factory.connect(CONTRACT_ADDRESSES.Transaction, signer);
            const wei = BigInt(Math.floor(Number(ethAmount) * 1e18));

            const contributeTx = await tx.contribute(selected.id, { value: wei });
            await contributeTx.wait();

            setSuccess(true);
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Contribution failed");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={{ padding: "2rem" }}>
            <h1>Contribute to a Project</h1>

            {!selected && (
                <>
                    <p>Select a project to contribute:</p>
                    <ProjectList ownedOnly={false} onSelect={(id) => setSelected({ ...selected!, id })} />
                </>
            )}

            {selected && (
                <div style={{ maxWidth: 400 }}>
                    <p><strong>Selected Project:</strong> #{selected.id.toString()}</p>

                    <label>Amount (ETH):</label><br />
                    <input
                        type="number"
                        value={ethAmount}
                        onChange={(e) => setEthAmount(e.target.value)}
                        min="0.01"
                        step="0.01"
                        style={{ width: "100%", marginBottom: "1rem" }}
                        required
                    />

                    <button onClick={handleContribute} disabled={submitting}>
                        {submitting ? "Contributing..." : "Contribute"}
                    </button>

                    {success && <p style={{ color: "green" }}>✅ Contribution successful</p>}
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

export default Contribute;
