import { ethers } from 'ethers'
import { setGlobalState, getGlobalState } from './globalState'
import TransactionArtifact from '../artifacts/contracts/Transaction.sol/Transaction.json'
import FLTArtifact from '../artifacts/contracts/FLT.sol/FLT.json'
import { transactionContractAddress, fltContractAddress } from '../App'
import { Project, Contribution, ContributedProject, CreateProjectParams } from '../types'

const transactionAbi = TransactionArtifact.abi
const fltAbi = FLTArtifact.abi

// Connect to wallet
export const connectWallet = async (): Promise<string | null> => {
  if (!window.ethereum) {
    alert("No Ethereum browser extension detected. Please install MetaMask extension.")
    return null;
  } 

  try {
    const result = await window.ethereum.request({method: "eth_requestAccounts"});
    const address = result[0] as string;
    setGlobalState("account", address);
    setGlobalState("active", true);
    await getUserBalance(address);
    await getFLTBalance(address);
    await checkIfOwner(address);
    return address;
  } catch(error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    window.alert(errorMessage);
    return null;
  }
}

// Get ETH balance
export const getUserBalance = async (accountAddress: string): Promise<string> => {
  let balance = ethers.formatEther(
    await window.ethereum.request({method: "eth_getBalance", params: [String(accountAddress), "latest"]})
  );

  setGlobalState("accountBalance", balance);
  return getGlobalState("accountBalance");
}

// Get FLT token balance
export const getFLTBalance = async (accountAddress: string): Promise<string> => {
  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const fltContract = new ethers.Contract(fltContractAddress, fltAbi, provider);
    
    // Constants.FLT_TOKEN_ID is 1 (see FLT.sol)
    const balance = await fltContract.balanceOf(accountAddress, 1);
    const formattedBalance = ethers.formatEther(balance);
    
    setGlobalState("fltBalance", formattedBalance);
    return formattedBalance;
  } catch (error: unknown) {
    console.log(error);
    return "0";
  }
}

// Check if the current user is the contract owner
export const checkIfOwner = async (accountAddress: string): Promise<boolean> => {
  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const transactionContract = new ethers.Contract(transactionContractAddress, transactionAbi, provider);
    
    const owner = await transactionContract.owner();
    const isOwner = owner.toLowerCase() === accountAddress.toLowerCase();
    
    setGlobalState("isOwner", isOwner);
    return isOwner;
  } catch (error: unknown) {
    console.log(error);
    return false;
  }
}

// Get connected contract instance
export const getContract = async () => {
  const account = getGlobalState("account");

  if (account) {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(transactionContractAddress, transactionAbi, signer);

    return contract;
  } else {
    throw new Error("No Ethereum browser extension detected");
  }
}

// Get FLT contract instance
export const getFLTContract = async () => {
  const account = getGlobalState("account");

  if (account) {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(fltContractAddress, fltAbi, signer);

    return contract;
  } else {
    throw new Error("No Ethereum browser extension detected");
  }
}

// Create a new project
export const createProject = async ({
  totalMilestones,
  targetAmount,
  metadataUri
}: CreateProjectParams): Promise<[boolean, string]> => {
  try {
    const contract = await getContract();
    
    // Convert ETH to Wei
    const targetAmountWei = ethers.parseEther(targetAmount.toString());
    
    const transaction = await contract.createProject(
      totalMilestones, 
      targetAmountWei, 
      metadataUri,
      {
        from: getGlobalState("account"),
      }
    );
    
    await transaction.wait();
    return [true, ""];
  } catch (error: unknown) {
    console.log(error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return [false, errorMessage];
  }
}

// Get all projects
export const getProjects = async (): Promise<Project[]> => {
  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = new ethers.Contract(transactionContractAddress, transactionAbi, provider);

    // Get total project count
    const projectCount = await contract.projectCount();
    
    // Fetch all projects
    const projects: Project[] = [];
    for (let i = 1; i <= projectCount; i++) {
      const project = await contract.projects(i);
      projects.push({
        id: i,
        ...formatProject(project)
      });
    }

    setGlobalState('allProjects', projects);
    return projects;
  } catch (error: unknown) {
    console.log(error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    window.alert(errorMessage);
    return [];
  }
}

// Get a single project by ID
export const getProject = async (id: string | number): Promise<Project | null> => {
  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = new ethers.Contract(transactionContractAddress, transactionAbi, provider);

    const project = await contract.projects(id);
    const formattedProject = {
      id: Number(id),
      ...formatProject(project)
    } as Project;

    // Fetch project metadata from IPFS
    try {
      const response = await fetch(`https://ipfs.io/ipfs/${project.metadataUri.replace('ipfs://', '')}`);
      if (response.ok) {
        const metadata = await response.json();
        // Add the metadata property
        (formattedProject as any).metadata = metadata;
      }
    } catch (e) {
      console.log("Error fetching metadata:", e);
    }

    setGlobalState('project', formattedProject);
    return formattedProject;
  } catch (error: unknown) {
    console.log(error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    window.alert(errorMessage);
    return null;
  }
}

// Get projects created by the current user
export const getCreatedProjects = async (address: string): Promise<Project[]> => {
  try {
    const allProjects = await getProjects();
    const created = allProjects.filter(
      project => project.creator.toLowerCase() === address.toLowerCase()
    );
    
    setGlobalState('createdProjects', created);
    return created;
  } catch (error: unknown) {
    console.log(error);
    return [];
  }
}

// Get projects contributed to by current user
export const getContributedProjects = async (address: string): Promise<ContributedProject[]> => {
  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = new ethers.Contract(transactionContractAddress, transactionAbi, provider);
    
    const allProjects = await getProjects();
    const contributedProjects: ContributedProject[] = [];
    
    // Check each project for user contributions
    for (const project of allProjects) {
      const contribution = await contract.contributions(project.id, address);
      if (BigInt(contribution) > 0) {
        contributedProjects.push({
          ...project,
          contributedAmount: ethers.formatEther(contribution)
        });
      }
    }
    
    setGlobalState('contributedProjects', contributedProjects);
    return contributedProjects;
  } catch (error: unknown) {
    console.log(error);
    return [];
  }
}

