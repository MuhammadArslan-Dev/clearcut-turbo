import React from 'react'
import clsx from 'clsx'
import { motion } from 'framer-motion'

interface SegmentedItem {
  id: string
  label: string
  icon?: React.ReactNode
}

interface SegmentedToggleProps {
  items: SegmentedItem[]
  value: string
  onChange: (id: string) => void

  /** Visual style */
  variant?: 'filled' | 'outline'

  /** Theme color */
  color?: 'blue' | 'green' | 'gray'

  /** Size */
  size?: 'sm' | 'md' | 'lg'

  className?: string
}

/* ----------------------------------
 * Style Maps
 * ---------------------------------*/

const sizeStyles = {
  sm: 'text-sm h-8',
  md: 'text-sm h-9',
  lg: 'text-sm h-12',
}

const colorStyles = {
  blue: {
    active: 'bg-blue-500 text-white',
    inactive: 'text-blue-600',
    container: 'bg-blue-50',
  },
  green: {
    active: 'bg-green-500 text-white',
    inactive: 'text-green-600',
    container: 'bg-green-50',
  },
  gray: {
    active: 'bg-gray-800 text-white',
    inactive: 'text-gray-600',
    container: 'bg-gray-100',
  },
}

/* ----------------------------------
 * Component
 * ---------------------------------*/

const SegmentedToggle: React.FC<SegmentedToggleProps> = ({
  items,
  value,
  onChange,
  variant = 'filled',
  color = 'blue',
  size = 'md',
  className,
}) => {
  const theme = colorStyles[color]

  return (
    <div
      className={clsx(
        'relative flex rounded-full p-1 gap-1',
        sizeStyles[size],
        variant === 'filled'
          ? theme.container
          : 'border border-gray-300',
        className
      )}
    >
      {/* Animated Active Pill */}
      <motion.div
        layout
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className={clsx(
          'absolute top-1 bottom-1 rounded-full',
          theme.active
        )}
        style={{
          width: `${100 / items.length}%`,
          left: `${(items.findIndex(i => i.id === value) * 100) / items.length}%`,
        }}
      />

      {/* Buttons */}
      {items.map(item => {
        const isActive = item.id === value

        return (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={clsx(
              'relative z-10 flex flex-1 items-center justify-center gap-2 rounded-full font-medium transition-colors',
              isActive ? 'text-white' : theme.inactive
            )}
          >
            {item.icon && (
              <span className="flex items-center">
                {item.icon}
              </span>
            )}
            {item.label}
          </button>
        )
      })}
    </div>
  )
}

export default SegmentedToggle
