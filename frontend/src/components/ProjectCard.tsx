import { useNavigate } from "react-router-dom";
import ButtonVariant from './ButtonVariant';
import { buildProjectPath } from "./RouteConstants";
import { getProjectStatus, getProjectProgress, formatAddress } from "../utils/helpers";
import { Project } from "../types";
import '../pages/ProjectForm.css';

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
            <div className="form-wrapper">
                <div className="project-form-container">
                        <div className="form-header">
                            <h1>{project.metadata?.title}</h1>
                        </div>
                        
                        {/* Project Info */}
                        <div className="form-field">
                            <label>
                                <span className="field-label">Project Description:</span>
                                <p className="milestone-note">
                                    {project.metadata?.description}
                                </p>
                                <span className="field-label">Project Status: {project.status}</span>
                            </label>
                        </div>
                          </div>
            </div>
        </div>
    )
}
export default ProjectCard;