import { useEffect, useState } from "react";
import { useWallet } from "../contexts/WalletContext";
import { ProjectOnChain, ProjectMetadata } from "../types/project";
import { downloadJSONFromIPFS } from "../utils/ipfs";
import { Transaction__factory } from "../typechain-types";
import { CONTRACT_ADDRESSES } from "../constants/contracts";

export function useProjects(ownedOnly = false) {
    const { provider, address } = useWallet();
    const [projects, setProjects] = useState<{ project: ProjectOnChain; metadata: ProjectMetadata }[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!provider) return;

        const fetch = async () => {
            setLoading(true);
            setError(null);

            try {
                const tx = Transaction__factory.connect(CONTRACT_ADDRESSES.Transaction, provider);
                const results: { project: ProjectOnChain; metadata: ProjectMetadata }[] = [];

                if (ownedOnly && address) {
                    const count: bigint = await tx.getProjectIdCount(address);
                    for (let i = 0n; i < count; i++) {
                        const id = await tx.projectIds(address, i);
                        const raw = await tx.projects(id);
                        const metadata = await downloadJSONFromIPFS<ProjectMetadata>(raw.uri);
                        results.push({
                            project: {
                                id,
                                creator: raw.creator,
                                targetFunds: raw.targetFunds,
                                totalFunds: raw.totalFunds,
                                totalMilestones: Number(raw.totalMilestones),
                                currentMilestone: Number(raw.currentMilestone),
                                campaignEnded: raw.campaignEnded,
                                cancelled: raw.cancelled,
                                completed: raw.completed,
                                uri: raw.uri,
                            },
                            metadata,
                        });
                    }
                } else {
                    const count: bigint = await tx.projectCount();
                    for (let i = 1n; i <= count; i++) { // id==0 is reserved
                        const raw = await tx.projects(i);
                        const metadata = await downloadJSONFromIPFS<ProjectMetadata>(raw.uri);
                        results.push({
                            project: {
                                id: i,
                                creator: raw.creator,
                                targetFunds: raw.targetFunds,
                                totalFunds: raw.totalFunds,
                                totalMilestones: Number(raw.totalMilestones),
                                currentMilestone: Number(raw.currentMilestone),
                                campaignEnded: raw.campaignEnded,
                                cancelled: raw.cancelled,
                                completed: raw.completed,
                                uri: raw.uri,
                            },
                            metadata,
                        });
                    }
                }

                setProjects(results);
            } catch (err: any) {
                console.error(err);
                setError(err.message || "Failed to fetch projects");
            } finally {
                setLoading(false);
            }
        };

        fetch();
    }, [provider, address, ownedOnly]);

    return { projects, loading, error };
}
