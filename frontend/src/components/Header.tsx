import { useEffect, useState } from "react";
import { useWallet } from "../contexts/WalletContext";
import { FLT__factory } from "../typechain-types";
import { CONTRACT_ADDRESSES } from "../constants/contracts";
import { formatEther } from "ethers";
import { useNavigate } from "react-router-dom";

const Header = () => {
    const navigate = useNavigate();

    const { address, provider, connect, disconnect } = useWallet();
    const [ethBalance, setEthBalance] = useState<string | null>(null);
    const [creatorFltBalance, setCreatorFltBalance] = useState<string | null>(null);
    const [fanFltBalance, setFanFltBalance] = useState<string | null>(null);
    const [isBlacklisted, setIsBlacklisted] = useState(false);

    useEffect(() => {
        const fetchBalances = async () => {
            if (!address || !provider) return;

            const balance = await provider.getBalance(address);
            setEthBalance(formatEther(balance));

            const flt = FLT__factory.connect(CONTRACT_ADDRESSES.FLT, provider);
            const creatorBalance = await flt.balanceOf(address, 0);
            const fanBalance = await flt.balanceOf(address, 1);
            setCreatorFltBalance(formatEther(creatorBalance));
            setFanFltBalance(formatEther(fanBalance));

            const BLACKLIST_ROLE = await flt.BLACKLIST_ROLE();
            const blacklisted = await flt.hasRole(BLACKLIST_ROLE, address);
            setIsBlacklisted(blacklisted);
        };

        fetchBalances();
    }, [address, provider]);

    return (
        <header style={{
            padding: "1rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid #ccc"
        }}>
            <div style={{ fontWeight: "bold" }}>Crowdfunding Platform</div>
            <div>
                <button onClick={() => navigate("/")}>🏠 Home</button>
            </div>
            <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
                
                {address && (
                    <>
                        <div>ETH: {ethBalance ? `${Number(ethBalance).toFixed(4)}` : "…"}</div>
                        <div>CreatorFLT: {creatorFltBalance?.toString() ?? "…"}</div>
                        <div>FanFLT: {fanFltBalance?.toString() ?? "…"}</div>
                        <p style={{ margin: 0 }}>{isBlacklisted? <span style={{color: "red"}}>Blacklisted account:</span> : "Connected as:"} <strong>{address.slice(0, 6)}...{address.slice(-4)}</strong></p>
                    </>
                )}
                <div>
                    {address ? (
                            <button onClick={disconnect}>🚪 Logout</button>
                    ) : (
                        <button onClick={connect}>💰 Connect Wallet</button>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
