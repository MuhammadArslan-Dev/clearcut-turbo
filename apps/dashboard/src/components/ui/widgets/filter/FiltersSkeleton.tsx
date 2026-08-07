import { Skeleton } from "../../skeleton";


interface FiltersSkeletonProps {
    /** show skeleton title above chips */
    title?: string;
    /** how many chip skeletons to render */
    chipCount?: number;
}

export function FiltersSkeleton({
    title = "",
    chipCount = 4,
}: FiltersSkeletonProps) {

    return (
        <div>
            {title && <div className="mb-2 body-medium !font-semibold">{title}</div>}

            <div className="col-span-4 flex  gap-2">
                {Array.from({ length: chipCount }).map((_, i) => (
                    <Skeleton
                        key={i}
                        className="w-[64px] h-[28px]"
                        rounded="rounded-[50px]"
                    />
                ))}
            </div>
        </div>
    );
}