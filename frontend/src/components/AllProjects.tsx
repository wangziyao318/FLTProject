import ProjectCard from './ProjectCard'
import { Project } from '../types'

interface AllProjectsProps {
    projects: Project[];
}

const AllProjects = ({ projects }: AllProjectsProps) => {
    return (
        <div>
            <h1 className="font-semibold text-xl text-gray-700 text-center">
                All Projects ({projects.length})
            </h1>
            {projects.length > 0 ? 
                (
                    <div className="flex justify-center items-center flex-wrap mx-60 my-8">
                        {projects.map((project: Project) => (
                            <ProjectCard key={project.id} project={project}/>
                        ))}
                    </div>
                ):
                (
                    <div className="flex justify-center items-center flex-wrap mx-60 my-8">
                        <p className="font-semibold text-xl text-gray-700 text-center">
                            No projects are currently available. 
                        </p>
                    </div>
                )
            }
        </div>
    )
}

export default AllProjects