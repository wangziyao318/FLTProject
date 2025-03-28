import ButtonVariant from "./ButtonVariant";
import { useNavigate } from "react-router-dom";
import { createProjectPath } from "./RouteConstants";

interface AddProjectButtonProps {
    style?: string;
    disabled?: boolean;
}

const AddProjectButton = ({style = "bg-blue-500 hover:bg-blue-600", disabled = false}: AddProjectButtonProps) => {
    const navigate = useNavigate();

    const routeChange = () => {
        navigate(createProjectPath)
    };

    return (
        <ButtonVariant 
            type="button" 
            text="Create Project" 
            style={style} 
            disabled={disabled} 
            clickHandler={routeChange}
        />
    )
}

export default AddProjectButton;