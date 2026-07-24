import { Suspense } from 'react'
import MyCoursesList from './MyCoursesList'
import MyCoursesListSkeleton from './MyCoursesListSkeleton'
import { myCourses } from '@/lib/dashboard/courses';

export default async function MyCoursesWrap() {
    const courses = await myCourses();

    return (
        <section className='space-y-3'>
            <div>
                <h2 className="text-xl font-semibold">My Course Wrap</h2>
                <p className="mt-1 text-sm text-slate-600">
                    High-level metrics for your application.
                </p>
            </div>
            <Suspense fallback={<MyCoursesListSkeleton />}>
                <MyCoursesList data={courses} />
            </Suspense>
        </section>
    )
}
