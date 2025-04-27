import { ProjectOnChain, ProjectMetadata } from "../types/project";

type Props = {
    project: ProjectOnChain;
    metadata: ProjectMetadata;
    onSelect?: (id: bigint) => void;
    contribution?: bigint | null;
};

const getStatus = (project: ProjectOnChain): string => {
    if (!project.campaignEnded) return "🟡 Raising Funds";
    if (project.cancelled) return "❌ Cancelled";
    if (project.completed) return "✅ Completed";
    return "⏳ Active";
};

const ProjectCard = ({ project, metadata, onSelect, contribution = null }: Props) => {
    const eth = (wei: bigint) => Number(wei) / 1e18;

    return (
        <div
            className="rounded-xl shadow-lg w-80 bg-gray-100 m-6 p-4"
            style={{
                border: "1px solid #ccc",
                borderRadius: "8px",
                padding: "1rem",
                marginBottom: "1rem",
                cursor: onSelect ? "pointer" : "default",
            }}
            onClick={() => onSelect?.(project.id)}
        >
            <h3>{metadata.title}</h3>
            <p><strong>Description:</strong> {metadata.description}</p>
            <p><strong>Creator:</strong> {project.creator}</p>
            <p><strong>Target:</strong> {eth(project.targetFunds).toFixed(2)} ETH</p>
            <p><strong>Raised:</strong> {eth(project.totalFunds).toFixed(2)} ETH</p>
            <p><strong>Milestones:</strong> {project.currentMilestone} / {project.totalMilestones}</p>
            <p><strong>Status:</strong> {getStatus(project)}</p>

            {contribution !== null && (
                <p><strong>Your Contribution:</strong> {eth(contribution).toFixed(4)} ETH</p>
            )}
        </div>
    );
};

export default ProjectCard;
