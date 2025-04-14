import { useEffect, useState } from "react";
import { useWallet } from "../contexts/WalletContext";
import { Transaction__factory } from "../typechain-types";
import { CONTRACT_ADDRESSES } from "../constants/contracts";

export type FanContribution = {
    projectId: bigint;
    amount: bigint; // in wei
};

export function useContribution() {
    const { provider, address } = useWallet();
    const [contributions, setContributions] = useState<FanContribution[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!provider || !address) return;

        const fetch = async () => {
            setLoading(true);
            setError(null);

            try {
                const tx = Transaction__factory.connect(CONTRACT_ADDRESSES.Transaction, provider);
                const result: FanContribution[] = [];

                const count: bigint = await tx.getContributedProjectIdCount(address);
                for (let i = 0n; i < count; i++) {
                    const projectId = await tx.contributedProjectIds(address, i);
                    const amount = await tx.getContributions(projectId, address);
                    result.push({ projectId, amount });
                }

                setContributions(result);
            } catch (err: any) {
                console.error(err);
                setError(err.message || "Failed to fetch contributions");
            } finally {
                setLoading(false);
            }
        };

        fetch();
    }, [provider, address]);

    return { contributions, loading, error };
}
