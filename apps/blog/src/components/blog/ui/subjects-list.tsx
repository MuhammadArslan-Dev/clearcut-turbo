import RightArrowBox from '@/components/ui/arrows/right-arrow-box';
import NumberedShape from '@/components/ui/numbered-shape';
import Link from 'next/link';
import React from 'react'

interface Props {
    index?: number,
    title?: string,
    subtitle?: string,
    onClick?: () => void,
    loading?: boolean,
    pathname?: string
}

export default function SubjectsList({ index = 1, title = "", subtitle = "150 questions & detailed answers", onClick, loading, pathname }: Props) {


    return (
        // <div className={[loading ? 'opacity-50 cursor-not-allowed' : ''].join(' ')}>
            <Link prefetch={true} href={`${pathname}`} onClick={onClick}>
                <div className='flex items-center justify-between py-4 px-3 border-b border-gray-300'>
                    <div className='flex items-center gap-4'>
                        <NumberedShape number={index} />
                        <div>
                            <div className='body-large !font-semibold text-gray-900'> {title}</div>
                            <div className='body-small !font-normal text-gray-500'>{subtitle}</div>
                        </div>
                    </div>
                    <RightArrowBox size={30} onClick={onClick} />
                </div>
            </Link>
        // </div>
    )
}
