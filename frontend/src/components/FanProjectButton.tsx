import ButtonVariant from "./ButtonVariant";
import { useNavigate } from "react-router-dom";
import { fanProjectsPath } from "./RouteConstants";

interface FanProjectButtonProps {
    disabled?: boolean;
    style?: string;
    className?: string;
}

const FanProjectButton = ({disabled = false, style = "bg-green-500 hover:bg-green-600"}: FanProjectButtonProps) => {
    const navigate = useNavigate();

    const routeChange = () => {
        navigate(fanProjectsPath);
    };

    return (
        <ButtonVariant 
            type="button" 
            text="Fan Projects" 
            disabled={disabled} 
            clickHandler={routeChange}
            style={style}
        />
    );
};

export default FanProjectButton;