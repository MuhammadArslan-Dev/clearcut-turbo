import React from 'react'
import clsx from 'clsx'

interface ProgressSummaryCardProps {
    /** Label shown on top left */
    label: string

    /** Completed value */
    completed: number

    /** Total value */
    total: number

    /** Optional right-side action (button / chip) */
    action?: {
        label: string
        onClick?: () => void
    }

    /** Progress bar color */
    barColor?: string

    /** Container class override */
    className?: string
}

const ProgressSummaryCard: React.FC<ProgressSummaryCardProps> = ({
    label,
    completed,
    total,
    action,
    barColor = 'bg-blue-500',
    className,
}) => {
    const percentage = Math.min(
        Math.round((completed / total) * 100),
        100
    )

    return (
        <div
            className={clsx(
                'w-full rounded-md border border-gray-200 bg-white px-4 py-3',
                className
            )}
        >
            <div className='flex w-full justify-between gap-6'>

                <div className='flex-1'>
                    {/* Header */}
                    <div className="flex items-center justify-between mb-1">
                        <p className="text-sm text-gray-600">{label}</p>

                        <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-500">
                                {completed}/{total}
                            </span>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className={clsx('h-full rounded-full', barColor)}
                            style={{ width: `${percentage}%` }}
                        />
                    </div>

                </div>
                {action && (
                    <button
                        onClick={action.onClick}
                        className="px-4 py-2 text-xs font-medium rounded-md bg-gray-800 text-white hover:bg-gray-700"
                    >
                        {action.label}
                    </button>
                )}

            </div>
        </div>
    )
}

export default ProgressSummaryCard
