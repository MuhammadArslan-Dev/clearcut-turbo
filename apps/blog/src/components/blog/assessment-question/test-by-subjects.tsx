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
    sections: {
        name: string,
        url: string,
        slug: string
    }
}

/** Section copy in the page's language; defaults are the original English. */
export type ListLabels = { title: string; subtitle: string; by: string; row: string };

const DEFAULT_LABELS: ListLabels = {
    title: "By Subjects",
    subtitle: "Subject-wise questions",
    by: "by Clear Cutoff",
    row: "150 questions & detailed answers",
};

export default function TestBySubjects({ data, examName, labels = DEFAULT_LABELS }: { data: Data[], examName: string, labels?: ListLabels }) {


    const params = useParams<{ locale: string, examName: string, level_id: string, year: string }>();


    const pathname = usePathname()

    return (


        <div className='space-y-4'>

            <div className='w-full px-3 space-y-1'>
                <div className='heading-large !font-semibold'>
                    {labels.title}
                </div>
                <div className='grid grid-cols-5 justify-between items-center gap-1'>
                    <div className='heading-small !font-semibold col-span-3'>
                        {labels.subtitle}
                    </div>
                    <div className='flex items-center gap-2 text-[#00753a] col-span-2 justify-self-end'>
                        <CourseCheckBadge size={16} fill="#00753a" />
                        <p className='body-medium !font-normal'>{labels.by}</p>
                    </div>
                </div>
            </div>

            <div className='bg-white'>
                {data?.length > 0 && (
                    data.map((item, index) => (
                        <SubjectsList key={index} index={index + 1} subtitle={labels.row} title={item?.sections?.name} pathname={`${pathname}/subject/${item?.sections?.slug}`} />
                    ))
                )}
            </div>
        </div>

    )
}
