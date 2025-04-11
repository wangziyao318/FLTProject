import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ButtonVariant from './ButtonVariant';
import { buildProjectPath } from "./RouteConstants";
import { formatAddress } from "../utils/helpers";
import { Project } from "../types";
import { ethers } from "ethers";
import { transactionContractAddress } from "../App";
import TransactionArtifact from "../artifacts/contracts/Transaction.sol/Transaction.json";
import '../pages/ProjectForm.css';

interface FanProjectCardProps {
  project: Project;
  account: string | null;
  onActionSuccess?: () => void;
}

const FanProjectCard = ({ project, account, onActionSuccess }: FanProjectCardProps) => {
  const navigate = useNavigate();
  const [contributionAmount, setContributionAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [actionType, setActionType] = useState<'contribute' | 'withdraw' | null>(null);

  const routeChange = () => {
    navigate(buildProjectPath(project.id));
  };

  const handleAction = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!account) return;

    try {
      setIsLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        transactionContractAddress,
        TransactionArtifact.abi,
        signer
      );

      if (actionType === 'contribute' && contributionAmount) {
        const tx = await contract.contribute(
          project.id,
          { value: ethers.parseEther(contributionAmount) }
        );
        await tx.wait();
        setContributionAmount('');
      } else if (actionType === 'withdraw') {
        const tx = await contract.withdraw(project.id);
        await tx.wait();
      }

      onActionSuccess?.();
    } catch (error: any) {
      console.error("Action failed:", error);
      alert(`Action failed: ${error.message}`);
    } finally {
      setIsLoading(false);
      setActionType(null);
    }
  };

  const isActive = !project.campaignClosed && !project.cancelled;
  const isNotCreator = account && account.toLowerCase() !== project.creator.toLowerCase();

  return (
    <div 
      className="rounded-xl shadow-lg w-80 bg-gray-100 m-6 p-4 hover:cursor-pointer"
      onClick={routeChange}
    >
      <div className="form-wrapper">
        <div className="project-form-container">
          <div className="form-header">
            <h1>{project.metadata?.title || `Project #${project.id}`}</h1>
            <p className="text-sm text-gray-600">
              Creator: {formatAddress(project.creator)}
            </p>
          </div>
          
          <div className="form-field">
            <label>
              <span className="field-label">Project Description:</span>
              <p className="milestone-note">
                {project.metadata?.description || 'No description'}
              </p>
            </label>
          </div>

          <div className="form-field">
            <label>
              <span className="field-label">Progress:</span>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full" 
                  style={{ width: `${project.progress}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span>Target: {project.targetAmount} ETH</span>
                <span>Raised: {project.fundsCollected} ETH</span>
              </div>
            </label>
          </div>

          {isActive && isNotCreator && (
            <div className="form-field">
              <div className="space-y-3">
                <ButtonVariant
                  type="button"
                  text="Withdraw"
                  className="w-full bg-red-500 hover:bg-red-600 text-white"
                  clickHandler={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    setActionType('withdraw');
                    handleAction(e);
                  }}
                  disabled={isLoading}
                />

                <div className="flex items-center">
                  <input
                    type="number"
                    value={contributionAmount}
                    onChange={(e) => setContributionAmount(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="ETH amount"
                    min="0.01"
                    step="0.01"
                    className="flex-1 p-2 border rounded-l focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <ButtonVariant
                    type="button"
                    text={isLoading && actionType === 'contribute' ? "Processing..." : "Contribute"}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-l-none rounded-r px-4 py-2"
                    clickHandler={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      setActionType('contribute');
                      handleAction(e);
                    }}
                    disabled={!contributionAmount || isLoading}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FanProjectCard;