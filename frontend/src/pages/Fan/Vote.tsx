import { useState } from "react";
import { useWallet } from "../../contexts/WalletContext";
import ProposalList from "../../components/ProposalList";
import { ProposalOnChain } from "../../types/proposal";
import { Governance__factory } from "../../typechain-types";
import { CONTRACT_ADDRESSES } from "../../constants/contracts";

const Vote = () => {
    const { signer } = useWallet();

    const [selected, setSelected] = useState<ProposalOnChain | null>(null);
    const [support, setSupport] = useState<0 | 1 | 2 | null>(null); // 0 = abstain, 1 = for, 2 = against
    const [voting, setVoting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleVote = async () => {
        if (!signer || !selected || support === null) return;

        setVoting(true);
        setError("");
        setSuccess(false);

        try {
            const gov = Governance__factory.connect(CONTRACT_ADDRESSES.Governance, signer);
            const tx = await gov.castVote(selected.id, support);
            await tx.wait();
            setSuccess(true);
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Vote failed");
        } finally {
            setVoting(false);
        }
    };

    return (
        <div style={{ padding: "2rem" }}>
            <h1>Vote on Proposal</h1>

            {!selected && (
                <>
                    <p>Select a proposal to vote on:</p>
                    <ProposalList ownedOnly={false} onSelect={(id) => setSelected({ ...selected!, id })} />
                </>
            )}

            {selected && (
                <div style={{ marginTop: "1rem", maxWidth: 400 }}>
                    <p><strong>Selected Proposal:</strong> #{selected.id.toString()}</p>

                    <label>Vote:</label><br />
                    <select
                        value={support ?? ""}
                        onChange={(e) => setSupport(Number(e.target.value) as 0 | 1 | 2)}
                        required
                        style={{ marginBottom: "1rem", width: "100%" }}
                    >
                        <option value="" disabled>Select your vote</option>
                        <option value="1">👍 For</option>
                        <option value="2">👎 Against</option>
                        <option value="0">🤷 Abstain</option>
                    </select>

                    <button onClick={handleVote} disabled={voting || support === null}>
                        {voting ? "Voting..." : "Cast Vote"}
                    </button>

                    {success && <p style={{ color: "green" }}>✅ Vote submitted successfully</p>}
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

export default Vote;
