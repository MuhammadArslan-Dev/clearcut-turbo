import React from 'react'
import clsx from 'clsx'

type ChipVariant = 'filled' | 'outline' | 'soft'
type ChipTone = 'success' | 'warning' | 'info' | 'error' | 'neutral'
type ChipRadius = 'sm' | 'md' | 'lg' | 'full' | 'custom'

interface StatusChipProps {
  label: string

  variant?: ChipVariant
  tone?: ChipTone

  iconLeft?: React.ReactNode
  iconRight?: React.ReactNode

  size?: 'sm' | 'md'

  /** Border radius control */
  radius?: ChipRadius
  radiusClass?: string // used when radius="custom"

  onClick?: () => void
  className?: string
}

/* ----------------------------------
 * Style Maps
 * ---------------------------------*/

const baseStyles =
  'inline-flex items-center gap-1 font-medium whitespace-nowrap'

const sizeStyles = {
  sm: 'text-xs px-3 py-1',
  md: 'text-sm px-3 py-1.5',
}

const radiusStyles: Record<
  Exclude<ChipRadius, 'custom'>,
  string
> = {
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  full: 'rounded-full',
}

const toneStyles: Record<
  ChipVariant,
  Record<ChipTone, string>
> = {
  filled: {
    success: 'bg-green-600 text-white',
    warning: 'bg-yellow-500 text-white',
    info: 'bg-blue-600 text-white',
    error: 'bg-red-600 text-white',
    neutral: 'bg-gray-600 text-white',
  },
  soft: {
    success: 'bg-green-100 text-green-700',
    warning: 'bg-yellow-100 text-yellow-700',
    info: 'bg-blue-100 text-blue-700',
    error: 'bg-red-100 text-red-700',
    neutral: 'bg-gray-300/50 text-gray-700',
  },
  outline: {
    success: 'border border-green-500 text-green-600',
    warning: 'border border-yellow-500 text-yellow-600',
    info: 'border border-blue-500 text-blue-600',
    error: 'border border-red-500 text-red-600',
    neutral: 'border border-gray-400/50 text-gray-600',
  },
}

/* ----------------------------------
 * Component
 * ---------------------------------*/

const StatusChip: React.FC<StatusChipProps> = ({
  label,
  variant = 'soft',
  tone = 'neutral',
  iconLeft,
  iconRight,
  size = 'sm',
  radius = 'full',
  radiusClass,
  onClick,
  className,
}) => {
  const resolvedRadius =
    radius === 'custom'
      ? radiusClass
      : radiusStyles[radius]

  return (
    <span
      onClick={onClick}
      className={clsx(
        baseStyles,
        sizeStyles[size],
        resolvedRadius,
        toneStyles[variant][tone],
        onClick && 'cursor-pointer',
        className
      )}
    >
      {iconLeft && <span className="flex items-center">{iconLeft}</span>}

      {label}

      {iconRight && <span className="flex items-center">{iconRight}</span>}
    </span>
  )
}

export default StatusChip
