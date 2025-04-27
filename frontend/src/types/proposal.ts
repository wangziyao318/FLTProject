export interface ProposalOnChain {
    id: bigint;
    projectId: bigint;
    creator: string;
    startBlock: bigint;
    endBlock: bigint;
    abstainVotes: bigint;
    forVotes: bigint;
    againstVotes: bigint;
    executed: boolean;
    uri: string;
}
