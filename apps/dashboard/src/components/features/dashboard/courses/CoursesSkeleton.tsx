
import { CourseCardSkeleton } from './CourseCardSkeleton';
import { FiltersSkeleton } from '@/components/ui/widgets/filter/FiltersSkeleton';

export default function CoursesSkeleton() {

    return (
        <div>
            <div className="flex gap-2 overflow-x-auto p-3 bg-white">

                <FiltersSkeleton />

            </div>

            <div
                className="flex overflow-x-auto md:grid gap-4 md:grid-cols-2 xl:grid-cols-4 md:rounded-md"

            >

                {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index}>
                        <CourseCardSkeleton />
                    </div>
                ))}
            </div>
        </div>
    );
}
