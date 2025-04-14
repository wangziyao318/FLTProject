import React, { useState } from "react";
import { useWallet } from "../../contexts/WalletContext";
import { useProjects } from "../../hooks/useProjects";
import { uploadJSONToIPFS } from "../../utils/ipfs";
import { Transaction__factory } from "../../typechain-types";
import { CONTRACT_ADDRESSES } from "../../constants/contracts";
import { ProjectOnChain } from "../../types/project";
import ProjectCard from "../../components/ProjectCard";
import { ProjectMetadata } from "../../types/project";
import { useNavigate } from "react-router-dom";

const SubmitMilestone = () => {
    const { signer, address } = useWallet();
    const navigate = useNavigate();
    const { projects, loading } = useProjects(true); // ownedOnly=true

    const [selected, setSelected] = useState<{ project: ProjectOnChain; metadata: ProjectMetadata } | null>(null);
    const [description, setDescription] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selected || !signer || !address) return;

        try {
            setSubmitting(true);
            setError("");
            setSuccess(false);

            const metadata = {
                description,
                creator: address,
                projectId: selected.project.id.toString(),
                milestoneIndex: selected.project.currentMilestone.toString(),
                timestamp: Date.now()
            };

            const uri = await uploadJSONToIPFS(metadata);

            const contract = Transaction__factory.connect(CONTRACT_ADDRESSES.Transaction, signer);
            const tx = await contract.submitMilestone(selected.project.id, uri);
            await tx.wait();

            setSuccess(true);
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Submission failed");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={{ padding: "2rem" }}>
            <button onClick={() => navigate("/")}>← Back to Home</button>
            <h1>Submit Milestone</h1>

            {!selected && (
                <>
                    <p>Select a project to submit a milestone for:</p>
                    {loading ? (
                        <p>Loading your projects...</p>
                    ) : (
                        <div>
                            {projects.map(p => (
                                <ProjectCard
                                    key={p.project.id.toString()}
                                    project={p.project}
                                    metadata={p.metadata}
                                    onSelect={() => setSelected(p)}
                                />
                            ))}
                        </div>
                    )}
                </>
            )}

            {selected && (
                <form onSubmit={handleSubmit} style={{ maxWidth: 500 }}>
                    <h2>Submit milestone for: {selected.metadata.title}</h2>

                    <label>Description:</label><br />
                    <textarea
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        rows={5}
                        required
                        style={{ width: "100%", marginBottom: "1rem" }}
                    />

                    <button type="submit" disabled={submitting}>
                        {submitting ? "Submitting..." : "Submit Milestone"}
                    </button>

                    {success && <p style={{ color: "green" }}>✅ Milestone submitted successfully!</p>}
                    {error && <p style={{ color: "red" }}>{error}</p>}

                    <br />
                    <button onClick={() => setSelected(null)} type="button" style={{ marginTop: "1rem" }}>
                        ← Change Project
                    </button>
                </form>
            )}
        </div>
    );
};

export default SubmitMilestone;
