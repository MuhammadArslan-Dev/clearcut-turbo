import { Card } from "@clearcut/ui/card";
import Skeleton from "@clearcut/ui/skeleton";

export function CourseCardSkeleton() {
    return (
        <Card minWidth="250px" padding={0} maxWidth="300px">
            <div className="flex flex-col gap-3 px-1 pt-3 pb-2">
                <div className="grid grid-cols-7 px-2 gap-6">
                    {/* Left: logo + title + subtitle */}
                    <div className="col-span-3 flex flex-col gap-2">
                        <Skeleton
                            variant="circular"
                            width={64}
                            height={64} borderRadius={'999px'}
                        />

                        {/* was <Box sx={{ mt: 0.5 }}> — Joy's spacing unit is 8px,
                            so mt:0.5 === 4px === Tailwind mt-1 (verified in-browser) */}
                        <div className="mt-1">
                            <Skeleton variant="text" width={100} style={{ fontSize: '0.875rem' }} />
                            <Skeleton variant="text" width={80} style={{ fontSize: '0.75rem' }} />
                        </div>
                    </div>

                    {/* Right: exam details rows */}
                    <div className="col-span-4 flex flex-col gap-2">
                        {/* was <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                            flex:1 === Tailwind flex-1 (both compute to `1 1 0%`);
                            gap:1 === 8px === Tailwind gap-2 (verified in-browser) */}
                        <div className="flex-1 flex flex-col gap-2">
                            <Skeleton variant="text" width={140} style={{ fontSize: '1rem' }} />
                            <Skeleton variant="text" width={120} style={{ fontSize: '0.75rem' }} />
                            <Skeleton variant="text" width={100} style={{ fontSize: '0.75rem' }} />
                        </div>
                    </div>
                </div>

                {/* Bottom button skeleton */}
                <div className="flex flex-col gap-2 px-2 py-1">
                    <Skeleton
                        variant="rectangular"
                        height={36} borderRadius={'50px'}
                    />
                </div>
            </div>
        </Card>
    );
}