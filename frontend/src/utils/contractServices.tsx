import { ethers } from 'ethers'
import { setGlobalState, getGlobalState } from './globalState'
import TransactionArtifact from '../artifacts/contracts/Transaction.sol/Transaction.json'
import FLTArtifact from '../artifacts/contracts/FLT.sol/FLT.json'
import { transactionContractAddress, fltContractAddress, governanceContractAddress } from '../App'
// import { Project, Contribution, ContributedProject, CreateProjectParams } from '../types'
import { Project, Contribution, ContributedProject, CreateProjectParams, Milestone } from '../types'
import GovernanceArtifact from '../artifacts/contracts/Governance.sol/Governance.json';


const transactionAbi = TransactionArtifact.abi
const fltAbi = FLTArtifact.abi

const USE_MOCK_DATA = true;

// Sample Project for each project
const fakeProjects = [
  {
    id: 1,
    creator: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
    totalMilestones: 3,
    approvedMilestones: 1,
    targetAmount: "5.0",
    fundsCollected: "3.75",
    releasedFunds: "1.25",
    campaignSuccessful: false,
    campaignClosed: false,
    cancelled: false,
    metadataUri: "ipfs://QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
    title: "Decentralized Art Marketplace",
    targetFunds: "5.0",
    status: "ACTIVE",
    progress: 75,
    metadata: {
      title: "Decentralized Art Marketplace",
      description: "Building a platform where artists can mint, showcase, and sell their digital artwork as NFTs with minimal fees. The platform will feature artist verification, royalty management, and a community voting system for trending collections.",
      imageUrl: "https://images.unsplash.com/photo-1569748130764-3fed0c102c59?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
      milestones: [
        {
          title: "Smart Contract Development",
          description: "Develop and audit the NFT marketplace contracts including minting, auction, and royalty distribution."
        },
        {
          title: "Frontend Development",
          description: "Build responsive gallery views, artist profiles, and bidding interfaces with wallet integration."
        },
        {
          title: "Beta Launch",
          description: "Release platform to a limited audience for testing and collect feedback before full launch."
        }
      ]
    }
  },
  {
    id: 2,
    creator: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    totalMilestones: 4,
    approvedMilestones: 2,
    targetAmount: "10.0",
    fundsCollected: "10.0",
    releasedFunds: "5.0",
    campaignSuccessful: true,
    campaignClosed: false,
    cancelled: false,
    metadataUri: "ipfs://QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
    title: "DeFi Yield Aggregator",
    targetFunds: "10.0",
    status: "FUNDED",
    progress: 100,
    metadata: {
      title: "DeFi Yield Aggregator",
      description: "Creating an automated yield optimization platform that helps users maximize returns across multiple DeFi protocols. The system will automatically move funds between lending protocols to achieve the highest APY.",
      imageUrl: "https://images.unsplash.com/photo-1620321023374-d1a68fbc720d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
      milestones: [
        {
          title: "Protocol Integration",
          description: "Connect with major lending platforms via smart contracts (Aave, Compound, etc.)"
        },
        {
          title: "Strategy Development",
          description: "Create optimization algorithms for yield maximization across protocols"
        },
        {
          title: "Security Audit",
          description: "Complete comprehensive security audit by a third-party firm"
        },
        {
          title: "Public Launch",
          description: "Deploy to mainnet and start marketing campaign"
        }
      ]
    }
  },
  {
    id: 3,
    creator: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
    totalMilestones: 2,
    approvedMilestones: 0,
    targetAmount: "2.0",
    fundsCollected: "0.5",
    releasedFunds: "0.0",
    campaignSuccessful: false,
    campaignClosed: false,
    cancelled: false,
    metadataUri: "ipfs://QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
    title: "Smart Contract Audit Tool",
    targetFunds: "2.0",
    status: "ACTIVE",
    progress: 25,
    metadata: {
      title: "Smart Contract Audit Tool",
      description: "Developing an open-source tool that automatically scans Solidity smart contracts for common vulnerabilities and best practice violations, with detailed explanations and fix suggestions.",
      imageUrl: "https://images.unsplash.com/photo-1639322537228-f710d846310a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
      milestones: [
        {
          title: "Vulnerability Detection Engine",
          description: "Build the core scanning engine that can detect common smart contract vulnerabilities"
        },
        {
          title: "Web Interface",
          description: "Create a user-friendly web interface for uploading and analyzing contracts"
        }
      ]
    }
  }
];


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
  try {
    if (!window.ethereum) {
      throw new Error("No Ethereum browser extension detected");
    }
    
    const balance = await window.ethereum.request({
      method: "eth_getBalance", 
      params: [String(accountAddress), "latest"]
    });
    
    const formattedBalance = ethers.formatEther(balance);
    setGlobalState("accountBalance", formattedBalance);
    return formattedBalance;
  } catch (error) {
    console.error("Error getting user balance:", error);
    return "0";
  }
}

