import { useMemo } from "react";
import { useProjects } from "../hooks/useProjects";
import { useContribution } from "../hooks/useContributions";
import ProjectCard from "./ProjectCard";

type Props = {
    ownedOnly?: boolean;
    contributedOnly?: boolean;
    onSelect?: (id: bigint) => void;
};

const ProjectList = ({ ownedOnly = false, contributedOnly = false, onSelect }: Props) => {
    const { projects, loading, error } = useProjects(ownedOnly);
    const { contributions } = useContribution();

    // Map projectId => fan's contribution amount
    const contributionMap = useMemo(() => {
        const map = new Map<string, bigint>();
        for (const c of contributions) {
            map.set(c.projectId.toString(), c.amount);
        }
        return map;
    }, [contributions]);

    const filteredProjects = useMemo(() => {
        return projects.filter(({ project }) => {
            const amount = contributionMap.get(project.id.toString());
            if (contributedOnly) {
                return amount != null && amount > 0n;
            }
            return true;
        });
    }, [projects, contributionMap, contributedOnly]);

    return (
        <div style={{ padding: "1rem" }}>
            {ownedOnly
                ? <h2>My Projects</h2>
                : contributedOnly
                    ? <h2>Projects I've Contributed To</h2>
                    : <h2>All Projects</h2>}

            {loading && <p>Loading projects...</p>}
            {error && <p style={{ color: "red" }}>{error}</p>}
            {!loading && filteredProjects.length === 0 && <p>No projects found.</p>}

            {filteredProjects.map(({ project, metadata }) => (
                <ProjectCard
                    key={project.id.toString()}
                    project={project}
                    metadata={metadata}
                    onSelect={onSelect}
                    contribution={contributionMap.get(project.id.toString()) ?? null}
                />
            ))}
        </div>
    );
};

export default ProjectList;
