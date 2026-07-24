'use client'

import React from 'react'
import clsx from 'clsx'
import { motion } from 'framer-motion'

export interface BottomNavItem {
  id: string
  label: string
  icon: React.ReactNode
}

interface BottomNavigationProps {
  items: BottomNavItem[]
  value: string
  onChange: (id: string) => void
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({
  items,
  value,
  onChange,
}) => {
  return (
    <nav className="w-full bg-white border-t border-gray-200">
      <div className="flex justify-around items-center py-2">
        {items.map(item => {
          const isActive = item.id === value

          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className="flex flex-col items-center justify-center gap-1 px-4 py-2"
            >
              {/* ICON WRAPPER */}
              <div className="relative flex items-center justify-center">
                {/* Active background (ICON ONLY) */}
                {isActive && (
                  <motion.div
                    layoutId="bottom-nav-icon-bg"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    transition={{
                      type: 'spring',
                      stiffness: 400,
                      damping: 30,
                    }}
                    className="absolute inset-0 rounded-full bg-blue-100"
                  />
                )}

                {/* Icon */}
                <motion.span
                  className={clsx(
                    'relative z-10 flex items-center justify-center w-20 h-10',
                    isActive ? 'text-blue-600' : 'text-gray-500'
                  )}
                  animate={
                    isActive
                      ? { scale: [1, 1.05, 1] }
                      : { scale: 1 }
                  }
                  transition={{
                    duration: 0.25,
                    ease: 'easeOut',
                  }}
                >
                  {item.icon}
                </motion.span>
              </div>

              {/* Label (NO BACKGROUND) */}
              <span
                className={clsx(
                  'text-xs font-medium',
                  isActive ? 'text-blue-600' : 'text-gray-500'
                )}
              >
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

export default BottomNavigation
