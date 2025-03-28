import { useNavigate } from "react-router-dom";
import { buildProjectPath } from "./RouteConstants";
import { Project } from "../types";
import React from "react";

interface ContributeButtonProps {
    project: Project;
}

const ContributeButton = ({ project }: ContributeButtonProps) => {
    const navigate = useNavigate();

    const routeChange = (event: React.MouseEvent) => {
        event.stopPropagation();
        navigate(buildProjectPath(project.id));
    };

    // Disable button if campaign is closed or cancelled
    const isDisabled = project.campaignClosed || project.cancelled;

    return (
        <button
            type="button" 
            className={`px-6 py-2.5 text-white font-semibold text-xs leading-tight rounded-full shadow-md w-30 text-[10px] ${
                isDisabled ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-600 hover:bg-gray-700'
            }`}
            onClickCapture={routeChange}
            disabled={isDisabled}
        >
            {isDisabled ? 'CLOSED' : 'CONTRIBUTE'}
        </button>
    )
}

export default ContributeButton;