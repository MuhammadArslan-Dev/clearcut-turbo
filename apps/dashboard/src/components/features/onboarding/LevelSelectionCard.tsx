import CheckIcon from '@/components/ui/icons/check-icon'
import { PencilIcon } from '@heroicons/react/24/outline'
import Button from '@mui/joy/Button'
import React from 'react'

type LevelSelectionCardProps = {
    bg?: string,
    padding?: string,
    radius?: string,
    onClick?: () => void,
    title?: string | null,
    subtitle?: string | null,
    iconColor?: string,
    editIcon?: React.ReactNode,
    showEdit?: boolean
}

export default function LevelSelectionCard({
    bg = "transparent",
    padding = "8px 12px",
    radius = "0px",
    onClick,
    title = "Test",
    subtitle = "",
    iconColor,
    editIcon,
    showEdit = true
}: LevelSelectionCardProps) {
    return (
        <div className='min-h-[52px] flex items-center' style={{
            backgroundColor: bg,
            padding: padding,
            borderRadius: radius,
        }}>
            <div className='flex justify-between items-center w-full'>
                <div className='flex items-end gap-2'>
                    <p className='heading-medium !font-semibold text-surface-gray-normal'>{title}</p>
                    <p className='body-medium !font-normal text-surface-gray-normal'>{subtitle}</p>
                </div>
                <div className='flex items-center gap-3'>
                    <div><CheckIcon size={20} color={iconColor} /></div>
                    {showEdit && (
                        <Button onClick={onClick}
                            className='!bg-[var(--background-gray)] !text-[var(--color-surface-gray-normal)] !font-bold !rounded-full !px-2'
                            size='sm' variant='soft'>
                            {editIcon ?? <PencilIcon stroke='var(--color-surface-gray-normal)' strokeWidth={3} width={16} />}
                        </Button>
                    )}

                </div>
            </div>
        </div>
    )
}
