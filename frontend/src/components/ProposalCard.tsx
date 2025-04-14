import React from "react";
import { ProposalOnChain } from "../types/proposal";

type Props = {
    proposal: ProposalOnChain;
    onSelect?: (id: bigint) => void;
};

const ProposalCard = ({ proposal, onSelect }: Props) => {
    const totalVotes = proposal.forVotes + proposal.againstVotes + proposal.abstainVotes;
    const status = proposal.executed ? "✅ Executed" : "⏳ Pending";

    return (
        <div
            style={{
                border: "1px solid #999",
                borderRadius: "8px",
                padding: "1rem",
                marginBottom: "1rem",
                cursor: onSelect ? "pointer" : "default",
            }}
            onClick={() => onSelect?.(proposal.id)}
        >
            <h4>Proposal #{proposal.id.toString()}</h4>
            <p><strong>Project:</strong> {proposal.projectId.toString()}</p>
            <p><strong>Creator:</strong> {proposal.creator}</p>
            <p><strong>Status:</strong> {status}</p>
            <p><strong>Start Block:</strong> {proposal.startBlock.toString()}</p>
            <p><strong>End Block:</strong> {proposal.endBlock.toString()}</p>
            <p><strong>Votes:</strong> {totalVotes.toString()}</p>
            <ul>
                <li>👍 For: {proposal.forVotes.toString()}</li>
                <li>👎 Against: {proposal.againstVotes.toString()}</li>
                <li>🤷 Abstain: {proposal.abstainVotes.toString()}</li>
            </ul>
        </div>
    );
};

export default ProposalCard;
