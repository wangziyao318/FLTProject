import { useEffect, useState } from "react";
import Slogan from "../components/Slogan";
import UserCard from "../components/UserCard";
import { 
    connectWallet, 
    getCreatedProjects, 
    getContributedProjects, 
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
                const contributed = await getContributedProjects(account);
                setContributedProjects(contributed);
                setLoading(false);
            };
            fetchUserData();
        }
    }, [account]);

    return (
        <div className="flex flex-col justify-center items-center">
            <div>
                <Slogan text1="User Profile Overview" text2 = "" />

                <UserCard user={profile} />
            </div>
        </div>

    )
}
export default UserProfile

