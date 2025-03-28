interface ButtonVariantProps {
    type: "button" | "submit" | "reset";
    text: string;
    clickHandler: () => void;
    style: string;
    disabled: boolean;
    bgColor?: string; // For backward compatibility
    hoverColor?: string; // For backward compatibility
    onClick?: () => void; // For backward compatibility
  }
  
  const ButtonVariant = ({
    type,
    text,
    clickHandler,
    style,
    disabled,
    bgColor,
    hoverColor,
    onClick
  }: ButtonVariantProps) => {
    // Handle backward compatibility with different prop names
    const handleClick = onClick || clickHandler;
    const buttonStyle = style || `${bgColor} ${hoverColor}`;
  
    return (
        <button
            type={type}
            // default style with customized style
            className={`px-6 py-2.5 text-white font-semibold text-xs leading-tight rounded-full shadow-md ${buttonStyle} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={handleClick}
            disabled={disabled}
        >
            {text}
        </button>
    )
  }
  
  export default ButtonVariant