import { useProposals } from "../hooks/useProposals";
import ProposalCard from "./ProposalCard";

type Props = {
    ownedOnly?: boolean;
    onSelect?: (id: bigint) => void;
};

const ProposalList = ({ ownedOnly = false, onSelect }: Props) => {
    const { proposals, loading, error } = useProposals(ownedOnly);

    return (
        <div style={{ padding: "1rem" }}>
            <h2>{ownedOnly ? "My Proposals" : "All Proposals"}</h2>

            {loading && <p>Loading proposals...</p>}
            {error && <p style={{ color: "red" }}>{error}</p>}
            {!loading && proposals.length === 0 && <p>No proposals found.</p>}

            {proposals.map(({proposal, metadata}) => (
                <ProposalCard key={proposal.id.toString()} proposal={proposal} metadata={metadata} onSelect={onSelect} />
            ))}
        </div>
    );
};

export default ProposalList;
