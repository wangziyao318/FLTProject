// Import your Project type
import { Project } from '../types'; // Adjust path as needed

// Format wallet address with ellipsis
export const formatAddress = (address: string): string => {
  if (!address) return '';
  return address.slice(0, 6) + '...' + address.slice(-4);
}

// Get project status text
export const getProjectStatus = (project: Project): string => {
  if (!project) return '';
  
  if (project.cancelled) {
    return 'CANCELLED';
  }
  
  if (project.campaignSuccessful) {
    return 'FUNDED';
  }
  
  if (project.campaignClosed) {
    if (parseFloat(project.fundsCollected) >= parseFloat(project.targetAmount)) {
      return 'SUCCESSFUL';
    } else {
      return 'CLOSED';
    }
  }
  
  return 'ACTIVE';
}

// Get project progress as percentage
export const getProjectProgress = (project: Project): number => {
  if (!project) return 0;
  
  const targetAmount = parseFloat(project.targetAmount);
  const fundsCollected = parseFloat(project.fundsCollected);
  
  if (targetAmount === 0) return 0;
  
  return Math.min(Math.round((fundsCollected / targetAmount) * 100), 100);
}

// Get milestone progress as percentage
export const getMilestoneProgress = (project: Project): number => {
  if (!project) return 0;
  
  const totalMilestones = project.totalMilestones;
  const approvedMilestones = project.approvedMilestones;
  
  if (totalMilestones === 0) return 0;
  
  return Math.round((approvedMilestones / totalMilestones) * 100);
}

// Check if user can withdraw from project
export const canWithdraw = (project: Project, userAddress: string): boolean => {
  if (!project || !userAddress) return false;
  
  // Only allow withdrawal when campaign is active (not closed or cancelled)
  return !project.campaignClosed && !project.cancelled;
}

// Check if user can cancel project
export const canCancel = (project: Project, userAddress: string): boolean => {
  if (!project || !userAddress) return false;
  
  // Only creator can cancel and only when project is successful and not already cancelled
  return (
    project.creator.toLowerCase() === userAddress.toLowerCase() &&
    project.campaignSuccessful &&
    !project.cancelled
  );
}

// Check if user can release milestone (governance)
export const canReleaseMilestone = (project: Project, isOwner: boolean): boolean => {
  if (!project || !isOwner) return false;
  
  // Only contract owner can release milestones for successful campaigns that aren't cancelled
  // and still have milestones to approve
  return (
    isOwner &&
    project.campaignSuccessful &&
    !project.cancelled &&
    project.approvedMilestones < project.totalMilestones
  );
}

// Check if a user is blacklisted (would need to call the contract)
export const isBlacklisted = async (userAddress: string, contract: any): Promise<boolean> => {
  try {
    return await contract.blacklist(userAddress);
  } catch (error) {
    console.log(error);
    return false;
  }
}

// Calculate remaining funds to reach target
export const getRemainingTarget = (project: Project): string => {
  if (!project) return '0';
  
  const targetAmount = parseFloat(project.targetAmount);
  const fundsCollected = parseFloat(project.fundsCollected);
  
  return Math.max(targetAmount - fundsCollected, 0).toFixed(4);
}

// Calculate funds available for withdrawal
export const getWithdrawableAmount = (project: Project, contributedAmount: string): string => {
  if (!project || !contributedAmount) return '0';
  
  const totalFunds = parseFloat(project.fundsCollected);
  const releasedFunds = parseFloat(project.releasedFunds);
  const lockedFunds = totalFunds - releasedFunds;
  
  // User's share of the locked pool
  return ((parseFloat(contributedAmount) / totalFunds) * lockedFunds).toFixed(4);
}