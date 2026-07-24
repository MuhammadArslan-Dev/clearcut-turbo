import { MyCourseCardSkeleton } from './MyCourseCardSkeleton'

export default function MyCoursesListSkeleton() {
    return (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4 bg-white  p-4 rounded-md">

            {Array.from({ length: 4 }).map((_, index) => (
                <MyCourseCardSkeleton
                    key={index}
                />
            ))}

        </div>
    )
}
