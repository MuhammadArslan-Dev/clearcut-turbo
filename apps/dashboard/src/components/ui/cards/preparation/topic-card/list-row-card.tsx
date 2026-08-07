import React from 'react'
import clsx from 'clsx'
import {
    CircleTickIcon,
    MediaPlayerIcon,
} from '@/components/ui/icons'
import StatusChip from '../chapter-list/StatusChip'

/* ----------------------------------
 * Types
 * ---------------------------------*/

type CardVariant = 'topic' | 'test'

type ChipVariant = 'filled' | 'outline' | 'soft'
type ChipTone = 'success' | 'warning' | 'info' | 'error' | 'neutral'
type ChipRadius = 'sm' | 'md' | 'lg' | 'full' | 'custom'

type CounterProps = {
    value?: string | number
    variant?: 'filled' | 'warning' | 'simple'
    colorKey?: 'success' | 'error' | 'info' | 'custom'
}
type BadgeProps = {
    variant?: ChipVariant
    tone?: ChipTone
    radius?: ChipRadius
    radiusClass?:string
}

type MetaItem = {
    icon?: React.ReactNode
    label?: string
}

type Badge = {
    label: string
    colorClass: BadgeProps
}

interface Props {
    variant: CardVariant

    title: React.ReactNode

    counter?: CounterProps

    time?: string
    timeColor?: string

    meta?: MetaItem[]

    playerVariant?: 'filled' | 'warning' | 'simple'

    badge?: Badge

    onClick?: () => void
    cursor?: string
    bgColor?: string
}

/* ----------------------------------
 * Component
 * ---------------------------------*/

const ListRowCard: React.FC<Props> = ({
    variant,
    title,
    counter,
    time,
    timeColor = 'bg-red-300',
    meta = [],
    playerVariant,
    badge,
    onClick,
    cursor = 'cursor-pointer',
    bgColor = 'bg-gray-200',
}) => {
    return (
        <div
            onClick={onClick}
            className={clsx(
                'flex gap-3 rounded-md items-center p-1',
                bgColor,
                cursor
            )}
        >
            {/* Counter */}
            {counter && (
                <div className="w-10">
                    <CircleTickIcon {...counter} />
                </div>
            )}

            {/* Content */}
            <div className="flex-1 px-3 py-2 space-y-2 bg-white rounded-md">
                {/* Header */}
                <div className="flex justify-between items-start">
                    <p className="font-medium">{title}</p>

                    {time && (
                        <div
                            className={clsx(
                                'min-w-20 text-center rounded-full px-2 text-sm',
                                timeColor
                            )}
                        >
                            {time}
                        </div>
                    )}
                </div>

                {/* Meta + Actions */}
                <div className="flex justify-between items-center">
                    {/* Meta */}
                    <div className="flex gap-4">
                        {meta.map((item, index) => (
                            <div key={index} className="flex gap-2 items-center text-sm">
                                {item.icon}
                                <span>{item.label}</span>
                            </div>
                        ))}
                    </div>

                    {/* Right Action */}
                    {variant === 'topic' && playerVariant && (
                        <MediaPlayerIcon variant={playerVariant} />
                    )}

                    {variant === 'test' && badge && (
                        <StatusChip
                            label={badge.label as string || ''}
                            {...badge.colorClass}
                        />
                        // <span
                        //     className={clsx(
                        //         'px-3 py-1 text-xs rounded-full font-medium',
                        //         badge.colorClass
                        //     )}
                        // >
                        //     {badge.label}
                        // </span>
                    )}
                </div>
            </div>
        </div>
    )
}

export default ListRowCard


//     < ListRowCard
// variant = "topic"
// title = "Using different types of"
// counter = {{
//     value: 1,
//         variant: 'simple',
//             colorKey: 'info'
// }}
// time = "12 min"
// // badge={{
// //     label: "12 min",
// //     colorClass: "bg-yellow-100 text-black"
// // }}
// meta = {
//     [
//         { icon: <VideoCamIcon />, label: '3 videos' },
//         { icon: <StarBadge />, label: 'Easy' },
//                             ]
//                         }
// playerVariant = "warning"
//     />