// CheckIcon.tsx
import React from 'react';

interface IconProps {
  size?: number;
  color?: string;        // background circle color
  strokeColor?: string;  // checkmark color
  variant?: 'design' | 'simple';  // checkmark color
}

const CheckIcon: React.FC<IconProps> = ({
  size = 16,
  color = '#0083FF',
  strokeColor = 'white',
  variant = 'simple',
}) => {

  if (variant === 'design') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10.0065 2.10377C8.60495 1.65006 7.08132 2.28116 6.41107 3.59306L5.60529 5.17023C5.50955 5.35763 5.35714 5.51004 5.16974 5.60578L3.59257 6.41156C2.28067 7.08181 1.64957 8.60544 2.10328 10.007L2.64874 11.692C2.71355 11.8922 2.71355 12.1078 2.64874 12.308L2.10328 13.993C1.64957 15.3946 2.28067 16.9182 3.59257 17.5885L5.16974 18.3942C5.35714 18.49 5.50955 18.6424 5.60529 18.8298L6.41107 20.407C7.08132 21.7189 8.60495 22.35 10.0065 21.8963L11.6915 21.3508C11.8917 21.286 12.1073 21.286 12.3075 21.3508L13.9925 21.8963C15.3941 22.35 16.9177 21.7189 17.588 20.407L18.3937 18.8298C18.4895 18.6424 18.6419 18.49 18.8293 18.3942L20.4065 17.5885C21.7184 16.9182 22.3495 15.3946 21.8958 13.993L21.3503 12.308C21.2855 12.1078 21.2855 11.8922 21.3503 11.692L21.8958 10.007C22.3495 8.60544 21.7184 7.08181 20.4065 6.41156L18.8293 5.60578C18.6419 5.51004 18.4895 5.35763 18.3937 5.17023L17.588 3.59306C16.9177 2.28116 15.3941 1.65006 13.9925 2.10377L12.3075 2.64923C12.1073 2.71403 11.8917 2.71404 11.6915 2.64923L10.0065 2.10377ZM6.75928 11.7573L8.1735 10.343L11.0019 13.1715L16.6588 7.51465L18.073 8.92886L11.0019 15.9999L6.75928 11.7573Z"
          fill={color} />
      </svg>
    )

  }

  return (

    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="0.5" y="0.5" width="15" height="15" rx="7.5" fill={color} />
      <rect x="0.5" y="0.5" width="15" height="15" rx="7.5" stroke={color} />
      <path
        d="M11.3346 5.5L6.7513 10.0833L4.66797 8"
        stroke={strokeColor}
        strokeWidth="1.66667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
};

export default CheckIcon;
