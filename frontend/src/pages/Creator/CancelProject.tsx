import { useState } from "react";
import { useWallet } from "../../contexts/WalletContext";
import { Transaction__factory } from "../../typechain-types";
import { CONTRACT_ADDRESSES } from "../../constants/contracts";
import ProjectList from "../../components/ProjectList";
import { ProjectOnChain } from "../../types/project";
import Slogan from "components/Slogan";

const CancelProject = () => {
    const { signer } = useWallet();

    const [selected, setSelected] = useState<ProjectOnChain | null>(null);
    const [canceling, setCanceling] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleCancel = async () => {
        if (!signer || !selected) return;

        setCanceling(true);
        setError("");
        setSuccess(false);

        try {
            const tx = Transaction__factory.connect(CONTRACT_ADDRESSES.Transaction, signer);
            const cancelTx = await tx.cancelProject(selected.id);
            await cancelTx.wait();
            setSuccess(true);
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Cancellation failed");
        } finally {
            setCanceling(false);
        }
    };

    return (
        <div style={{ padding: "2rem" }}>
            <Slogan text1="Cancel Project" text2=""/>

            {!selected && (
                <>
                    <p>Select a project you want to cancel:</p>
                    <ProjectList ownedOnly={true} onSelect={(id) => setSelected({ ...selected!, id })} />
                </>
            )}

            {selected && (
                <div style={{ marginTop: "1rem" }}>
                    <p><strong>Selected Project:</strong> #{selected.id.toString()}</p>

                    <button onClick={handleCancel} disabled={canceling}>
                        {canceling ? "Canceling..." : "Cancel Project"}
                    </button>

                    {success && <p style={{ color: "green" }}>✅ Project canceled successfully</p>}
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

export default CancelProject;
