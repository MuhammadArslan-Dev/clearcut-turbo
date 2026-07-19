import React from 'react'
import Image from 'next/image'
import Chip from "@mui/joy/Chip";
import Button from '@mui/joy/Button';

type ExamBadgeProps = {
    active: boolean
    activeLabel?: string
    inactiveLabel?: string
    size?: 'sm' | 'md' | 'lg'
    variant?: 'soft' | 'solid' | 'outlined' | 'plain'
    className?: string
    sx?: any
    colors?: {
        activeBg?: string
        inactiveBg?: string
        activeText?: string
        inactiveText?: string
    }
}

function ExamBadge({
    active,
    activeLabel = 'Course + Test Series',
    inactiveLabel = 'Coming Soon',
    size = 'sm',
    variant = 'soft',
    className,
    sx,
    colors,
}: ExamBadgeProps) {
    const defaultColors = {
        activeBg: '#defcce',
        inactiveBg: '#FFEECC',
        activeText: '#1C9E41',
        inactiveText: '#DF7430',
    }
    const c = { ...defaultColors, ...(colors || {}) }
    const label = active ? activeLabel : inactiveLabel
    const computedSx = {
        fontWeight: 'bold',
        padding: '3px 15px',
        backgroundColor: active ? c.activeBg : c.inactiveBg,
        color: active ? c.activeText : c.inactiveText,
        ...(sx || {}),
    }
    return (
        <Chip
            size={size}
            variant={variant}
            className={["body-medium !font-semibold", className || ''].join(' ')}
            sx={computedSx}
        >
            {label}
        </Chip>
    )
}

export default function CourseCard({
    item,
    viewMoreDetails,
    startForFree
}: {
    item: Exam
    viewMoreDetails: (item: Exam) => void
    startForFree: (item: Exam) => void
}) {
    return (
        <div
            className={[
                'relative overflow-hidden rounded-lg border bg-white transition-all',
                'hover:shadow-sm hover:-translate-y-0.1',
                item.status.toLowerCase() === 'active' ? 'border-gray-200' : 'border-gray-200',
            ].join(' ')}
        >
            <div className="p-4 space-y-4">
                <div className="flex items-start gap-4">
                    <div className={[
                        'flex h-24 w-24 shrink-0 items-center justify-center rounded-full border',
                        item.status.toLowerCase() === 'active' ? 'border-gray-200' : 'border-gray-200',
                    ].join(' ')}>
                        <Image
                            src={'https://cc-teaching-content-ind.s3.dualstack.ap-south-1.amazonaws.com/exam%20logo/htet%20logo%201.svg'}
                            alt={item.name}
                            width={100}
                            height={100}
                        />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <ExamBadge
                                active={item.status.toLowerCase() === 'active'}
                                activeLabel={'Course + Test Series'}
                                inactiveLabel="Coming Soon"
                            />
                        </div>
                        <div className="mt-2 flex items-center gap-1.5">
                            <h3 className="heading-large font-semibold text-gray-900">{item.short_name}</h3>
                            {/* {item.active && (
                                                    <svg viewBox="0 0 20 20" className="h-4 w-4 text-blue-600" aria-hidden>
                                                        <path fill="currentColor" d="M10 0a10 10 0 1010 10A10.011 10.011 0 0010 0zm4.707 8.293l-5.5 5.5a1 1 0 01-1.414 0l-2.5-2.5a1 1 0 011.414-1.414L8.5 11.586l4.793-4.793a1 1 0 011.414 1.414z" />
                                                    </svg>
                                                )} */}
                        </div>
                        <p className="body-small font-normal">{item.state}</p>

                        {item.status.toLowerCase() === 'active' && (
                            <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                                <svg viewBox="0 0 20 20" className="h-4 w-4 text-amber-400" aria-hidden>
                                    <path fill="currentColor" d="M10 15l-5.878 3.09 1.123-6.545L.49 6.91l6.561-.953L10 0l2.949 5.957 6.561.953-4.755 4.634 1.123 6.545L10 15z" />
                                </svg>
                                <span>
                                    <span className="font-semibold">{item.rating}</span> (1.2k+ ratings)
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {item.status.toLowerCase() === 'active' && (
                    <div className="flex gap-3">
                        <Button onClick={startForFree} fullWidth >
                            Start For Free
                        </Button>
                        <Button onClick={viewMoreDetails} fullWidth variant='outlined'>
                            View More Details
                        </Button>
                    </div>
                )}
            </div>
        </div>  
    )
}
