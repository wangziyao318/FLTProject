import { useEffect, useState } from "react";
import Slogan from "../components/Slogan";
import UserCard from "../components/UserProfile/UserCard";
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
import { Project, ContributedProject, User } from "../types"; // Import the types

const UserProfile = () => {
    const [account] = useGlobalState("account");
    const [balance] = useGlobalState("accountBalance");
    const [fltBalance] = useGlobalState("fltBalance");
    const [createdProjects, setCreatedProjects] = useState<Project[]>([]); // Set type as Project array
    const [contributedProjects, setContributedProjects] = useState<ContributedProject[]>([]); // Set type as ContributedProject array
    const [loading, setLoading] = useState(true);

    const navigate = useNavigate();
    
    const routeChange = (projectId: number) => { // Add type annotation for projectId
        navigate(buildAbsoluteProjectPath(projectId));
    };

    const profile: User = { // Define the profile with User type
        address: account,
        projectsCreated: createdProjects.length,
        projectsContributed: contributedProjects.length,
        balance: balance,
        fltBalance: fltBalance
    };

    useEffect(() => {
        const init = async () => {
            await connectWallet();
            setLoading(false);
        };
        init();
    }, []);

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

    if (!account) {
        return (
            <div className="flex flex-col justify-center items-center min-h-screen">
                <div className="text-center p-8">
                    <h2 className="text-2xl font-bold mb-4">Connect your wallet to view your profile</h2>
                    <button 
                        onClick={connectWallet}
                        className="px-6 py-2.5 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-full shadow-md"
                    >
                        Connect Wallet
                    </button>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col justify-center items-center pt-16">
            <div>
                <Slogan text1="Your Profile" text2="" /> {/* Add empty text2 prop */}
                <UserCard user={profile} />
            </div>
            
            <div className="m-20 flex flex-col items-center w-full max-w-5xl">
                <div className="p-5 w-full">
                    <h3 className="text-xl font-bold mb-4">
                        Created Projects ({createdProjects.length})
                    </h3>
                    
                    {createdProjects.length === 0 ? (
                        <div className="w-full p-8 bg-gray-100 rounded-xl">
                            <div className="text-center">
                                <h3 className='font-bold text-lg'>No projects created</h3>
                                <p className="mt-2 text-gray-600">Create your first project to see it here.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {createdProjects.map((project: Project) => ( // Add type annotation to project
                                <div 
                                    key={project.id} 
                                    className="bg-gray-100 rounded-xl p-6 hover:shadow-lg transition-shadow cursor-pointer"
                                    onClick={() => routeChange(project.id)}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <h3 className='font-bold text-lg truncate mr-2'>
                                            {project.metadata?.title || `Project #${project.id}`}
                                        </h3>
                                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                                            project.cancelled ? 'bg-red-100 text-red-800' :
                                            project.campaignSuccessful ? 'bg-green-100 text-green-800' :
                                            'bg-gray-200 text-gray-800'
                                        }`}>
                                            {getProjectStatus(project)}
                                        </span>
                                    </div>
                                    
                                    <div className="flex justify-between items-center text-sm text-gray-600 mb-3">
                                        <span>Target: {project.targetAmount} ETH</span>
                                        <span>Raised: {project.fundsCollected} ETH</span>
                                    </div>
                                    
                                    <div className="w-full bg-gray-300 h-2 rounded-full overflow-hidden mb-3">
                                        <div
                                            className="bg-gray-700 h-full rounded-full"
                                            style={{ width: `${Math.min((parseFloat(project.fundsCollected) / parseFloat(project.targetAmount)) * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                    
                                    <div className="flex justify-between items-center text-sm">
                                        <span>Milestones: {project.approvedMilestones}/{project.totalMilestones}</span>
                                        <span>Released: {project.releasedFunds} ETH</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="mb-20 flex flex-col items-center w-full max-w-5xl">
                <div className="p-5 w-full">
                    <h3 className="text-xl font-bold mb-4">
                        Contributed Projects ({contributedProjects.length})
                    </h3>
                    
                    {contributedProjects.length === 0 ? (
                        <div className="w-full p-8 bg-gray-100 rounded-xl">
                            <div className="text-center">
                                <h3 className='font-bold text-lg'>No projects backed</h3>
                                <p className="mt-2 text-gray-600">Contribute to a project to see it here.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {contributedProjects.map((project: ContributedProject) => ( // Add type annotation to project
                                <div 
                                    key={project.id} 
                                    className="bg-gray-100 rounded-xl p-6 hover:shadow-lg transition-shadow cursor-pointer"
                                    onClick={() => routeChange(project.id)}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <h3 className='font-bold text-lg truncate mr-2'>
                                            {project.metadata?.title || `Project #${project.id}`}
                                        </h3>
                                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                                            project.cancelled ? 'bg-red-100 text-red-800' :
                                            project.campaignSuccessful ? 'bg-green-100 text-green-800' :
                                            'bg-gray-200 text-gray-800'
                                        }`}>
                                            {getProjectStatus(project)}
                                        </span>
                                    </div>
                                    
                                    <div className="mt-2 mb-3">
                                        <p className="text-sm text-gray-600">Creator: {formatAddress(project.creator)}</p>
                                        <p className="text-sm font-semibold mt-1">Your contribution: {project.contributedAmount} ETH</p>
                                    </div>
                                    
                                    <div className="flex justify-between items-center text-sm text-gray-600 mb-3">
                                        <span>Target: {project.targetAmount} ETH</span>
                                        <span>Raised: {project.fundsCollected} ETH</span>
                                    </div>
                                    
                                    <div className="w-full bg-gray-300 h-2 rounded-full overflow-hidden mb-3">
                                        <div
                                            className="bg-gray-700 h-full rounded-full"
                                            style={{ width: `${Math.min((parseFloat(project.fundsCollected) / parseFloat(project.targetAmount)) * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                    
                                    <div className="flex justify-between items-center text-sm">
                                        <span>Milestones: {project.approvedMilestones}/{project.totalMilestones}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            
            <ToastContainer 
                className="text-lg text-gray-600 text-center font-bold"
                style={{ height: '100px', width: '300px' }}
            />
        </div>
    );
}

export default UserProfile;