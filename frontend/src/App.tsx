// App.tsx
import React, { useState } from "react";
import { ethers } from "ethers";

// Placeholder function for IPFS upload.
// Replace with your actual IPFS integration (e.g., Pinata, Infura)
const uploadToIPFS = async (metadata: any): Promise<string> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve("ipfs://fakeHashForExample");
    }, 1500);
  });
};

const App: React.FC = () => {
  // State for wallet/account connection
  const [account, setAccount] = useState<string>("");
  // State for creator project form
  const [projectName, setProjectName] = useState<string>("");
  const [projectDescription, setProjectDescription] = useState<string>("");
  const [uploadStatus, setUploadStatus] = useState<string>("");
  // State for fan contribution form
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [contribution, setContribution] = useState<string>("");

  // Connect to MetaMask wallet
  const connectWallet = async () => {
    if ((window as any).ethereum) {
      try {
        const accounts: string[] = await (window as any).ethereum.request({
          method: "eth_requestAccounts",
        });
        setAccount(accounts[0]);
      } catch (error) {
        console.error("Wallet connection error:", error);
      }
    } else {
      alert("MetaMask not found. Please install MetaMask.");
    }
  };

  // Handler for creating a new project (Creator)
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    const metadata = {
      name: projectName,
      description: projectDescription,
      creator: account,
    };

    setUploadStatus("Uploading metadata to IPFS...");
    try {
      const ipfsUri = await uploadToIPFS(metadata);
      setUploadStatus("Metadata uploaded: " + ipfsUri);

      // Example: interact with your contract:
      // const provider = new ethers.BrowserProvider(window.ethereum);
      // const signer = await provider.getSigner();
      // const contract = new ethers.Contract(contractAddress, contractAbi, signer);
      // const tx = await contract.launchProject(ipfsUri);
      // await tx.wait();
    } catch (error) {
      console.error("Error uploading metadata:", error);
      setUploadStatus("Error uploading metadata.");
    }
  };

  // Handler for fan contribution
  const handleContribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) {
      alert("Please enter the project's IPFS URI or address.");
      return;
    }
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Example: interact with your contract to contribute ETH:
      // const contract = new ethers.Contract(contractAddress, contractAbi, signer);
      // const tx = await contract.contribute(selectedProject, {
      //   value: ethers.parseEther(contribution),
      // });
      // await tx.wait();
      alert("Contribution successful! (Simulated)");
    } catch (error) {
      console.error("Contribution error:", error);
      alert("Error during contribution.");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Crowdfunding dApp</h1>
      {/* Wallet Connection */}
      {!account ? (
        <button onClick={connectWallet}>Connect Wallet via MetaMask</button>
      ) : (
        <p>Connected as: {account}</p>
      )}

      <hr />

      {/* Creator: Launch Project */}
      <h2>Launch Project (Creator)</h2>
      <form onSubmit={handleCreateProject}>
        <div>
          <label>Project Name:</label>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Project Description:</label>
          <textarea
            value={projectDescription}
            onChange={(e) => setProjectDescription(e.target.value)}
            required
          />
        </div>
        <button type="submit">Launch Project</button>
      </form>
      {uploadStatus && <p>{uploadStatus}</p>}

      <hr />

      {/* Fan: Contribute to a Project */}
      <h2>Contribute to a Project (Fan)</h2>
      <form onSubmit={handleContribute}>
        <div>
          <label>Project IPFS URI (or Address):</label>
          <input
            type="text"
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Contribution (in ETH):</label>
          <input
            type="number"
            step="0.01"
            value={contribution}
            onChange={(e) => setContribution(e.target.value)}
            required
          />
        </div>
        <button type="submit">Contribute</button>
      </form>
    </div>
  );
};

export default App;
