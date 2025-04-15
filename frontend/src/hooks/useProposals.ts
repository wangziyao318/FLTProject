import { useEffect, useState } from "react";
import { useWallet } from "../contexts/WalletContext";
import { Transaction__factory, Governance__factory } from "../typechain-types";
import { CONTRACT_ADDRESSES } from "../constants/contracts";
import { ProposalOnChain } from "../types/proposal";
import { downloadJSONFromIPFS } from "../utils/ipfs";
import { MilestoneMetadata } from "types/milestone";

export function useProposals(ownedOnly = false) {
    const { provider, address } = useWallet();
    const [proposals, setProposals] = useState<{proposal:ProposalOnChain; metadata: MilestoneMetadata}[]>([]);
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
                const results: {proposal:ProposalOnChain; metadata: MilestoneMetadata}[] = [];

                const projectIds: bigint[] = [];

                if (ownedOnly && address) {
                    const count = await tx.getProjectIdCount(address);
                    for (let i = 0n; i < count; i++) {
                        const id = await tx.projectIds(address, i);
                        projectIds.push(id);
                    }
                } else {
                    const total = await tx.projectCount();
                    for (let i = 1n; i <= total; i++) { // id=0 reserved
                        projectIds.push(i);
                    }
                }

                for (const projectId of projectIds) {
                    const project = await tx.projects(projectId);
                    let milestone = null;
                    try {
                        milestone = await tx.getMilestone(projectId, project.currentMilestone);
                    } catch (err) {
                        continue;
                    }
                    
                    const proposalId = milestone.proposalId;

                    if (proposalId === 0n) continue;
                    if (milestone.status !== 3n) continue;

                    const rawProposal = await gov.proposals(proposalId);
                    const metadata = await downloadJSONFromIPFS<MilestoneMetadata>(milestone.uri);

                    results.push({
                        proposal: {
                            id: proposalId,
                            projectId: rawProposal.projectId,
                            creator: rawProposal.creator,
                            startBlock: rawProposal.startBlock,
                            endBlock: rawProposal.endBlock,
                            abstainVotes: rawProposal.abstainVotes,
                            forVotes: rawProposal.forVotes,
                            againstVotes: rawProposal.againstVotes,
                            executed: rawProposal.executed,
                            uri: rawProposal.uri,
                        },
                        metadata: metadata
                    });
                }

                setProposals(results);
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
