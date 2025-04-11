import { useEffect, useState } from "react";
import { useGlobalState } from "../utils/globalState";
import FanProjectCard from "./FanProjectCard";
import { getProjects, getMilestones } from "../utils/contractServices";
import { Project, Milestone } from "../types";
import MilestoneVoteCard from './MilestoneVoteCard';

const FanProjects = () => {
  const [account] = useGlobalState("account");
  const [projects, setProjects] = useState<Project[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'projects' | 'milestones'>('projects');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [projectsData, milestonesData] = await Promise.all([
        getProjects(),
        getMilestones()
      ]);
      setProjects(projectsData);
      setMilestones(milestonesData);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [account]);

  const handleContributionSuccess = () => {
    fetchData(); // Refresh the data
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="pt-20 px-4 pb-8 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Fan Dashboard</h1>
        
        {/* Tab */}
        <div className="flex border-b mb-6">
          <button
            className={`px-4 py-2 ${activeTab === 'projects' ? 'border-b-2 border-blue-500' : ''}`}
            onClick={() => setActiveTab('projects')}
          >
            All Projects ({projects.length})
          </button>
          <button
            className={`px-4 py-2 ${activeTab === 'milestones' ? 'border-b-2 border-blue-500' : ''}`}
            onClick={() => setActiveTab('milestones')}
          >
            Milestones to Vote ({milestones.length})
          </button>
        </div>

        {/* List of projects */}
        {activeTab === 'projects' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map(project => (
              <FanProjectCard
                key={project.id}
                project={project}
                account={account}
                onActionSuccess={handleContributionSuccess}
              />
            ))}
          </div>
        )}

        {/* List of milestones */}
        {activeTab === 'milestones' && (
          <div className="space-y-4">
            {milestones.map(milestone => (
              <MilestoneVoteCard 
                key={milestone.proposalId}
                milestone={milestone}
                account={account}
                onVoteSuccess={handleContributionSuccess}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FanProjects;