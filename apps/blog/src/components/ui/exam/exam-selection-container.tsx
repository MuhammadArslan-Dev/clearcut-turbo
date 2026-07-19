import React from 'react'
import CourseCheckBadge from '../badge/course-check-badge'
import { Button } from '@mui/joy'
import { PencilSquareIcon } from '@heroicons/react/16/solid'

interface ExamSelectionContainerProps {
    title?: string;
    handleBack?: () => void;
    buttonText?: { text: string, icon: React.ReactNode };
}

export default function ExamSelectionContainer({ title="", handleBack = () => {}, buttonText = { text: "Edit", icon: <PencilSquareIcon className="mr-2 h-4 w-4" /> } }: ExamSelectionContainerProps) {
    return (
        <div className='mb-4 grid grid-cols-7 gap-4 bg-[#e7f6e5] p-4'>
            <div className='col-span-4 text-sm text-gray-700 flex items-center gap-1'>
                <CourseCheckBadge size={24} fill="#00a251" />
                <span>
                    <span >
                        {title}
                    </span>
                </span>
            </div>
            <div className='flex items-center gap-3 col-span-3 justify-self-end'>
                <Button size='sm' variant="outlined" color="primary" onClick={handleBack}>
                    {buttonText.text} {buttonText.icon}
                </Button>

            </div>
        </div>
    )
}
