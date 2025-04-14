import { useEffect, useState } from "react";
import { useWallet } from "../contexts/WalletContext";
import { Transaction__factory, Governance__factory } from "../typechain-types";
import { CONTRACT_ADDRESSES } from "../constants/contracts";
import { ProposalOnChain } from "../types/proposal";

export function useProposals(ownedOnly = false) {
    const { provider, address } = useWallet();
    const [proposals, setProposals] = useState<ProposalOnChain[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!provider) return;

        const fetch = async () => {
            setLoading(true);
            setError(null);

            try {
                const tx = Transaction__factory.connect(CONTRACT_ADDRESSES.Transaction, provider);
                const gov = Governance__factory.connect(CONTRACT_ADDRESSES.Governance, provider);
                const result: ProposalOnChain[] = [];

                const projectIds: bigint[] = [];

                if (ownedOnly && address) {
                    const count = await tx.getProjectIdCount(address);
                    for (let i = 0n; i < count; i++) {
                        const id = await tx.projectIds(address, i);
                        projectIds.push(id);
                    }
                } else {
                    const total = await tx.projectCount();
                    for (let i = 0n; i < total; i++) {
                        projectIds.push(i);
                    }
                }

                for (const projectId of projectIds) {
                    const project = await tx.projects(projectId);
                    const milestone = await tx.getMilestone(projectId, project.currentMilestone);
                    const proposalId = milestone.proposalId;

                    if (proposalId === 0n) continue;

                    const proposal = await gov.proposals(proposalId);

                    result.push({
                        id: proposalId,
                        projectId: proposal.projectId,
                        creator: proposal.creator,
                        startBlock: proposal.startBlock,
                        endBlock: proposal.endBlock,
                        abstainVotes: proposal.abstainVotes,
                        forVotes: proposal.forVotes,
                        againstVotes: proposal.againstVotes,
                        executed: proposal.executed,
                        uri: proposal.uri,
                    });
                }

                setProposals(result);
            } catch (err: any) {
                console.error(err);
                setError(err.message || "Failed to fetch proposals");
            } finally {
                setLoading(false);
            }
        };

        fetch();
    }, [provider, address, ownedOnly]);

    return { proposals, loading, error };
}
