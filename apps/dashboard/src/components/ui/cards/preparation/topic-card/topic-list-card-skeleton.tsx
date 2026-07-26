// TopicListCardSkeleton.tsx
import * as React from 'react';
// Only Skeleton is used here. `Card` and `Stack` were imported but never
// rendered — and that unused `Card` was the last remaining @mui/joy Card import
// in the monorepo, which made it look as though a second Card primitive was
// still in play. Removed so the shared packages/ui Card is provably the only one.
import Skeleton from "@clearcut/ui/skeleton";
import clsx from 'clsx';

interface Props {
    bgColor?: string
}

const TopicListCardSkeleton: React.FC<Props> = (
    {
        bgColor = "bg-gray-200"
    }
) => {
    return (
        <div className={clsx("flex items-center rounded-md gap-3 p-1", bgColor)}>
            {/* Left: circle-tick icon placeholder */}
            <Skeleton variant="circular" width={32} height={32} />

            {/* Right: main card */}
            <div className="flex-1 px-3 py-2 space-y-1 bg-white rounded-md">

                    {/* Row 1: title + time pill */}
                    <div className="flex items-center justify-between gap-2">
                        {/* Title skeleton */}
                        <Skeleton variant="text" width="70%" style={{ fontSize: '1rem' }} />

                        {/* Time badge skeleton */}
                        <Skeleton
                            variant="text"
                            width={72}
                            height={22} borderRadius={999}
                        />
                    </div>

                    {/* Row 2: video + difficulty + player icon */}
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex gap-3">
                            {/* Video info skeleton */}
                            <Skeleton variant="text" width={90} />

                            {/* Difficulty skeleton */}
                            <Skeleton variant="text" width={80} />
                        </div>

                        {/* Player icon skeleton */}
                        <Skeleton variant="circular" width={28} height={28} />
                    </div>
            </div>
        </div>
    );
};

export default TopicListCardSkeleton;