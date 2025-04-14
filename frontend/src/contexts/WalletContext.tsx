import { createContext, useContext, useEffect, useState } from "react";
import { ethers } from "ethers";

// -------------------------------------------
// 1. Define the shape of the context state
// -------------------------------------------
type WalletContextType = {
    provider: ethers.BrowserProvider | null;    // Used for read-only blockchain access
    signer: ethers.JsonRpcSigner | null;        // Used to sign transactions (write access)
    address: string;                            // The user's connected wallet address
    connect: () => Promise<void>;               // Connect wallet function
    disconnect: () => void;                     // Disconnect wallet (clears context)
};

// -------------------------------------------
// 2. Create the context
// -------------------------------------------
const WalletContext = createContext<WalletContextType | null>(null);

// -------------------------------------------
// 3. Hook to access context from any component
// -------------------------------------------
export const useWallet = () => {
    const ctx = useContext(WalletContext);
    if (!ctx) throw new Error("useWallet must be used inside WalletProvider");
    return ctx;
};

// -------------------------------------------
// 4. WalletProvider to wrap the app
//    Manages connection and context values
// -------------------------------------------
export const WalletProvider = ({ children }: { children: React.ReactNode }) => {
    const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
    const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
    const [address, setAddress] = useState<string>("");

    // Connect to MetaMask and initialize provider/signer/address
    const connect = async () => {
        if (!window.ethereum) {
            alert("MetaMask not installed");
            return;
        }

        const browserProvider = new ethers.BrowserProvider(window.ethereum);
        await browserProvider.send("eth_requestAccounts", []);
        const connectedSigner = await browserProvider.getSigner();
        const userAddress = await connectedSigner.getAddress();

        setProvider(browserProvider);
        setSigner(connectedSigner);
        setAddress(userAddress);
    };

    // Disconnect wallet (clears context state)
    const disconnect = () => {
        setProvider(null);
        setSigner(null);
        setAddress("");
    };

    // Auto-connect if MetaMask is already authorized
    useEffect(() => {
        if (window.ethereum) {
            window.ethereum.request({ method: "eth_accounts" }).then((accounts: string[]) => {
                if (accounts.length > 0) {
                    connect(); // reconnect silently
                }
            });
        }
    }, []);

    return (
        <WalletContext.Provider value={{ provider, signer, address, connect, disconnect }}>
            {children}
        </WalletContext.Provider>
    );
};
