import { useState } from "react";
import { useWallet } from "../../contexts/WalletContext";
import { Governance__factory } from "../../typechain-types";
import { CONTRACT_ADDRESSES } from "../../constants/contracts";
import ProposalList from "../../components/ProposalList";
import { ProposalOnChain } from "../../types/proposal";
import Slogan from "components/Slogan";

const ExecuteProposal = () => {
    const { signer } = useWallet();

    const [selected, setSelected] = useState<ProposalOnChain | null>(null);
    const [executing, setExecuting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleExecute = async () => {
        if (!signer || !selected) return;
        setExecuting(true);
        setError("");
        setSuccess(false);

        try {
            const gov = Governance__factory.connect(CONTRACT_ADDRESSES.Governance, signer);
            const tx = await gov.execute(selected.id);
            await tx.wait();
            setSuccess(true);
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Execution failed");
        } finally {
            setExecuting(false);
        }
    };

    return (
        <div style={{ padding: "2rem" }}>
            <Slogan text1="Execute Proposal" text2="" />

            {!selected && (
                <>
                    <p>Select a proposal from your projects to execute:</p>
                    <ProposalList ownedOnly={true} onSelect={(id) => setSelected({ ...selected!, id })} />
                </>
            )}

            {selected && (
                <div style={{ marginTop: "1rem" }}>
                    <p><strong>Selected Proposal:</strong> #{selected.id.toString()}</p>

                    <button onClick={handleExecute} disabled={executing}>
                        {executing ? "Executing..." : "Execute Proposal"}
                    </button>

                    {success && <p style={{ color: "green" }}>✅ Executed successfully</p>}
                    {error && <p style={{ color: "red" }}>{error}</p>}

                    <br />
                    <button onClick={() => setSelected(null)} style={{ marginTop: "1rem" }}>
                        ← Change Proposal
                    </button>
                </div>
            )}
        </div>
    );
};

export default ExecuteProposal;
