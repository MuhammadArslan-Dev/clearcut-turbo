'use client'
import React from 'react'
import ButtonShimmerOverlay from '../button-shimmer-overlay';
import Button from '@mui/joy/Button';

interface ShimmerButtonProps {
    text: string,
    borderRadius?: string,
    disabled?: boolean,
    onClick?: () => void,
    shimmer?: boolean,
    icon?: React.ReactNode,
    iconPosition?: 'left' | 'right',
    size?: 'lg' | 'md' | 'sm',
    loading?: boolean,
    gap?: number,
    bgColor?: string
}
const ShimmerButton: React.FC<ShimmerButtonProps> = ({
    borderRadius = '50px',
    disabled,
    onClick = () => { },
    text,
    shimmer,
    icon,
    iconPosition = 'left',
    size = 'lg',
    loading = false,
    gap = 8,
    bgColor

}) => {

    const paddingY = size === 'lg' ? '13px' : size === 'md' ? "11px" : "9px";

    return (
        <Button
            fullWidth
            sx={{ borderRadius: borderRadius, paddingY,backgroundColor: bgColor,overflow: 'hidden' }}
            size={size}
            disabled={disabled}
            onClick={() => {
                onClick();
            }}
            loading={loading}
            
        >
            {shimmer && (
                <ButtonShimmerOverlay />
            )}
            <div className="flex items-center justify-center" style={{ gap: `${gap}px` }}>
                {iconPosition === 'left' && icon}
                <span className="leading-none">{text}</span>
                {iconPosition === 'right' && icon}
            </div>
        </Button>
    )
}

export default ShimmerButton 
