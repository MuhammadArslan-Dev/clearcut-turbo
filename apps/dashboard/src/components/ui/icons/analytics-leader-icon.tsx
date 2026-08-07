// CardIcon.tsx
import React from 'react';

interface IconProps {
    size?: number;
    color?: string;
    opacity?: number;
    variant?: 'filled' | 'outline';
}

const AnalyticsLeaderIcon: React.FC<IconProps> = ({
    size = 24,
    color = 'var(--color-brand)',
    opacity = 1,
    variant = 'filled',
}) => {

    const height = (size * 22) / 27;

    if (variant === 'outline') {
        return (


            <svg width={size} height={height} viewBox="0 0 27 19" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M18.6667 9.33333V4C18.6667 1.79086 16.8758 0 14.6667 0H12C9.79086 0 8 1.79086 8 4V6.66667H4C1.79086 6.66667 0 8.45753 0 10.6667V17.3333C0 18.0697 0.596954 18.6667 1.33333 18.6667H25.3333C26.0697 18.6667 26.6667 18.0697 26.6667 17.3333V13.3333C26.6667 11.1242 24.8758 9.33333 22.6667 9.33333H18.6667ZM14.6667 2.66667H12C11.2636 2.66667 10.6667 3.26362 10.6667 4V16H16V4C16 3.26362 15.403 2.66667 14.6667 2.66667ZM18.6667 12V16H24V13.3333C24 12.597 23.403 12 22.6667 12H18.6667ZM4 9.33333H8V16H2.66667V10.6667C2.66667 9.93029 3.26362 9.33333 4 9.33333Z"
                    fill={color} />
            </svg>


        );
    }

    // ⭐ Filled variant
    return (

        <svg width={size} height={height} viewBox="0 0 27 19" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd" d="M18.6667 9.33333V4C18.6667 1.79086 16.8758 0 14.6667 0H12C9.79086 0 8 1.79086 8 4V6.66667H4C1.79086 6.66667 0 8.45753 0 10.6667V17.3333C0 18.0697 0.596954 18.6667 1.33333 18.6667H25.3333C26.0697 18.6667 26.6667 18.0697 26.6667 17.3333V13.3333C26.6667 11.1242 24.8758 9.33333 22.6667 9.33333H18.6667ZM14.6667 2.66667H12C11.2636 2.66667 10.6667 3.26362 10.6667 4V16H16V4C16 3.26362 15.403 2.66667 14.6667 2.66667ZM18.6667 12V16H24V13.3333C24 12.597 23.403 12 22.6667 12H18.6667ZM4 9.33333H8V16H2.66667V10.6667C2.66667 9.93029 3.26362 9.33333 4 9.33333Z"
                fill={color} fillOpacity={opacity} />
        </svg>

        // <svg width={size} height={height} viewBox="0 0 27 27" fill="none" xmlns="http://www.w3.org/2000/svg">
        //     <path fillRule="evenodd"
        //         clipRule="evenodd"
        //         d="M1.32414 9.42682C0.481286 10.1854 0 11.2661 0 12.4V22.6186C0 24.8277 1.79086 26.6186 4 26.6186H22.6667C24.8758 26.6186 26.6667 24.8277 26.6667 22.6186V12.4C26.6667 11.2661 26.1854 10.1854 25.3425 9.42682L16.0092 1.02682C14.488 -0.342275 12.1787 -0.342274 10.6575 1.02682L1.32414 9.42682ZM12 14.6186C10.5272 14.6186 9.33333 15.8125 9.33333 17.2852V22.6186C9.33333 23.3549 9.93029 23.9519 10.6667 23.9519H16C16.7364 23.9519 17.3333 23.3549 17.3333 22.6186V17.2852C17.3333 15.8125 16.1394 14.6186 14.6667 14.6186H12Z"
        //         fill={color} fillOpacity={opacity}
        //     />
        // </svg>

    );
};

export default AnalyticsLeaderIcon;
