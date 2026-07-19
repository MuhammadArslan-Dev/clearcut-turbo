'use client'
import CourseCheckBadge from '@/components/ui/badge/course-check-badge'
import { usePathname, useParams } from 'next/navigation'
import React from 'react'
import { formatToSlug } from '@/utils/slugify'
import SubjectsList from '../ui/subjects-list'

interface Data {
    id: number,
    stage_id: string,
    instance_id: string[],
}

export default function TestByYears({ data, examName }: { data: Data[], examName: string }) {

    const params = useParams<{ locale: string, examName: string, level_id: string, year: string }>();
    const handleSelect = (item: string) => {
    }
    const pathname = usePathname()

    return (
        <div className='space-y-4'>
            <div className='w-full px-3 space-y-1'>
                <div className='heading-large !font-semibold'>
                    By Years
                </div>
                <div className='grid grid-cols-5 justify-between items-center gap-1'>
                    <div className='heading-small !font-semibold col-span-3'>
                        Year-wise questions
                    </div>
                    <div className='flex items-center gap-2 text-[#00a251] col-span-2 justify-self-end'>
                        <CourseCheckBadge size={16} fill="#00a251" />
                        <p className='body-medium !font-normal'>by Clear Cutoff</p>
                    </div>
                </div>
            </div>
            <div className='bg-white'>

                {data?.length > 0 && (
                    data.map((item, index) => {
                        const url = `${pathname}/${params?.year ? params?.year : "year"}/${formatToSlug(item?.instance_id.replace("_", " "))}`;
                        return (
                            <SubjectsList key={index} index={index + 1} title={item?.instance_id.replace("_", " ")} pathname={url} />
                        )
                    })
                )}
            </div>
        </div>
    )
}
