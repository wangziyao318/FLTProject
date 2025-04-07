import { useEffect, useState } from "react";
import Slogan from "../components/Slogan";
import UserCard from "../components/UserCard";
import { 
    connectWallet, 
    getCreatedProjects,  
    getUserBalance,
    getFLTBalance
} from "../utils/contractServices";
import { useGlobalState } from "../utils/globalState";
import { useNavigate } from "react-router";
import { buildAbsoluteProjectPath } from "../components/RouteConstants";
import { getProjectStatus, formatAddress } from "../utils/helpers";
import { ToastContainer } from 'react-toastify';
import { Project, ContributedProject, User } from "../types";

const UserProfile = () => {
    // Global state
    const [account] = useGlobalState("account");
    const [balance] = useGlobalState("accountBalance");
    const [fltBalance] = useGlobalState("fltBalance");
    const [isBlacklisted] = useGlobalState("isBlacklisted");
    
    // Local state
    const [createdProjects, setCreatedProjects] = useState<Project[]>([]);
    const [contributedProjects, setContributedProjects] = useState<ContributedProject[]>([]);
    const [loading, setLoading] = useState(true);
    
    const navigate = useNavigate();
    
    // User profile data
    const profile: User = {
        address: account,
        projectsCreated: createdProjects.length,
        projectsContributed: contributedProjects.length,
        balance: balance,
        fltBalance: fltBalance
    };

    // Navigation helper
    const navigateToProject = (projectId: number) => {
        navigate(buildAbsoluteProjectPath(projectId));
    };

    // Initialize wallet connection
    useEffect(() => {
        const init = async () => {
            await connectWallet();
            setLoading(false);
        };
        init();
    }, []);

    // Fetch user data when account is available
    useEffect(() => {
        if (account) {
            setLoading(true);
            const fetchUserData = async () => {
                await getUserBalance(account);
                await getFLTBalance(account);
                const created = await getCreatedProjects(account);
                setCreatedProjects(created);
                setLoading(false);
            };
            fetchUserData();
        }
    }, [account]);

    const blacklistedWarning = isBlacklisted ? (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded max-w-3xl mx-auto">
            <h3 className="font-bold text-lg">Account Blacklisted</h3>
            <p>Your account has been blacklisted. This may be due to cancelling projects or withdrawing contributions.</p>
            <p>Blacklisted accounts cannot create projects or interact with existing ones.</p>
        </div>
    ) : null;

    return (
        <div className="flex flex-col justify-center items-center">
            <div>
                <Slogan text1="User Profile Overview" text2 = "" />

                {blacklistedWarning}

                <UserCard user={profile} />
                {createdProjects.length > 0 && (
                    <div className="mt-6 max-w-3xl mx-auto">
                        <h2 className="text-xl font-bold mb-4">Projects Created</h2>
                        <div className="grid grid-cols-1 gap-4">
                            {createdProjects.map(project => (
                                <div 
                                    key={project.id} 
                                    className="bg-white p-4 rounded shadow cursor-pointer hover:shadow-md"
                                    onClick={() => navigateToProject(project.id)}
                                >
                                    <h3 className="font-bold">{project.title || `Project ${project.id}`}</h3>
                                    <div className="flex justify-between mt-2">
                                        <span>Status: <span className={
                                            project.status === "ACTIVE" ? "text-blue-600" :
                                            project.status === "FUNDED" ? "text-green-600" :
                                            project.status === "COMPLETED" ? "text-purple-600" :
                                            "text-red-600"
                                        }>{project.status}</span></span>
                                        <span>Funded: {project.fundsCollected}/{project.targetAmount} ETH</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>

    )
}
export default UserProfile

