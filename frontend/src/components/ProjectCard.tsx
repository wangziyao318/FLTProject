import { useNavigate } from "react-router-dom";
import ButtonVariant from './ButtonVariant';
import ContributeButton from './ContributeButton';
import { buildProjectPath } from "./RouteConstants";
import { getProjectStatus, getProjectProgress, formatAddress } from "../utils/helpers";
import { Project } from "../types";

interface ProjectCardProps {
    project: Project;
}

const ProjectCard = ({ project }: ProjectCardProps) => {
    const navigate = useNavigate();
    const status = getProjectStatus(project);
    const progress = getProjectProgress(project);

    const routeChange = () => {
        navigate(buildProjectPath(project.id));
    };

    return (
        <div 
            className="rounded-xl shadow-lg w-80 bg-gray-100 m-6 p-4 hover:cursor-pointer"
            onClick={routeChange}
        >
            {project.metadata?.imageUrl ? (
                <img
                    src={project.metadata.imageUrl}
                    alt={project.metadata?.title || "Project Image"}
                    className="rounded-xl h-64 w-full object-cover"
                />
            ) : (
                <div className="rounded-xl h-64 w-full bg-gray-300 flex items-center justify-center">
                    <span className="text-gray-500">No Image</span>
                </div>
            )}

            <div className="flex flex-col p-4">
                <div>
                    <div className="flex justify-between items-center">
                        <h3 className='font-bold text-lg truncate'>{project.metadata?.title || `Project #${project.id}`}</h3>
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                            status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                            status === 'FUNDED' ? 'bg-blue-100 text-blue-800' :
                            status === 'SUCCESSFUL' ? 'bg-purple-100 text-purple-800' :
                            status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                        }`}>
                            {status}
                        </span>
                    </div>
                    <p className="mt-1 text-gray-400 text-left text-base leading-tight truncate">
                        {project.metadata?.description || "No description available"}
                    </p>
                </div>

                <div className='flex justify-between items-center font-bold mt-3 mb-2 text-gray-700'>
                    <small className="truncate">
                        Creator: {formatAddress(project.creator)}
                    </small>
                    
                    <small className="text-gray-500">
                        Milestones: {project.approvedMilestones}/{project.totalMilestones}
                    </small>
                </div>
                
                <div className="w-full bg-gray-300 overflow-hidden mt-2">
                    <div
                        className="bg-gray-700 text-center p-0.5 rounded-l-full"
                        style={{ width: `${progress}%` }}
                    >
                    </div>
                </div>

                <div className="flex justify-between items-center font-bold mt-1 mb-2 text-gray-700">
                    <small>{project.fundsCollected} ETH Raised</small>
                    <small className='flex justify-start items-center'>Goal: {project.targetAmount} ETH</small>
                </div>

                <div className='flex justify-between items-center flex-wrap mt-4 mb-2 text-gray-500 font-bold'>
                    <div>
                        <ContributeButton project={project}/>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ProjectCard;