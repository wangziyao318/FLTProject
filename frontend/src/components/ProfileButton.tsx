import ButtonVariant from "./ButtonVariant";
import { useNavigate } from "react-router-dom";
import { userProfilePath } from "./RouteConstants";

interface ProfileButtonProps {
    address?: string;
    disabled?: boolean;
    style?: string;
}

const ProfileButton = ({disabled = false, style = "bg-blue-500 hover:bg-blue-600"}: ProfileButtonProps) => {
    const navigate = useNavigate();

    const routeChange = () => {
        navigate(userProfilePath)
    };

    return (
        <ButtonVariant 
            type="button" 
            text="My Profile" 
            disabled={disabled} 
            clickHandler={routeChange}
            style={style}
        />
    )
}

export default ProfileButton;