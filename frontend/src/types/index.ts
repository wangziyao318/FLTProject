// src/types/index.ts (or src/types.ts)

// Project interface defines the structure of a project in the application
export interface Project {
  id: number;
  creator: string;
  totalMilestones: number;
  approvedMilestones: number;
  targetAmount: string;
  fundsCollected: string;
  releasedFunds: string;
  campaignSuccessful: boolean;
  campaignClosed: boolean;
  cancelled: boolean;
  metadataUri: string;
  title: string;
  targetFunds: string;
  status: string;
  progress: number;
  metadata?: {
    title?: string;
    description?: string;
    imageUrl?: string;
    milestones?: Array<{
      title: string;
      description: string;
    }>;
  };
}

// Contribution interface defines the structure of a user's contribution to a project
export interface Contribution {
  user: string;
  amount: string;
}

// ContributedProject extends Project with an additional contributedAmount field
export interface ContributedProject extends Project {
  contributedAmount: string;
}

// User interface defines the structure of a user in the application
export interface User {
  address: string;
  balance: string;
  fltBalance: string;
  projectsCreated: number;
  projectsContributed: number;
}

// Form value interfaces for different forms in the application
export interface CreateProjectFormValues {
  title: string;
  description: string;
  targetAmount: string;
  totalMilestones: string;
  imageUrl: string;
}

export interface ContributeFormValues {
  amount: string;
}

// Form helper interfaces for form submission
export interface FormHelpers {
  resetForm: () => void;
  setSubmitting: (isSubmitting: boolean) => void;
}

// Parameters for contract service functions
export interface CreateProjectParams {
  totalMilestones: number;
  targetAmount: string | number;
  metadataUri: string;
}

// Type definitions for global state
export interface GlobalState {
  account: string;
  accountBalance: string;
  fltBalance: string;
  creatorTokenBalance: string;
  fanTokenBalance: string;
  active: boolean;
  allProjects: Project[];
  project: Project | null;
  contributions: Contribution[];
  createdProjects: Project[];
  contributedProjects: ContributedProject[];
  isOwner: boolean;
  isBlacklisted: boolean;
  pendingMilestones: any[];
}