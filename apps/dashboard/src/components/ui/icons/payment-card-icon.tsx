// CardIcon.tsx
import React from 'react';

interface IconProps {
    size?: number;
    color?: string;
    secondaryColor?: string;
    opacity?: number;
    secondaryOpacity?: number;
    variant?: 'filled' | 'outline';
}

const PaymentCardIcon: React.FC<IconProps> = ({
    size = 24,
    color = 'var(--color-brand)',
    opacity = 1,
    variant = 'filled',
}) => {

    const height = (size * 22) / 27;

    if (variant === 'outline') {
        return (
            <svg width={size} height={height} viewBox="0 0 27 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd"
                    clipRule="evenodd"
                    d="M0 4C0 1.79086 1.79086 0 4 0H22.6667C24.8758 0 26.6667 1.79086 26.6667 4V17.3333C26.6667 19.5425 24.8758 21.3333 22.6667 21.3333H4C1.79086 21.3333 0 19.5425 0 17.3333V4ZM4 2.66667H22.6667C23.403 2.66667 24 3.26362 24 4V5.33333H2.66667V4C2.66667 3.26362 3.26362 2.66667 4 2.66667ZM2.66667 8V17.3333C2.66667 18.0697 3.26362 18.6667 4 18.6667H22.6667C23.403 18.6667 24 18.0697 24 17.3333V8H2.66667Z"
                    fill={color} />
                <path fillRule="evenodd"
                    clipRule="evenodd"
                    d="M5.33333 14.6667C5.33333 13.9303 5.93029 13.3333 6.66667 13.3333H14.6667C15.403 13.3333 16 13.9303 16 14.6667C16 15.403 15.403 16 14.6667 16H6.66667C5.93029 16 5.33333 15.403 5.33333 14.6667Z"
                    fill={color} />
            </svg>

        );
    }

    // ⭐ Filled variant
    return (
        <svg
            width={size}
            height={height}
            viewBox="0 0 27 22"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* Bottom card */}
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M1.33333 8C0.596954 8 0 8.59695 0 9.33333V17.3333C0 19.5425 1.79086 21.3333 4 21.3333H22.6667C24.8758 21.3333 26.6667 19.5425 26.6667 17.3333V9.33333C26.6667 8.59695 26.0697 8 25.3333 8H1.33333ZM4 13.3333C3.26362 13.3333 2.66667 13.9303 2.66667 14.6667C2.66667 15.403 3.26362 16 4 16H12C12.7364 16 13.3333 15.403 13.3333 14.6667C13.3333 13.9303 12.7364 13.3333 12 13.3333H4Z"
                fill={color}
                fillOpacity={opacity}
            />

            {/* Top stripe */}
            <path
                d="M0 4C0 1.79086 1.79086 0 4 0H22.6667C24.8758 0 26.6667 1.79086 26.6667 4C26.6667 4.73638 26.0697 5.33333 25.3333 5.33333H1.33333C0.596954 5.33333 0 4.73638 0 4Z"
                fill={color}
                fillOpacity={opacity}
            />
        </svg>
    );
};

export default PaymentCardIcon;
