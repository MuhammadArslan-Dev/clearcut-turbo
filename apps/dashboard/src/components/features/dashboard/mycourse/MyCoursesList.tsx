'use client'
import React from 'react'
import { MyCourseCardSkeleton } from './MyCourseCardSkeleton'
import MyCourseCard from './MyCourseCard'
import { MyCourse } from '@/types/Exam'
import { useCourseStore } from '@/store/course/useCourseStore'

export default function MyCoursesList({ data }: { data?: MyCourse[] }) {
    const open = useCourseStore((s) => s.open);

    return (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4 bg-white  p-4 rounded-md">
            {!data ?
                (
                    Array.from({ length: 4 }).map((_, index) => (
                        <MyCourseCardSkeleton
                            key={index}
                        />
                    ))
                )
                : (
                    data?.map((course, index) => (
                        <MyCourseCard
                            key={index}
                            badge={course.status.toString()}
                            logo={course.exam.logo_url}
                            courseName={course.exam.short_name}
                            examData={12}
                            rating={12}
                            topics={{
                                title: "Course",
                                completed: 0,
                                total: 12,
                            }}
                            tests={{
                                title: "Test Series",
                                completed: 0,
                                total: 12,
                            }}
                            maxWidth="350px"
                            editClick={() => open('edit', course.exam)}
                            unlockClick={() => open('payment', course.exam)}
                        />
                    ))
                )}
        </div>
    )
}
