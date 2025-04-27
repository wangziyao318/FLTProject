import { create } from '@web3-storage/w3up-client';
import { CID } from 'multiformats/cid';

let client: any = null;

const SPACE_DID = "did:key:z6MksG8fWHNSaGNFkM1mpgVySkmQAEAxypXiMoLdYF9wuxVx";

// Create and configure client
async function getClient() {
    if (!client) {
        client = await create();
        const account = await client.login("zwubc@ece.ubc.ca");
        await account.plan.wait();
        await client.setCurrentSpace(SPACE_DID);
    }

    return client;
}

// Upload a JSON object to IPFS
export async function uploadJSONToIPFS(data: object): Promise<string> {
    try {
        const client = await getClient();

        const json = JSON.stringify(data);
        const file = new File([json], "metadata.json", { type: "application/json" });

        const cid = await client.uploadFile(file);

        if (!cid) throw new Error(`Invalid CID returned from upload: ${cid}`);

        return `ipfs://${cid}`;
    } catch (err) {
        console.error("IPFS upload error:", err);
        throw new Error("Failed to upload to IPFS");
    }
}

// Download and parse JSON from an IPFS link
export async function downloadJSONFromIPFS<T>(ipfsUri: string): Promise<T> {
    try {
        // Extract CID from ipfs://CID or https://.../ipfs/CID
        let cid = "";

        if (ipfsUri.startsWith("ipfs://")) {
            cid = ipfsUri.replace("ipfs://", "");
        } else if (ipfsUri.includes("/ipfs/")) {
            cid = ipfsUri.split("/ipfs/")[1];
        } else {
            throw new Error(`Invalid IPFS URI: ${ipfsUri}`);
        }

        // Validate CID
        const parsed = CID.parse(cid); // throws if invalid

        // Use any IPFS gateway to fetch
        const res = await fetch(`https://${parsed.toString()}.ipfs.w3s.link`);
        if (!res.ok) throw new Error(`Failed to fetch IPFS content: ${res.status}`);

        return await res.json();
    } catch (err) {
        console.error("IPFS download error:", err);
        throw err;
    }
}
