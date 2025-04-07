import ButtonVariant from "./ButtonVariant";
import { useNavigate } from "react-router-dom";
import { createProjectPath } from "./RouteConstants";

interface AddProjectButtonProps {
    style?: string;
    disabled?: boolean;
}

const AddProjectButton = ({ 
    style = "px-8 py-4 text-lg bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg transition-all", 
    disabled = false 
}: AddProjectButtonProps) => {
    const navigate = useNavigate();

    const routeChange = () => {
        navigate(createProjectPath)
    };

    return (
        <ButtonVariant 
            type="button" 
            text="Create Project" 
            style={`${style} rounded-lg font-medium transform hover:-translate-y-0.5`}
            disabled={disabled} 
            clickHandler={routeChange}
        />
    )
}
export default AddProjectButton;