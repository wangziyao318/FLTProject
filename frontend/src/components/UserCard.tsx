import { formatAddress } from "../utils/helpers";
import { useNavigate } from "react-router-dom";
import { createProjectPath } from "./RouteConstants";
import { User } from "../types"; // Import the User type
import '../pages/ProjectForm.css';

interface UserCardProps {
    user: User;
}

const UserCard = ({ user }: UserCardProps) => {
    const navigate = useNavigate();

    const handleCreateProject = () => {
        navigate(createProjectPath);
    };

    return (
        <div className="form-wrapper">
        <div className="project-form-container">
                <div className="form-header">
                    <h1>User Information</h1>
                </div>
                
                {/* User Info */}
                <div className="info-box">
                    <h4>Wallet Information:</h4>
                    <ul>
                        <li>• Your Wallet Address: {user.address} </li>
                        <li>• ETH Balance: {user.balance && `${user.balance} ETH`} </li>                                
                        <li>• FLT Balance: {user.fltBalance && `${user.fltBalance} FLT`} </li>
                    </ul>
                    <h4>Project Information:</h4>
                    <ul>
                        <li>• Projects Created: {user.projectsCreated && `${user.projectsCreated}`} </li>
                        <li>• Projects Contributed </li>                                
                    </ul>                    
                </div>
                  </div>
                </div>
    )
}
export default UserCard;