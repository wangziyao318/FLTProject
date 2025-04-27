export interface ProjectOnChain {
    id: bigint;
    creator: string;
    targetFunds: bigint;
    totalFunds: bigint;
    totalMilestones: number;
    currentMilestone: number;
    campaignEnded: boolean;
    cancelled: boolean;
    completed: boolean;
    uri: string;
}

export interface ProjectMetadata {
    title: string;
    description: string;
    creator: string;
    target: string;
    milestones: number;
}
