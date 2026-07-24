import React, { memo } from 'react'

interface CountDownCardProps {
    count?: string | number | null
    text?: string | null
}

const CountDownCard: React.FC<CountDownCardProps> = (
    {
        count = 71,
        text = 'Days'
    }
) => {
    return (
        <div className='rounded-[10px] border border-[#90a5bb] min-w-[64px] h-[70px] overflow-hidden'>
            <div className='flex heading-large !font-semibold items-center justify-center bg-[var(--icon-neutral-intense)] text-white h-[40px]'>{count}</div>
            <div className='h-[30px] flex body-small !font-semibold items-center justify-center bg-[var(--color-surface-gray-subtle)] text-white'>{text}</div>
        </div>
    )
}

export default memo(CountDownCard);