import { useState } from "react";
import { Milestone } from "../types";
import { ethers } from "ethers";
import { governanceContractAddress } from "../App";
import GovernanceArtifact from "../artifacts/contracts/Governance.sol/Governance.json";
import '../pages/ProjectForm.css'; // 如果使用了相同的样式文件

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
    <div className="rounded-xl shadow-lg w-80 bg-white m-6 p-4"> 
      <div className="form-wrapper">
        <div className="project-form-container">
          <div className="form-header">
            <h1 className="text-xl font-semibold">
              Project #{milestone.projectId} - Milestone #{milestone.index + 1}
            </h1>
            <p className="field-label">Proposal ID: {milestone.proposalId}</p>
          </div>
          
          <div className="form-field">
            <label>
              <span className="field-label">Milestone Description:</span>
              <p className="milestone-note">
                {milestone.description || 'No description'}
              </p>
            </label>
          </div>

          {hasVoted ? (
            <div className="bg-green-100 text-green-800 p-2 rounded text-center mt-4">
              You voted: <span className="font-semibold">{voteChoice}</span>
            </div>
          ) : (
            <div className="form-field mt-4 space-y-3">
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MilestoneVoteCard;