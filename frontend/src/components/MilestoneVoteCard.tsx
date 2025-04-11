import { useState } from "react";
import { Milestone } from "../types";
import { ethers } from "ethers";
import { governanceContractAddress } from "../App";
import GovernanceArtifact from "../artifacts/contracts/Governance.sol/Governance.json";

interface MilestoneVoteCardProps {
  milestone: Milestone;
  account: string | null;
  onVoteSuccess?: () => void;
}

const MilestoneVoteCard = ({ milestone, account, onVoteSuccess }: MilestoneVoteCardProps) => {
  const [isVoting, setIsVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [voteChoice, setVoteChoice] = useState<'abstain' | 'approve' | 'against' | null>(null);

  const handleVote = async (support: number) => {
    if (!account) return;

    try {
      setIsVoting(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        governanceContractAddress,
        GovernanceArtifact.abi,
        signer
      );

      const tx = await contract.castVote(milestone.proposalId, support);
      await tx.wait();

      setHasVoted(true);
      setVoteChoice(
        support === 0 ? 'abstain' : 
        support === 1 ? 'approve' : 'against'
      );
      onVoteSuccess?.();
    } catch (error: any) {
      console.error("Voting failed:", error);
      alert(`Voting failed: ${error.message}`);
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">
          Project #{milestone.projectId} - Milestone #{milestone.index + 1}
        </h3>
        <p className="text-sm text-gray-600">Proposal ID: {milestone.proposalId}</p>
      </div>

      <div className="mb-4">
        <p className="text-gray-700">{milestone.description}</p>
      </div>

      {hasVoted ? (
        <div className="bg-green-100 text-green-800 p-2 rounded text-center">
          You voted: {voteChoice}
        </div>
      ) : (
        <div className="flex space-x-2">
          <button
            onClick={() => handleVote(0)}
            disabled={isVoting}
            className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white py-2 rounded disabled:opacity-50"
          >
            {isVoting ? 'Processing...' : 'Abstain'}
          </button>
          <button
            onClick={() => handleVote(1)}
            disabled={isVoting}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded disabled:opacity-50"
          >
            {isVoting ? 'Processing...' : 'Approve'}
          </button>
          <button
            onClick={() => handleVote(2)}
            disabled={isVoting}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded disabled:opacity-50"
          >
            {isVoting ? 'Processing...' : 'Against'}
          </button>
        </div>
      )}
    </div>
  );
};

export default MilestoneVoteCard;