// Get contributions for a project
export const getContributions = async (projectId: string | number): Promise<Contribution[]> => {
  try {
    // This is a simplified version. In a real app, you'd need an event listener or indexer
    // to track all contributions since the contract doesn't provide a direct way to get all contributors
    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = new ethers.Contract(transactionContractAddress, transactionAbi, provider);
    
    // For demo purposes, we'll check some test addresses
    // In a real app, you'd need to get this data from contract events
    const testAddresses = [
      "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
      "0x90F79bf6EB2c4f870365E785982E1f101E93b906"
    ];
    
    const contributions: Contribution[] = [];
    for (const addr of testAddresses) {
      const amount = await contract.contributions(projectId, addr);
      if (BigInt(amount) > 0) {
        contributions.push({
          user: addr,
          amount: ethers.formatEther(amount)
        });
      }
    }
    
    // Also check current user
    const currentUser = getGlobalState("account");
    if (currentUser) {
      const amount = await contract.contributions(projectId, currentUser);
      if (BigInt(amount) > 0 && !contributions.some(c => c.user.toLowerCase() === currentUser.toLowerCase())) {
        contributions.push({
          user: currentUser,
          amount: ethers.formatEther(amount)
        });
      }
    }
    
    setGlobalState('contributions', contributions);
    return contributions;
  } catch (error: unknown) {
    console.log(error);
    return [];
  }
}

// Contribute to a project
export const contributeToProject = async (projectId: string | number, amount: string | number): Promise<[boolean, string]> => {
  try {
    const account = getGlobalState("account");
    const contract = await getContract();
    const weiAmount = ethers.parseEther(amount.toString());
    
    const transaction = await contract.contribute(projectId, {
      from: account,
      value: weiAmount
    });
    
    await transaction.wait();
    return [true, ""];
  } catch (error: unknown) {
    console.log(error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return [false, errorMessage];
  }
}

// Withdraw contribution
export const withdrawContribution = async (projectId: string | number): Promise<[boolean, string]> => {
  try {
    const account = getGlobalState("account");
    const contract = await getContract();
    
    const transaction = await contract.withdraw(projectId, {
      from: account
    });
    
    await transaction.wait();
    return [true, ""];
  } catch (error: unknown) {
    console.log(error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return [false, errorMessage];
  }
}

// Cancel project (for creator)
export const cancelProject = async (projectId: string | number): Promise<[boolean, string]> => {
  try {
    const account = getGlobalState("account");
    const contract = await getContract();
    
    const transaction = await contract.cancelProject(projectId, {
      from: account
    });
    
    await transaction.wait();
    return [true, ""];
  } catch (error: unknown) {
    console.log(error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return [false, errorMessage];
  }
}

// Release milestone (for governance/owner)
export const releaseMilestone = async (projectId: string | number, milestoneMetadataUri: string): Promise<[boolean, string]> => {
  try {
    const account = getGlobalState("account");
    const contract = await getContract();
    
    const transaction = await contract.releaseMilestone(
      projectId, 
      milestoneMetadataUri,
      {
        from: account
      }
    );
    
    await transaction.wait();
    return [true, ""];
  } catch (error: unknown) {
    console.log(error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return [false, errorMessage];
  }
}

// Mark milestone as failed (for governance/owner)
export const markMilestoneFailed = async (projectId: string | number): Promise<[boolean, string]> => {
  try {
    const account = getGlobalState("account");
    const contract = await getContract();
    
    const transaction = await contract.markMilestoneFailed(
      projectId,
      {
        from: account
      }
    );
    
    await transaction.wait();
    return [true, ""];
  } catch (error: unknown) {
    console.log(error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return [false, errorMessage];
  }
}

// Helper to format project data from contract
function formatProject(project: any): Omit<Project, 'id'> {
  return {
    creator: project.creator,
    totalMilestones: project.totalMilestones.toNumber(),
    approvedMilestones: project.approvedMilestones.toNumber(),
    targetAmount: ethers.formatEther(project.targetAmount),
    fundsCollected: ethers.formatEther(project.fundsCollected),
    releasedFunds: ethers.formatEther(project.releasedFunds),
    campaignSuccessful: project.campaignSuccessful,
    campaignClosed: project.campaignClosed,
    cancelled: project.cancelled,
    metadataUri: project.metadataUri,
    progress: project.fundsCollected.gt(0) 
      ? (project.fundsCollected.mul(100).div(project.targetAmount)).toNumber() 
      : 0
  };
}