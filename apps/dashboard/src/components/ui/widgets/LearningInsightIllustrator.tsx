import React from 'react'
import { LearningInsightIllustration } from '../icons'
import clsx from 'clsx'

interface LearningInsightIllustratorProps {
    text?: string | React.ReactNode
    bgColor?: string
}

const LearningInsightIllustrator: React.FC<LearningInsightIllustratorProps> = (
    {
        text = <div className=''>
            <p className='heading-xlarge !font-semibold'>Your Key to <span className='text-surface-gray-muted'>Success!</span></p>
            <p className='body-small'>Crafted with ❤️ for Excellence</p>
        </div>,
        bgColor = 'bg-white'
    }
) => {
    return (
        <div className='flex justify-center w-full'>
            <div className={clsx('flex max-w-[500px] justify-between items-center gap-2 w-full px-3 py-4', bgColor)}>
                <div>
                    {text}
                </div>
                <div>
                    <LearningInsightIllustration size={120} />
                </div>
            </div>
        </div>
    )
}

export default LearningInsightIllustrator;
