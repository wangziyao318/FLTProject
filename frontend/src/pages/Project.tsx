import { useParams } from "react-router-dom";
import ProjectDetails from "./ProjectDetails";
import { getProject, getContributions } from "../utils/contractServices";
import { useState, useEffect } from "react";
import { Project as ProjectType, Contribution } from "../types"; // Import types with alias to avoid naming conflict

const Project = () => {
    const { id } = useParams<{ id: string }>();
    const [project, setProject] = useState<ProjectType | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        // Function to fetch project details when the component mounts
        const fetchProjectDetail = async () => {
            try {
                setLoading(true);
                
                if (!id) {
                    throw new Error("Project ID is missing");
                }
                
                // Fetch project details
                const projectData = await getProject(id);
                setProject(projectData);
                                
                setLoading(false);
            } catch (error) {
                console.error('Error fetching project details:', error);
                setError(new Error('Failed to load project. Please try again later.'));
                setLoading(false);
            }
        };
  
        fetchProjectDetail();
    }, [id]);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-red-600 text-center">
                    <h3 className="text-xl font-bold">Error</h3>
                    <p>{error.message}</p>
                </div>
            </div>
        );
    }

    return (
       <div>

        {project ? ( <ProjectDetails project={project}/>) :
       <p>Loading Project Details....</p>}
 
      </div>

    );
}

export default Project;