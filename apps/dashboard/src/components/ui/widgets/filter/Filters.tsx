'use client'
import clsx from 'clsx'
import { motion } from 'framer-motion'
import React, { useEffect, useRef, useState } from 'react'

type BorderRadius = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full'

interface FilterItemType {
    label: React.ReactNode
    value: string
}

interface FiltersProps {
    title?: string | React.ReactNode
    titleFont?: string
    badgeFont?: string
    onClick?: (value: string) => void
    activeItem?: string | number | null
    bgColor?: string
    textColor?: string
    borderColor?: string
    borderWidth?: string
    borderRadius?: BorderRadius
    FilterItem?: FilterItemType[]
    paddingX?: string
    paddingY?: string
    marginX?: string
}

const radiusMap: Record<BorderRadius, string> = {
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    '3xl': 'rounded-3xl',
    full: 'rounded-full',
}

export default function Filters({
    title,
    titleFont='font-medium',
    badgeFont='!font-normal ',
    onClick = () => { },
    activeItem,
    bgColor = 'var(--color-primary-soft)',
    borderWidth = 'border-2',
    borderColor = '!border-brand',
    textColor = 'text-brand',
    borderRadius = 'md',
    paddingX = 'px-4',
    paddingY = 'py-0.5',
    FilterItem = [
        { label: 'item1', value: 'item1' },
        { label: 'item2', value: 'item2' },
        { label: <span>item3</span>, value: 'item3' },
    ],
    marginX = 'mx-0'
}: FiltersProps) {
    const containerRef = useRef<HTMLDivElement | null>(null)
    const chipRefs = useRef<Record<string, HTMLDivElement | null>>({})
    const isUserActionRef = useRef(false)

    /** internal active ONLY for uncontrolled mode */
    const [internalActive, setInternalActive] = useState<string | null>(null)

    /** single source of truth */
    const active =
        activeItem !== undefined && activeItem !== null
            ? String(activeItem)
            : internalActive

    /* Init internal active */
    useEffect(() => {
        if (activeItem == null && FilterItem.length && internalActive == null) {
            setInternalActive(FilterItem[0].value)
        }
    }, [FilterItem, activeItem, internalActive])

    /* Scroll only on USER click */
    useEffect(() => {
        if (!isUserActionRef.current || !active) return

        const container = containerRef.current
        const chip = chipRefs.current[active]
        if (!container || !chip) return

        const containerRect = container.getBoundingClientRect()
        const chipRect = chip.getBoundingClientRect()

        const offset =
            chipRect.left -
            containerRect.left -
            container.clientWidth / 2 +
            chip.clientWidth / 2

        container.scrollTo({
            left: container.scrollLeft + offset,
            behavior: 'smooth',
        })

        isUserActionRef.current = false
    }, [active])

    return (
        <div className="w-full">

            {title && <div className={clsx("mb-2 ", titleFont)}>{title}</div>}

            <div
                ref={containerRef}
                className={`flex gap-2 overflow-x-auto overflow-y-hidden ${marginX}`}
                style={{
                    padding: paddingX,
                }}
            >
                {FilterItem.map((item) => {
                    const isActive = active === item.value

                    return (
                        <motion.div
                            ref={(el) => {
                                chipRefs.current[item.value] = el
                            }}
                            key={item.value}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                                isUserActionRef.current = true

                                if (activeItem == null) {
                                    setInternalActive(item.value)
                                }

                                onClick(item.value)
                            }}
                            className={clsx(
                                'cursor-pointer inline-flex items-center whitespace-nowrap',
                                borderWidth,
                                radiusMap[borderRadius],
                                isActive ? bgColor : 'bg-white',
                                isActive ? textColor : 'text-gray-600',
                                isActive ? borderColor : '!border-gray-200',
                                paddingX,
                                paddingY,
                                badgeFont
                            )}
                        >
                            {item.label}
                        </motion.div>
                    )
                })}
            </div>
        </div>
    )
}