// Get FLT token balance
export const getFLTBalance = async (accountAddress: string): Promise<string> => {
  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const fltContract = new ethers.Contract(fltContractAddress, fltAbi, provider);
    
    // Check if the address is a creator by examining past events or roles
    // For now, we'll check both creator and fan token balances
    const creatorTokenId = await fltContract.CREATOR_TOKEN_ID();
    const fanTokenId = await fltContract.FAN_TOKEN_ID();
    
    // Get creator token balance
    const creatorBalance = await fltContract.balanceOf(accountAddress, creatorTokenId);
    
    // Get fan token balance
    const fanBalance = await fltContract.balanceOf(accountAddress, fanTokenId);
    
    // Sum the balances
    const totalBalance = creatorBalance + fanBalance;
    const formattedBalance = ethers.formatEther(totalBalance);
    
    setGlobalState("fltBalance", formattedBalance);
    
    // Also store individual balances for UI differentiation if needed
    setGlobalState("creatorTokenBalance", ethers.formatEther(creatorBalance));
    setGlobalState("fanTokenBalance", ethers.formatEther(fanBalance));
    
    return formattedBalance;
  } catch (error: unknown) {
    console.error("Error getting FLT balance:", error);
    return "0";
  }
}

// Check if the current user is the contract owner or has governance role
export const checkIfOwner = async (accountAddress: string): Promise<boolean> => {
  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const fltContract = new ethers.Contract(fltContractAddress, fltAbi, provider);
    
    // Check if the account has the DEFAULT_ADMIN_ROLE (0x00)
    // This is the bytes32(0) role which is the admin role
    const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
    const isOwner = await fltContract.hasRole(DEFAULT_ADMIN_ROLE, accountAddress);
    
    setGlobalState("isOwner", isOwner);
    
    // Also check if the user is blacklisted
    const BLACKLIST_ROLE = await fltContract.BLACKLIST_ROLE();
    const isBlacklisted = await fltContract.hasRole(BLACKLIST_ROLE, accountAddress);
    setGlobalState("isBlacklisted", isBlacklisted);
    
    return isOwner;
  } catch (error: unknown) {
    console.error("Error checking owner status:", error);
    return false;
  }
}

// Get connected contract instance with signer
export const getContract = async () => {
  const account = getGlobalState("account");

  if (account) {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(transactionContractAddress, transactionAbi, signer);

    return contract;
  } else {
    throw new Error("No connected account found. Please connect wallet first.");
  }
}

// Get FLT contract instance with signer
export const getFLTContract = async () => {
  const account = getGlobalState("account");

  if (account) {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(fltContractAddress, fltAbi, signer);

    return contract;
  } else {
    throw new Error("No connected account found. Please connect wallet first.");
  }
}

