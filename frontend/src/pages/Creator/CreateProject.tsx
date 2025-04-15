import React, { useState } from "react";
import { useWallet } from "../../contexts/WalletContext";
import { uploadJSONToIPFS } from "../../utils/ipfs";
import { CONTRACT_ADDRESSES } from "../../constants/contracts";
import { Transaction__factory } from "../../typechain-types";
import { ProjectMetadata } from "../../types/project";
import Slogan from "components/Slogan";

const CreateProject = () => {
    const { signer, address } = useWallet();

    const [metadata, setMetadata] = useState<ProjectMetadata>({
        title: "",
        description: "",
        creator: address ?? "",
        target: "",
        milestones: 1,
    });

    const [projectId, setProjectId] = useState<bigint | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (key: keyof ProjectMetadata, value: string | number) => {
        setMetadata(prev => ({ ...prev, [key]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!signer || !address) return alert("Please connect your wallet first");

        try {
            setLoading(true);
            setError("");

            const enriched: ProjectMetadata = {
                ...metadata,
                creator: address,
            };

            const ipfsUri = await uploadJSONToIPFS(enriched);
            const contract = Transaction__factory.connect(CONTRACT_ADDRESSES.Transaction, signer);
            const iface = Transaction__factory.createInterface();

            const tx = await contract.createProject(
                BigInt(Math.floor(Number(metadata.target) * 1e18)),      // convert ETH to wei
                metadata.milestones,                                     // uint8 is accepted as number
                ipfsUri
            );
            const receipt = await tx.wait();
            if (!receipt) throw new Error("Transaction failed with no receipt");

            for (const log of receipt.logs) {
                try {
                    const parsed = iface.parseLog(log);
                    if (parsed && parsed.name === "ProjectCreated") {
                        const pid = parsed.args.projectId as bigint;
                        setProjectId(pid);
                        console.log("✅ Project created with ID:", pid);
                        break;
                    }
                } catch {
                    // not a ProjectCreated log, skip
                }
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to create project.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: "2rem" }}>
            <Slogan text1="Create New Project" text2="" />

            <form onSubmit={handleSubmit} style={{ maxWidth: 300, margin: "0 auto", display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                    <label>Title:</label><br />
                    <input
                        value={metadata.title}
                        // style={{width: 400}}
                        onChange={e => handleChange("title", e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Description:</label><br />
                    <textarea
                        value={metadata.description}
                        onChange={e => handleChange("description", e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Target Funding (ETH):</label><br />
                    <input
                        type="number"
                        value={metadata.target}
                        onChange={e => handleChange("target", e.target.value)}
                        required
                        min="0.01"
                        step="0.01"
                    />
                </div>
                <div>
                    <label>Total Milestones:</label><br />
                    <input
                        type="number"
                        value={metadata.milestones}
                        onChange={e => handleChange("milestones", parseInt(e.target.value ?? "1"))}
                        required
                        min={1}
                        max={255}
                    />
                </div>

                <button type="submit" disabled={loading}>
                    {loading ? "Creating..." : "Create Project"}
                </button>
            </form>

            {projectId !== null && <p style={{ color: "green" }}>✅ Project created with projectId {projectId.toString()}</p>}
            {error && <p style={{ color: "red" }}>{error}</p>}
        </div>
    );
};

export default CreateProject;
