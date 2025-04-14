import React from "react";
import { useWallet } from "../contexts/WalletContext";

const ConnectButton = () => {
    const { address, connect, disconnect } = useWallet();

    return (
        <div style={{ marginBottom: "1rem" }}>
            {address ? (
                <>
                    <p>Connected as: <strong>{address}</strong></p>
                    <button onClick={disconnect}>Logout</button>
                </>
            ) : (
                <button onClick={connect}>Connect Wallet</button>
            )}
        </div>
    );
};

export default ConnectButton;
