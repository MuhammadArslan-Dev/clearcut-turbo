import React from 'react'
import clsx from 'clsx'

interface AttemptResultCardProps {
  /** Attempt label (Attempt 1, Attempt 2, etc.) */
  attemptLabel: string

  /** Score value (20/30) */
  score: {
    obtained: number
    total: number
  }

  /** Primary action */
  action: {
    label: string
    onClick?: () => void
  }

  /** Optional container class */
  className?: string
}

const AttemptResultCard: React.FC<AttemptResultCardProps> = ({
  attemptLabel,
  score,
  action,
  className,
}) => {
  return (
    <div
      className={clsx(
        'w-full rounded-lg border border-gray-200 bg-white px-4 py-3 flex items-center justify-between',
        className
      )}
    >
      {/* Left */}
      <div className="flex items-center gap-3">
        <p className="font-medium text-gray-900">
          {attemptLabel}
        </p>

        <span className="px-3 py-1 text-sm rounded-full bg-blue-100 text-blue-700">
          {score.obtained}/{score.total}
        </span>
      </div>

      {/* Right Action */}
      <button
        onClick={action.onClick}
        className="px-4 py-2 text-sm font-medium rounded-md border border-blue-500 text-blue-600 hover:bg-blue-50"
      >
        {action.label}
      </button>
    </div>
  )
}

export default AttemptResultCard
