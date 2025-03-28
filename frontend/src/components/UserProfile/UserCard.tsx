import { formatAddress } from "../../utils/helpers";
import { useNavigate } from "react-router-dom";
import ButtonVariant from "../ButtonVariant";
import { createProjectPath } from "../RouteConstants";
import { User } from "../../types"; // Import the User type

interface UserCardProps {
    user: User;
}

const UserCard = ({ user }: UserCardProps) => {
    const navigate = useNavigate();

    const handleCreateProject = () => {
        navigate(createProjectPath);
    };

    return (
        <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden mt-8">
            <div className="md:flex">
                <div className="w-full md:w-1/3 bg-gray-800 p-8 text-center">
                    <div className="flex justify-center">
                        <div className="inline-flex h-32 w-32 items-center justify-center rounded-full bg-gray-200 text-gray-700">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                    </div>
                    <h2 className="mt-4 text-xl font-bold text-white">Your Wallet</h2>
                    <div className="mt-2 bg-gray-700 rounded-md px-3 py-2 text-gray-300 font-mono text-sm break-all">
                        {user.address}
                    </div>
                    <div className="mt-6">
                        <ButtonVariant 
                            type="button"
                            text="Create New Project"
                            style="bg-blue-500 hover:bg-blue-600 w-full"
                            clickHandler={handleCreateProject}
                            disabled={false}
                        />
                    </div>
                </div>
                
                <div className="w-full md:w-2/3 p-8">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Account Overview</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 shadow">
                            <div className="flex items-center">
                                <div className="rounded-full p-2 bg-blue-200">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <h4 className="text-sm font-medium text-blue-900">ETH Balance</h4>
                                    <p className="text-2xl font-bold text-blue-800">{parseFloat(user.balance).toFixed(4)} ETH</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 shadow">
                            <div className="flex items-center">
                                <div className="rounded-full p-2 bg-purple-200">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <h4 className="text-sm font-medium text-purple-900">FLT Balance</h4>
                                    <p className="text-2xl font-bold text-purple-800">{parseFloat(user.fltBalance).toFixed(2)} FLT</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 shadow">
                            <div className="flex items-center">
                                <div className="rounded-full p-2 bg-green-200">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <h4 className="text-sm font-medium text-green-900">Projects Created</h4>
                                    <p className="text-2xl font-bold text-green-800">{user.projectsCreated}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-4 shadow">
                            <div className="flex items-center">
                                <div className="rounded-full p-2 bg-amber-200">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 11V9a2 2 0 00-2-2m2 4v4a2 2 0 104 0v-1m-4-3H9m2 0h4m6 1a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <h4 className="text-sm font-medium text-amber-900">Projects Backed</h4>
                                    <p className="text-2xl font-bold text-amber-800">{user.projectsContributed}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="mt-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <h4 className="font-bold text-gray-700 mb-2">About FLT Tokens</h4>
                        <p className="text-sm text-gray-600">
                            FLT tokens are used for governance and rewards in the platform. You earn FLT when you contribute to projects or complete milestones. 
                            FLT can be lost as penalties for withdrawing contributions or failing to complete milestones.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default UserCard;