// Create a new project
export const createProject = async ({
  totalMilestones,
  targetAmount,
  metadataUri
}: CreateProjectParams): Promise<[boolean, string]> => {
  try {
    // Check if user is blacklisted before creating project
    const account = getGlobalState("account");
    const isBlacklisted = getGlobalState("isBlacklisted");
    
    if (isBlacklisted) {
      return [false, "Your account has been blacklisted and cannot create projects"];
    }
    
    // Handle IPFS storage for project metadata
    // Note: This is a placeholder - actual IPFS implementation needed
    
    // TODO: Implement IPFS storage for project metadata
    // 1. Convert project metadata to JSON
    // 2. Upload to IPFS using a service like Pinata, Infura IPFS, or Web3.Storage
    // 3. Get back the IPFS CID and construct the ipfs:// URI
    
    // For development purposes, we can create a fake IPFS URI if none is provided
    if (!metadataUri || metadataUri.trim() === "") {
      // Create a simple metadata JSON
      const metadata = {
        title: "Project Title", // This should come from the form
        description: "Project Description", // This should come from the form
        timestamp: new Date().toISOString()
      };
      
      // Create a mock IPFS URI with the metadata encoded in base64
      const encodedData = Buffer.from(JSON.stringify(metadata)).toString('base64');
      metadataUri = `ipfs://QmFake${encodedData.substring(0, 16)}`;
    }
    
    const contract = await getContract();
    
    // Convert ETH to Wei for the blockchain
    const targetAmountWei = ethers.parseEther(targetAmount.toString());
    
    // Call the createProject function from the Transaction contract
    // Note: Order of arguments matters! Match the Solidity function signature
    const transaction = await contract.createProject(
      targetAmountWei,
      totalMilestones, 
      metadataUri
    );
    
    // Wait for transaction to be mined
    const receipt = await transaction.wait();
    
    // After creating a project, refresh the creator token balance
    await getFLTBalance(account);
    
    return [true, "Project created successfully"];
  } catch (error: unknown) {
    console.error("Error creating project:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return [false, errorMessage];
  }
}

// Get all projects
export const getProjects = async (): Promise<Project[]> => {
  if (USE_MOCK_DATA) {
    setGlobalState('allProjects', fakeProjects);
    return fakeProjects;
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = new ethers.Contract(transactionContractAddress, transactionAbi, provider);

    // Get total project count from the contract
    const projectCount = await contract.projectCount();
    
    // Fetch all projects
    const projects: Project[] = [];
    for (let i = 1; i <= projectCount; i++) {
      try {
        // Get project data from contract
        const project = await contract.projects(i);
        
        // Format project data
        const formattedProject = {
          id: i,
          creator: project.creator,
          totalMilestones: parseInt(project.totalMilestones || "0"),
          approvedMilestones: 0, // We'll calculate this
          targetAmount: ethers.formatEther(project.targetFunds),
          fundsCollected: ethers.formatEther(project.totalFunds),
          releasedFunds: "0", // Calculate based on milestones
          campaignSuccessful: project.campaignEnded,
          campaignClosed: project.completed,
          cancelled: project.cancelled,
          metadataUri: project.uri,
          status: getProjectStatus(project),
          progress: calculateProgress(project),
        } as Project;
        
        // Fetch metadata from IPFS if possible
        try {
          // Convert IPFS URI to HTTP URL for gateway access
          const ipfsGatewayUrl = project.uri.replace('ipfs://', 'https://ipfs.io/ipfs/');
          const response = await fetch(ipfsGatewayUrl);
          if (response.ok) {
            const metadata = await response.json();
            formattedProject.metadata = metadata;
            formattedProject.title = metadata.title;
          }
        } catch (metadataError) {
          console.warn(`Failed to fetch metadata for project ${i}:`, metadataError);
          formattedProject.title = `Project ${i}`;
        }
        
        projects.push(formattedProject);
      } catch (projectError) {
        console.warn(`Failed to fetch project ${i}:`, projectError);
      }
    }

    setGlobalState('allProjects', projects);
    return projects;
  } catch (error: unknown) {
    console.error("Error fetching projects:", error);
    return [];
  }
}

// Get a single project by ID
export const getProject = async (id: string | number): Promise<Project | null> => {
  if (USE_MOCK_DATA) {
    const project = fakeProjects.find(p => p.id === Number(id));
    if (project) {
      setGlobalState('project', project);
      return project;
    }
    return null;
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = new ethers.Contract(transactionContractAddress, transactionAbi, provider);

    // Fetch project data from contract
    const project = await contract.projects(id);
    
    // Check if project exists (creator address would be 0x0 if not)
    if (project.creator === '0x0000000000000000000000000000000000000000') {
      return null;
    }
    
    // Format project data 
    const formattedProject = {
      id: Number(id),
      creator: project.creator,
      totalMilestones: parseInt(project[3] || "0"), // Get milestones length
      approvedMilestones: parseInt(project.currentMilestone || "0"),
      targetAmount: ethers.formatEther(project.targetFunds),
      fundsCollected: ethers.formatEther(project.totalFunds),
      releasedFunds: calculateReleasedFunds(project),
      campaignSuccessful: project.campaignEnded,
      campaignClosed: project.completed,
      cancelled: project.cancelled,
      metadataUri: project.uri,
      status: getProjectStatus(project),
      progress: calculateProgress(project),
    } as Project;

    // Fetch metadata from IPFS
    try {
      // Convert IPFS URI to HTTP URL for gateway access
      const ipfsGatewayUrl = project.uri.replace('ipfs://', 'https://ipfs.io/ipfs/');
      const response = await fetch(ipfsGatewayUrl);
      
      if (response.ok) {
        const metadata = await response.json();
        formattedProject.metadata = metadata;
        formattedProject.title = metadata.title;
      }
    } catch (e) {
      console.warn("Error fetching project metadata:", e);
      formattedProject.title = `Project ${id}`;
    }

    setGlobalState('project', formattedProject);
    return formattedProject;
  } catch (error: unknown) {
    console.error("Error fetching project:", error);
    return null;
  }
}

// Get projects created by the current user
export const getCreatedProjects = async (address: string): Promise<Project[]> => {
  if (USE_MOCK_DATA) {
    // Filter the fake projects to find ones where the creator matches the provided address
    const created = fakeProjects.filter(
      project => project.creator.toLowerCase() === address.toLowerCase()
    );
    
    setGlobalState('createdProjects', created);
    return created;
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = new ethers.Contract(transactionContractAddress, transactionAbi, provider);
    
    // Check if user has any creator tokens, which indicates they're a creator
    const fltContract = new ethers.Contract(fltContractAddress, fltAbi, provider);
    const creatorTokenId = await fltContract.CREATOR_TOKEN_ID();
    const creatorBalance = await fltContract.balanceOf(address, creatorTokenId);
    
    // If they have no creator tokens and aren't mocking data, they may not have any projects
    if (creatorBalance.toString() === "0" && !USE_MOCK_DATA) {
      console.log("User has no creator tokens, they may not have created any projects");
      // We'll still check, but log this as info
    }
    
    // Get the list of project IDs created by the user
    // We need to query one by one until we get an error or 0
    const createdProjects: Project[] = [];
    let index = 0;
    
    while (true) {
      try {
        const projectId = await contract.projectIds(address, index);
        
        // If projectId is 0, we've reached the end
        if (projectId.toString() === "0") {
          break;
        }
        
        // Get project details
        const project = await getProject(projectId);
        if (project) {
          createdProjects.push(project);
        }
        
        index++;
      } catch (e) {
        // We've reached the end of the array or encountered an error
        console.log(`Finished reading projects or encountered error: ${e}`);
        break;
      }
    }
    
    setGlobalState('createdProjects', createdProjects);
    return createdProjects;
  } catch (error: unknown) {
    console.error("Error fetching created projects:", error);
    return [];
  }
}

// Get projects contributed to by current user
// export const getContributedProjects = async (address: string): Promise<ContributedProject[]> => {
//   if (USE_MOCK_DATA) {
//     // Mock implementation for contributed projects
//     return fakeProjects.map(p => ({
//       ...p,
//       contributedAmount: "1.0" // Mock contribution amount
//     }));
//   }
  
//   try {
//     const provider = new ethers.BrowserProvider(window.ethereum);
//     const contract = new ethers.Contract(transactionContractAddress, transactionAbi, provider);
    
//     // Get all projects first
//     const allProjects = await getProjects();
//     const contributedProjects: ContributedProject[] = [];
    
//     // Check each project for contributions by the user
//     for (const project of allProjects) {
//       try {
//         // Query the contributions mapping for this project and user
//         // Note: This is a direct storage access which may not work in all contracts
//         // The contract would ideally have a function to query contributions
        
//         // Since we can't directly access mappings inside mappings in the contract,
//         // we'd need a helper function in the contract like getContribution(projectId, address)
        
//         // For now, we'll use events to determine contributions
//         // This is not optimal but works as a fallback
        
//         const filter = contract.filters.ContributionReceived(project.id, address);
//         const events = await contract.queryFilter(filter);
        
//         if (events.length > 0) {
//           // Calculate total contribution from events
//           let totalContribution = ethers.parseEther("0");
          
//           for (const event of events) {
//             const { value } = event.args;
//             totalContribution += value;
//           }
          
//           contributedProjects.push({
//             ...project,
//             contributedAmount: ethers.formatEther(totalContribution)
//           });
//         }
//       } catch (e) {
//         console.warn(`Error checking contributions for project ${project.id}:`, e);
//       }
//     }
    
//     setGlobalState('contributedProjects', contributedProjects);
//     return contributedProjects;
//   } catch (error: unknown) {
//     console.error("Error fetching contributed projects:", error);
//     return [];
//   }
// }

// Contribute to a project
// export const contributeToProject = async (projectId: string | number, amount: string | number): Promise<[boolean, string]> => {
//   try {
//     const contract = await getContract();
//     const weiAmount = ethers.parseEther(amount.toString());
    
//     // Call the contribute function with projectId and ETH value
//     const transaction = await contract.contribute(projectId, {
//       value: weiAmount
//     });
    
//     await transaction.wait();
//     return [true, "Contribution successful"];
//   } catch (error: unknown) {
//     console.error("Error contributing to project:", error);
//     const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
//     return [false, errorMessage];
//   }
// }

// Withdraw contribution
// export const withdrawContribution = async (projectId: string | number): Promise<[boolean, string]> => {
//   try {
//     const contract = await getContract();
    
//     // Call the withdraw function with projectId
//     const transaction = await contract.withdraw(projectId);
    
//     await transaction.wait();
//     return [true, "Withdrawal successful"];
//   } catch (error: unknown) {
//     console.error("Error withdrawing contribution:", error);
//     const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
//     return [false, errorMessage];
//   }
// }

// Cancel project (for creator)
export const cancelProject = async (projectId: string | number): Promise<[boolean, string]> => {
  if (USE_MOCK_DATA) {
    const projectIndex = fakeProjects.findIndex(p => p.id === Number(projectId));
    if (projectIndex !== -1) {
      // Update the project status to cancelled
      fakeProjects[projectIndex] = {
        ...fakeProjects[projectIndex],
        cancelled: true,
        status: "CANCELLED"
      };
      
      setGlobalState('allProjects', fakeProjects);
      return [true, "Project cancelled successfully"];
    }
    return [false, "Project not found"];
  }

  try {
    // Check if user is blacklisted
    const account = getGlobalState("account");
    const isBlacklisted = getGlobalState("isBlacklisted");
    
    if (isBlacklisted) {
      return [false, "Your account has been blacklisted and cannot perform this action"];
    }
    
    // Get the project to check if the current user is the creator
    const project = await getProject(projectId);
    if (!project) {
      return [false, "Project not found"];
    }
    
    // Verify the current user is the project creator
    if (project.creator.toLowerCase() !== account.toLowerCase()) {
      return [false, "Only the project creator can cancel this project"];
    }
    
    const contract = await getContract();
    
    // Call the cancelProject function with projectId
    const transaction = await contract.cancelProject(projectId);
    
    // Wait for the transaction to be mined
    const receipt = await transaction.wait();
    
    // Important: The cancellation will burn creator FLT tokens as penalty
    // So refresh the FLT balance after cancellation
    await getFLTBalance(account);
    
    return [true, "Project cancelled successfully. Note: FLT tokens have been deducted as penalty."];
  } catch (error: unknown) {
    console.error("Error cancelling project:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return [false, errorMessage];
  }
}

// Submit milestone (for creator)
export const submitMilestone = async (projectId: string | number, milestoneUri: string): Promise<[boolean, string]> => {
  try {
    // Check if user is blacklisted
    const account = getGlobalState("account");
    const isBlacklisted = getGlobalState("isBlacklisted");
    
    if (isBlacklisted) {
      return [false, "Your account has been blacklisted and cannot perform this action"];
    }
    
    // Get the project to check if the current user is the creator
    const project = await getProject(projectId);
    if (!project) {
      return [false, "Project not found"];
    }
    
    // Verify the current user is the project creator
    if (project.creator.toLowerCase() !== account.toLowerCase()) {
      return [false, "Only the project creator can submit milestones for this project"];
    }
    
    // TODO: Implement IPFS storage for milestone data
    // 1. Convert milestone data to JSON
    // 2. Upload to IPFS
    // 3. Get IPFS URI
    
    // For development purposes, we can create a fake IPFS URI if none is provided
    if (!milestoneUri || milestoneUri.trim() === "") {
      // Create a simple metadata JSON
      const metadata = {
        title: `Milestone ${project.approvedMilestones + 1}`,
        description: "Milestone Description",
        timestamp: new Date().toISOString(),
        projectId: projectId.toString()
      };
      
      // Create a mock IPFS URI with the metadata encoded in base64
      const encodedData = Buffer.from(JSON.stringify(metadata)).toString('base64');
      milestoneUri = `ipfs://QmMilestoneFake${encodedData.substring(0, 16)}`;
    }
    
    const contract = await getContract();
    
    // Call the submitMilestone function with projectId and URI
    const transaction = await contract.submitMilestone(projectId, milestoneUri);
    
    await transaction.wait();
    return [true, "Milestone submitted successfully. It is now awaiting approval by the platform."];
  } catch (error: unknown) {
    console.error("Error submitting milestone:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return [false, errorMessage];
  }
}

// Release milestone (for governance)
export const releaseMilestone = async (projectId: string | number, milestoneUri: string = ""): Promise<[boolean, string]> => {
  try {
    // Check if user has governance role
    const account = getGlobalState("account");
    const isOwner = getGlobalState("isOwner");
    
    if (!isOwner) {
      return [false, "Only platform administrators can release milestones"];
    }
    
    const contract = await getContract();
    
    // Call the releaseMilestone function with projectId
    const transaction = await contract.releaseMilestone(projectId);
    
    // Wait for the transaction to be mined
    const receipt = await transaction.wait();
    
    // After releasing a milestone, the creator receives FLT tokens as reward
    // The project funds are also released to the creator
    
    // Get the project to identify the creator
    const project = await getProject(projectId);
    if (project && project.creator) {
      // Refresh the creator's FLT balance
      await getFLTBalance(project.creator);
    }
    
    return [true, "Milestone released successfully. Funds have been transferred to the creator and FLT tokens awarded."];
  } catch (error: unknown) {
    console.error("Error releasing milestone:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return [false, errorMessage];
  }
}

// Void/reject milestone (for governance)
export const voidMilestone = async (projectId: string | number): Promise<[boolean, string]> => {
  try {
    const contract = await getContract();
    
    // Call the voidMilestone function with projectId
    const transaction = await contract.voidMilestone(projectId);
    
    await transaction.wait();
    return [true, "Milestone voided successfully"];
  } catch (error: unknown) {
    console.error("Error voiding milestone:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return [false, errorMessage];
  }
}

// Helper function to determine project status
function getProjectStatus(project: any): string {
  if (project.cancelled) return "CANCELLED";
  if (project.completed) return "COMPLETED";
  if (project.campaignEnded) return "FUNDED";
  return "ACTIVE";
}

// Helper function to calculate project progress
function calculateProgress(project: any): number {
  if (!project.targetFunds || project.targetFunds.eq(0)) return 0;
  
  const targetFunds = typeof project.targetFunds === 'string' 
    ? ethers.parseEther(project.targetFunds)
    : project.targetFunds;
    
  const totalFunds = typeof project.totalFunds === 'string'
    ? ethers.parseEther(project.totalFunds)
    : project.totalFunds;
    
  return Number(((totalFunds * BigInt(100)) / targetFunds).toString());
}

// Helper function to calculate released funds
function calculateReleasedFunds(project: any): string {
  if (!project.targetFunds || !project.currentMilestone || !project.milestones) return "0";
  
  const targetFunds = typeof project.targetFunds === 'string'
    ? ethers.parseEther(project.targetFunds)
    : project.targetFunds;
    
  const milestoneFund = targetFunds / BigInt(project.milestones.length);
  const releasedFunds = milestoneFund * BigInt(project.currentMilestone);
  
  return ethers.formatEther(releasedFunds);
}


// Withdraw contribution from a project
export const withdrawContribution = async (projectId: number): Promise<[boolean, string]> => {
  if (USE_MOCK_DATA) {
    return [true, "Withdrawal successful (mock)"];
  }

  try {
    const contract = await getContract();
    const tx = await contract.withdraw(projectId);
    await tx.wait();
    return [true, "Withdrawal successful"];
  } catch (error: any) {
    console.error("Error withdrawing:", error);
    return [false, error.message || "Withdrawal failed"];
  }
};

// Get all milestones available for voting
export const getMilestonesForVoting = async (): Promise<Milestone[]> => {
  if (USE_MOCK_DATA) {
    return [
      {
        projectId: 1,
        index: 0,
        proposalId: 1,
        description: "First milestone for Art Marketplace",
        status: "pending"
      },
      {
        projectId: 2,
        index: 1,
        proposalId: 2,
        description: "Second milestone for DeFi Aggregator",
        status: "pending"
      }
    ];
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const transactionContract = new ethers.Contract(
      transactionContractAddress,
      transactionAbi,
      provider
    );
    const governanceContract = new ethers.Contract(
      governanceContractAddress, 
      GovernanceArtifact.abi,
      provider
    );

    const projectCount = await transactionContract.projectCount();
    const milestones: Milestone[] = [];

    for (let projectId = 1; projectId <= projectCount; projectId++) {
      const project = await transactionContract.projects(projectId);
      for (let i = 0; i < project.milestones.length; i++) {
        const milestone = project.milestones[i];
        if (milestone.status === 3) { // Submitted status
          milestones.push({
            projectId,
            index: i,
            proposalId: milestone.proposalId,
            description: milestone.uri,
            status: "pending"
          });
        }
      }
    }

    return milestones;
  } catch (error) {
    console.error("Error fetching milestones:", error);
    return [];
  }
};

// Vote on a milestone proposal
export const voteOnMilestone = async (
  proposalId: number,
  support: number // 0 = abstain, 1 = approve, 2 = against
): Promise<[boolean, string]> => {
  if (USE_MOCK_DATA) {
    return [true, `Vote recorded (mock): ${['abstain', 'approve', 'against'][support]}`];
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const governanceContract = new ethers.Contract(
      governanceContractAddress,
      GovernanceArtifact.abi,
      signer
    );

    const tx = await governanceContract.castVote(proposalId, support);
    await tx.wait();
    
    return [true, "Vote recorded successfully"];
  } catch (error: any) {
    console.error("Error voting:", error);
    return [false, error.message || "Voting failed"];
  }
};

// Check if user has voted on a proposal
export const hasVotedOnProposal = async (proposalId: number, account: string): Promise<boolean> => {
  if (USE_MOCK_DATA) {
    return false;
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const governanceContract = new ethers.Contract(
      governanceContractAddress,
      GovernanceArtifact.abi,
      provider
    );

    return await governanceContract.hasVoted(proposalId, account);
  } catch (error) {
    console.error("Error checking vote status:", error);
    return false;
  }
};

export const getMilestones = async (): Promise<Milestone[]> => {
  if (USE_MOCK_DATA) {
    return fakeProjects.flatMap(project => 
      project.metadata?.milestones?.map((m, index) => ({
        projectId: project.id,
        index,
        proposalId: index + 1, // 模拟 proposalId
        description: m.description,
        status: index < project.approvedMilestones ? 'approved' : 'pending',
        title: m.title || `Milestone ${index + 1}`
      })) || []
    );
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = new ethers.Contract(
      transactionContractAddress,
      transactionAbi,
      provider
    );

    const projectCount = await contract.projectCount();
    const allMilestones: Milestone[] = [];

    for (let projectId = 1; projectId <= projectCount; projectId++) {
      const project = await contract.projects(projectId);
      for (let i = 0; i < project.milestones.length; i++) {
        const milestone = project.milestones[i];
        allMilestones.push({
          projectId,
          index: i,
          proposalId: milestone.proposalId || 0,
          description: milestone.uri,
          status: getMilestoneStatus(milestone.status),
          title: `Milestone ${i + 1}`
        });
      }
    }

    return allMilestones;
  } catch (error) {
    console.error("Error fetching milestones:", error);
    return [];
  }
};



// Helper function to convert numeric status to string
function getMilestoneStatus(status: number): 'pending' | 'approved' | 'rejected' {
  switch(status) {
    case 0: return 'pending';
    case 1: return 'approved';
    case 2: return 'rejected';
    default: 
      console.warn(`Unknown milestone status: ${status}`);
      return 'pending';
  }
}