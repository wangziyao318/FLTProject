export interface MilestoneOnChain {
    status: number;
    proposalId: bigint;
    uri: string;
}

export interface MilestoneMetadata {
    description: string;
    creator: string;           // wallet address
    projectId: string;         // stringified bigint
    milestoneIndex: string;    // stringified bigint
    timestamp: number;         // Unix ms timestamp
}
