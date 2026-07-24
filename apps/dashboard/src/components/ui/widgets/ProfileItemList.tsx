import { ChevronRightIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import React from 'react'

interface ProfileItemListProps {
    onClick?: () => void;
    icon?: React.ReactNode;
    title?: string;
    titleClass?: string;
    subtitle?: string;
    subtitleClass?: string;
    editIcon?: React.ReactNode;
    showEditIcon?: boolean
}

export default function ProfileItemList({
    onClick = () => { },
    icon,
    title,
    titleClass='heading-small !font-semibold',
    subtitle,
    subtitleClass='body-small !font-normal',
    showEditIcon = true,
    editIcon = <ChevronRightIcon
        stroke="var(--color-surface-gray-subtle)"
        strokeWidth={2}
        width={20}
    />
}: ProfileItemListProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="flex w-full items-center justify-between gap-4 cursor-pointer"
        >
            <div className="flex items-center gap-4">
                {icon}
                <div className="text-left">
                    <p className={clsx("text-surface-gray-normal", titleClass)}>
                        {title}
                    </p>
                    <p className={clsx(" text-surface-gray-muted", subtitleClass)}>
                        {subtitle}
                    </p>
                </div>
            </div>
            {showEditIcon && editIcon}
        </button>
    )
}
