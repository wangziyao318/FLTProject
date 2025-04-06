import { ethers } from 'ethers'
import { setGlobalState, getGlobalState } from './globalState'
import TransactionArtifact from '../artifacts/contracts/Transaction.sol/Transaction.json'
import FLTArtifact from '../artifacts/contracts/FLT.sol/FLT.json'
import { transactionContractAddress, fltContractAddress } from '../App'
import { Project, Contribution, ContributedProject, CreateProjectParams } from '../types'

const transactionAbi = TransactionArtifact.abi
const fltAbi = FLTArtifact.abi

const USE_MOCK_DATA = true;
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

// Sample contributions for each project
const fakeContributions = {
  1: [
    {
      user: "0x7cB57B5A97eAbe94205C07890BE4c1aD31E486A8",
      amount: "2.0"
    },
    {
      user: "0x2546BcD3c84621e976D8185a91A922aE77ECEc30",
      amount: "1.0"
    },
    {
      user: "0xbDA5747bFD65F08deb54cb465eB87D40e51B197E",
      amount: "0.75"
    }
  ],
  2: [
    {
      user: "0x7cB57B5A97eAbe94205C07890BE4c1aD31E486A8",
      amount: "5.0"
    },
    {
      user: "0xbDA5747bFD65F08deb54cb465eB87D40e51B197E",
      amount: "3.0"
    },
    {
      user: "0xdD2FD4581271e230360230F9337D5c0430Bf44C0",
      amount: "2.0"
    }
  ],
  3: [
    {
      user: "0x2546BcD3c84621e976D8185a91A922aE77ECEc30",
      amount: "0.3"
    },
    {
      user: "0xdD2FD4581271e230360230F9337D5c0430Bf44C0",
      amount: "0.2"
    }
  ]
};

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

  if (USE_MOCK_DATA) {
    setGlobalState('allProjects', fakeProjects);
    return fakeProjects;
  }

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

  if (USE_MOCK_DATA) {
    // Filter the fake projects to find ones where the creator matches the provided address
    const created = fakeProjects.filter(
      project => project.creator.toLowerCase() === address.toLowerCase()
    );
    
    setGlobalState('createdProjects', created);
    return created;
  }

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
      return [true, ""];
    }
    return [false, "Project not found"];
  }

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
    status: project.cancelled,
    title: project.creator,
    targetFunds:ethers.formatEther(project.targetAmount),
    metadataUri: project.metadataUri,
    progress: project.fundsCollected.gt(0) 
      ? (project.fundsCollected.mul(100).div(project.targetAmount)).toNumber() 
      : 0
  };
}