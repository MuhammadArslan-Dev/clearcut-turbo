'use client'

import React, { useEffect } from 'react'
import CustomizableHeader from '@/components/customizable-header'
import CardWrap from '@/components/cards/card-wrap'
import MainContainer from '@/components/main-container'
import { useRouter, usePathname } from 'next/navigation'
import CourseCheckBadge from '@/components/ui/badge/course-check-badge'
import { formatToSlug } from '@/utils/slugify'

type NavItem = {
    id: number | string
    stage_id?: string
    exam_id?: string
    name: string
    stage_type?: string
    stage_order?: string | number
    description?: string
    duration_mins?: string | number
    total_marks?: string | number
    total_questions?: string | number
    ai_evaluation_supported?: 'TRUE' | 'FALSE' | boolean | string
    status?: string
    updatedAt?: string
    createdAt?: string
    // Optional hierarchical fields used by this component
    parent_id?: string
    ent_id?: string
}


// const pointsCard = {
//     return (
//          <div className='rounded-md subtle-background text-blue-900 px-3 py-2'>
//                                             <div className='font-semibold neutral-blueGrayLight'>10</div>
//                                             <div className='text-xs neutral-blueGrayLight'>Years</div>
//                                         </div>
//     )
// }

export default function ExamLevelsSection({ data, examName }: { data?: NavItem[], examName?: string }) {
    const [trail, setTrail] = React.useState<NavItem[]>([])
    const router = useRouter()
    const pathname = usePathname()
    const [loading, setLoading] = React.useState<boolean>(false);
    const [selected, setSelected] = React.useState<NavItem>();

    const items = data ?? []
    const roots = items.filter((i) => !i.parent_id)
    const last = trail.length ? trail[trail.length - 1] : null
    const visible = last ? items.filter((i) => i.parent_id === last.ent_id) : roots

    const handleSelect = (item: NavItem) => {
        setLoading(true)
        setSelected(item)
        const targetId = formatToSlug(item.name)
        const newUrl = `${pathname}/${encodeURIComponent(targetId)}`
        router.push(newUrl)
    }

    useEffect(() => {
        if (visible.length === 0) {
            setLoading(true)
            // const newUrl = `${pathname}/${trail[trail.length - 1].name}`
            // router.push(newUrl)
        } else {
            setLoading(false)
        }
    }, [trail, pathname, router, visible.length])

    const handleBack = () => setTrail((t) => t.slice(0, -1))
    const handleReset = () => setTrail([])
    const nextHints = ['Select Paper', 'Select Subject', 'Select Language']
    const nextHint = nextHints[Math.min(trail.length, nextHints.length - 1)]
    const decodedExamName = decodeURIComponent(examName || "")

    return (
        <MainContainer maxWidth="max-w-[900px]">
            <div className='space-y-12'>
                <CustomizableHeader
                    showEyebrow={false}
                    heading={`${decodedExamName} Exam on Clear Cutoff`}
                    highlightText={decodedExamName}
                    subheading={'Select the subjects you want. You can update later!'}
                    headingColor="text-gray-900"
                    highlightColor="text-blue-500"
                    subheadingColor="text-gray-600"
                    alignment="text-center"
                    headingClasses="!mb-4"
                    headingSize="display-medium"
                />
                <div>
                    <div className='mb-4 heading-large surface-text-gray-normal'>{decodedExamName} Papers</div>
                    <div className={['grid grid-cols-1 md:grid-cols-2 gap-4', loading ? 'opacity-50 cursor-not-allowed' : ''].join(' ')}>
                        {roots.sort((a, b) => a.name.localeCompare(b.name)).map((item) => {
                            const description = JSON.parse(item?.description as string)
                            return (
                                <CardWrap
                                    key={item.id}
                                    cursor="pointer"
                                    borderwidth={2}
                                    padding={2}
                                    className={[' ', selected?.id === item.id ? '!border-2 !border-blue-300 ' : ''].join(' ')}
                                    onClick={() => loading ? null : handleSelect(item)}
                                >
                                    <div className='space-y-4'>
                                        <div className='flex items-start justify-between'>
                                            <div className='heading-small text-gray-900'>{decodedExamName} {item.name}</div>
                                            {selected?.id === item.id && <CourseCheckBadge size={22} onClick={() => console.log("Arrow clicked")} />}
                                        </div>
                                        <div className='grid grid-cols-3 gap-3'>
                                            <div className='rounded-md subtle-background text-blue-900 px-3 py-2'>
                                                <div className='font-semibold neutral-blueGrayLight'>{description.years}</div>
                                                <div className='text-xs neutral-blueGrayLight'>Years</div>
                                            </div>
                                            <div className='rounded-md subtle-background text-blue-900 px-3 py-2'>
                                                <div className='font-semibold neutral-blueGrayLight'>{description.subjects}</div>
                                                <div className='text-xs neutral-blueGrayLight'>Subjects</div>
                                            </div>
                                            <div className='rounded-md subtle-background text-blue-900 px-3 py-2'>
                                                <div className='font-semibold neutral-blueGrayLight'>{description.questions}</div>
                                                <div className='text-xs neutral-blueGrayLight'>Questions</div>
                                            </div>
                                        </div>
                                    </div>
                                </CardWrap>
                            )
                        })}

                    </div>
                    {loading && (
                        <div className="col-span-1 md:col-span-2 flex items-center justify-center py-6" role="status" aria-live="polite">
                            <div className="flex items-center gap-3 text-gray-600">
                                <span className="relative flex h-9 w-9">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-9 w-9 bg-blue-500"></span>
                                </span>
                                <span className="font-medium">Loading levels…</span>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </MainContainer >
    )
}
