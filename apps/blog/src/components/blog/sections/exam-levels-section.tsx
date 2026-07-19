'use client'

import React, { useEffect } from 'react'
import CustomizableHeader from '@/components/customizable-header'
import CardWrap from '@/components/cards/card-wrap'
import MainContainer from '@/components/main-container'
import { useRouter, usePathname } from 'next/navigation'
import { formatToSlug, unFormatSlug } from '@/utils/slugify'
import CourseCheckBadge from '@/components/ui/badge/course-check-badge'
import { highlightTextUtil } from '@clearcut/utils/highlight-text'
import { Button } from '@mui/joy'
import { PencilSquareIcon } from '@heroicons/react/16/solid'
import ExamSelectionContainer from '@/components/ui/exam/exam-selection-container'
import Link from 'next/link'

type NavItem = {
    id: number | string
    ent_id: string
    exam_id: string
    parent_id: string
    name: string
    entity: string
}

export default function ExamLevelsSection({ data, examName }: { data?: NavItem[], examName?: string }) {
    const [trail, setTrail] = React.useState<NavItem[]>([])
    const router = useRouter()
    const pathname = usePathname()
    const [loading, setLoading] = React.useState<boolean>(false);

    const items = data ?? []
    const roots = items.filter((i) => !i.parent_id)
    const last = trail.length ? trail[trail.length - 1] : null
    const visible = last ? items.filter((i) => i.parent_id === last.entity) : roots

    const handleSelect = (item: NavItem) => {
        setTrail((t) => [...t, item])
    }

    useEffect(() => {
        if (visible.length === 0) {
            setLoading(true);

            if (!trail || trail.length === 0) return;

            // Get first and remaining elements
            const [firstElement, ...restTrail] = trail;

            // Build query params with levels[] format
            const queryParams = restTrail
                .map(item => `levels=${formatToSlug(item.name)}`)
                .join("&");


            // Create slug and new URL
            const slug = formatToSlug(firstElement?.name ?? "");
            const newUrl = `${pathname}/${slug}${queryParams ? `?${queryParams}` : ""}`;


            router.push(newUrl); // or router.push(newUrl, { shallow: true }) if you don’t want reload
        } else {
            setLoading(false);
        }
    }, [trail, pathname, router, visible.length]);


    const handleBack = (index: number) => setTrail((t) => t.slice(index, -1))
    const handleReset = () => setTrail([])
    const nextHints = ['Select Paper', 'Select Subject', 'Select Language']
    const nextHint = nextHints[Math.min(trail.length, nextHints.length - 1)]
    const decodedExamName = unFormatSlug(examName ?? "").toUpperCase()

    return (
        <div className='space-y-8'>
            <div className="px-3">
                <CustomizableHeader
                    showEyebrow={false}
                    heading={`${decodedExamName} Exam on Clear Cutoff`}
                    highlightText={decodedExamName}
                    subheading={'Select the subjects you want. You can update later!'}
                    headingColor="text-gray-900"
                    highlightColor="text-blue-500"
                    subheadingColor="text-gray-600"
                    alignment="md:text-center text-left"
                    headingClasses="!mb-1"
                    headingSize="heading-2xlarge !font-semibold"
                />
            </div>

            <div>
                <div className="px-3">
                    <p className='heading-xlarge !font-semibold mb-6'>Question Bank of {highlightTextUtil(decodedExamName, decodedExamName)} Exam</p>
                </div>

                {trail.length > 0 && (
                    <>
                        {
                            trail.map((t, idx) => (
                                <ExamSelectionContainer key={t.id} title={t.name} handleBack={() => handleBack(idx - 1)} />
                            ))
                        }
                    </>
                )}

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4 px-3'>

                    {visible.map((item) => (
                        <CardWrap bgcolor='white' key={item.id} cursor="pointer" padding={1.3} className='!border-2 !border-gray-200 !rounded-lg' onClick={() => handleSelect(item)}>
                            <div className='flex items-center justify-between'>
                                <div>{item.name}</div>
                                <div className='click:block hidden'>
                                    <CourseCheckBadge size={16} fill="#0083ff" />
                                </div>
                            </div>
                        </CardWrap>
                    ))}

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


                    <div className='hidden'>
                        {roots.map((item: { name?: string }, index) => (
                            <div key={item.name || index}>
                                <Link href={`${pathname}/${formatToSlug(item?.name ?? "")}` || "#"}>
                                    {item?.name}
                                </Link>
                            </div>
                        ))}

                    </div>

                </div>
            </div>

        </div>
    )
}
