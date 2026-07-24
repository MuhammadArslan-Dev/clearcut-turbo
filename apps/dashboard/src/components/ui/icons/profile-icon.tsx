// CardIcon.tsx
import React from "react";

interface IconProps {
  size?: number;
  color?: string;
  opacity?: number;
  variant?: "filled" | "outline" | "person";
}

const ProfileIcon: React.FC<IconProps> = ({
  size = 24,
  color = "var(--color-brand)",
  opacity = 1,
  variant = "filled",
}) => {
  const height = (size * 27) / 27;

  if (variant === "outline") {
    return (
      <svg
        width={size}
        height={height}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M12 12C13.1046 12 14 11.1046 14 10C14 8.89543 13.1046 8 12 8C10.8954 8 10 8.89543 10 10C10 11.1046 10.8954 12 12 12ZM12 14C14.2091 14 16 12.2091 16 10C16 7.79086 14.2091 6 12 6C9.79086 6 8 7.79086 8 10C8 12.2091 9.79086 14 12 14Z"
          fill={color}
          fillOpacity={opacity}
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M18.5588 19.5488C20.6672 17.7154 22 15.0134 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 15.0134 3.33284 17.7154 5.44116 19.5488C7.19693 21.0756 9.49052 22 12 22C14.4162 22 16.6323 21.143 18.3609 19.7165C18.4276 19.6614 18.4936 19.6055 18.5588 19.5488ZM12.2579 19.9959C12.1723 19.9986 12.0863 20 12 20C11.9914 20 11.9827 20 11.9741 20C11.8937 19.9997 11.8135 19.9983 11.7337 19.9956C10.3914 19.9517 9.13273 19.5772 8.03655 18.9508C8.95181 17.7632 10.3882 17 12 17C13.6118 17 15.0482 17.7632 15.9634 18.9508C14.865 19.5785 13.6033 19.9533 12.2579 19.9959ZM17.5624 17.7498C16.2832 16.0781 14.2675 15 12 15C9.73249 15 7.7168 16.0781 6.43759 17.7498C4.93447 16.2953 4 14.2568 4 12C4 7.58172 7.58172 4 12 4C16.4183 4 20 7.58172 20 12C20 14.2568 19.0655 16.2953 17.5624 17.7498Z"
          fill={color}
          fillOpacity={opacity}
        />
      </svg>
    );
  }
  if (variant === "person") {
    return (
      <svg
        width={size}
        height={height}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M12 10C13.6569 10 15 8.65685 15 7C15 5.34315 13.6569 4 12 4C10.3431 4 9 5.34315 9 7C9 8.65685 10.3431 10 12 10ZM12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z"
          fill={color}
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M9 16C6.79086 16 5 17.7909 5 20V21C5 21.5523 4.55228 22 4 22C3.44772 22 3 21.5523 3 21V20C3 16.6863 5.68629 14 9 14H15C18.3137 14 21 16.6863 21 20V21C21 21.5523 20.5523 22 20 22C19.4477 22 19 21.5523 19 21V20C19 17.7909 17.2091 16 15 16H9Z"
          fill={color}
        />
      </svg>
    );
  }

  // ⭐ Filled variant
  return (
    <svg
      width={size}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12ZM17.7137 16.4006C18.0416 16.7351 18.0416 17.265 17.7136 17.5996C16.2617 19.0809 14.2382 20 12.0001 20C9.76186 20 7.73834 19.0809 6.28636 17.5994C5.95845 17.2649 5.95846 16.735 6.28637 16.4004C7.73834 14.9191 9.76181 14 12 14C14.2382 14 16.2617 14.9192 17.7137 16.4006ZM12 12C13.6569 12 15 10.6569 15 9C15 7.34315 13.6569 6 12 6C10.3431 6 9 7.34315 9 9C9 10.6569 10.3431 12 12 12Z"
        fill={color}
        fillOpacity={opacity}
      />
    </svg>
  );
};

export default ProfileIcon;
