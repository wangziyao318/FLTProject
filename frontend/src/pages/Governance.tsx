import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import { toastSuccess, toastError } from '../components/toastMsg';
import Slogan from "../components/Slogan";
import ButtonVariant from "../components/ButtonVariant";
import { 
  useGlobalState, 
  getGlobalState
} from "../utils/globalState";
import { 
  getProjects, 
  releaseMilestone, 
  markMilestoneFailed
} from "../utils/contractServices";
import { 
  getProjectStatus,
  formatAddress,
  canReleaseMilestone
} from "../utils/helpers";
import { buildProjectPath } from "../components/RouteConstants";
import { Project } from "../types"; // Import Project type

const Governance = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isOwner] = useGlobalState("isOwner");
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [milestoneMetadata, setMilestoneMetadata] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const allProjects = await getProjects();
      // Filter for projects that need milestone approvals
      const filteredProjects = allProjects.filter(project => 
        project.campaignSuccessful && 
        !project.cancelled && 
        project.approvedMilestones < project.totalMilestones
      );
      setProjects(filteredProjects);
      setLoading(false);
    };
    
    fetchData();
  }, []);

  const handleProjectClick = (project: Project) => {
    setSelectedProject(project);
    // Generate a placeholder milestone metadata
    const nextMilestone = project.approvedMilestones + 1;
    setMilestoneMetadata(`ipfs://milestone_${project.id}_${nextMilestone}`);
  };

  const handleReleaseMilestone = async () => {
    if (!selectedProject) return;
    
    try {
      const [success, msg] = await releaseMilestone(selectedProject.id, milestoneMetadata);
      
      if (success) {
        toastSuccess(`Milestone released successfully for project #${selectedProject.id}`);
        
        // Refresh projects after milestone release
        const allProjects = await getProjects();
        const filteredProjects = allProjects.filter(project => 
          project.campaignSuccessful && 
          !project.cancelled && 
          project.approvedMilestones < project.totalMilestones
        );
        setProjects(filteredProjects);
        
        // Clear selection
        setSelectedProject(null);
        setMilestoneMetadata("");
      } else {
        toastError(`Failed to release milestone: ${msg}`);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toastError(`Error: ${errorMessage}`);
    }
  };

  const handleMarkFailed = async () => {
    if (!selectedProject) return;
    
    try {
      const [success, msg] = await markMilestoneFailed(selectedProject.id);
      
      if (success) {
        toastSuccess(`Milestone marked as failed for project #${selectedProject.id}`);
        
        // Refresh projects after marking milestone as failed
        const allProjects = await getProjects();
        const filteredProjects = allProjects.filter(project => 
          project.campaignSuccessful && 
          !project.cancelled && 
          project.approvedMilestones < project.totalMilestones
        );
        setProjects(filteredProjects);
        
        // Clear selection
        setSelectedProject(null);
        setMilestoneMetadata("");
      } else {
        toastError(`Failed to mark milestone as failed: ${msg}`);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toastError(`Error: ${errorMessage}`);
    }
  };

  const viewProject = (projectId: number) => {
    navigate(buildProjectPath(projectId));
  };

  if (!isOwner) {
    return (
      <div className="flex flex-col justify-center items-center pt-24 min-h-screen">
        <div className="text-center p-8 max-w-2xl">
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p className="mb-6">You need to be the contract owner to access the governance dashboard.</p>
          <ButtonVariant 
            type="button"
            text="Return to Home"
            style="bg-gray-600 hover:bg-gray-700"
            clickHandler={() => navigate('/')}
            disabled={false}
          />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="pt-16">
      <Slogan text1="Governance Dashboard" text2="Manage Project Milestones" />
      
      <div className="max-w-7xl mx-auto p-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Projects List */}
          <div className="w-full md:w-1/2 bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-bold mb-4">Projects Awaiting Milestone Approval</h2>
            
            {projects.length === 0 ? (
              <div className="bg-gray-100 p-6 rounded-lg text-center">
                <p>No projects currently need milestone approvals.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {projects.map((project: Project) => (
                  <div 
                    key={project.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedProject?.id === project.id 
                        ? 'bg-purple-100 border-purple-300' 
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                    onClick={() => handleProjectClick(project)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold">{project.metadata?.title || `Project #${project.id}`}</h3>
                        <p className="text-sm text-gray-600">Creator: {formatAddress(project.creator)}</p>
                      </div>
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                        project.campaignSuccessful ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {getProjectStatus(project)}
                      </span>
                    </div>
                    
                    <div className="mt-3 text-sm">
                      <div className="flex justify-between">
                        <span>Milestone Progress:</span>
                        <span className="font-medium">{project.approvedMilestones}/{project.totalMilestones}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Funds Collected:</span>
                        <span className="font-medium">{project.fundsCollected} ETH</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Funds Released:</span>
                        <span className="font-medium">{project.releasedFunds} ETH</span>
                      </div>
                    </div>
                    
                    <button 
                      className="mt-3 text-blue-600 text-sm underline"
                      onClick={(e) => {
                        e.stopPropagation();
                        viewProject(project.id);
                      }}
                    >
                      View Project Details
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Milestone Actions */}
          <div className="w-full md:w-1/2 bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-bold mb-4">Milestone Management</h2>
            
            {selectedProject ? (
              <div>
                <div className="bg-gray-100 p-4 rounded-lg mb-4">
                  <h3 className="font-bold text-lg">
                    {selectedProject.metadata?.title || `Project #${selectedProject.id}`}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Next Milestone: {selectedProject.approvedMilestones + 1} of {selectedProject.totalMilestones}
                  </p>
                  <p className="text-sm text-gray-600">
                    Funds to release: {parseFloat(selectedProject.targetAmount) / selectedProject.totalMilestones} ETH
                  </p>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Milestone Metadata URI:
                  </label>
                  <input
                    type="text"
                    value={milestoneMetadata}
                    onChange={(e) => setMilestoneMetadata(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter IPFS URI for milestone metadata"
                  />
                </div>
                
                <div className="flex space-x-3 mt-6">
                  <ButtonVariant 
                    type="button"
                    text="Approve & Release Funds"
                    style="bg-green-600 hover:bg-green-700"
                    clickHandler={handleReleaseMilestone}
                    disabled={false}
                  />
                  
                  <ButtonVariant 
                    type="button"
                    text="Mark as Failed"
                    style="bg-red-600 hover:bg-red-700"
                    clickHandler={handleMarkFailed}
                    disabled={false}
                  />
                </div>
                
                <div className="mt-4 text-sm text-gray-500">
                  <p>
                    <strong>Note:</strong> Approving a milestone will release funds to the creator and 
                    reward them with FLT tokens. Marking a milestone as failed will penalize the creator.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-gray-100 p-6 rounded-lg text-center">
                <p>Select a project from the left to manage its milestones.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <ToastContainer 
        className="text-lg text-gray-600 text-center font-bold"
        style={{ height: '100px', width: '300px' }}
      />
    </div>
  );
};

export default Governance;