
import { Card } from "@clearcut/ui/card";
import Skeleton from '@mui/joy/Skeleton';
import Box from '@mui/joy/Box';

export function MyCourseCardSkeleton() {
    return (
        <Card bgcolor='bg-white' padding={0}>
            <div className="flex flex-col gap-3 px-1 pt-3 pb-2 relative">
                {/* Top-right badge */}
                <div className="absolute -top-[10.5px] right-5">
                    <Skeleton
                        variant="circular"
                        width={80}
                        height={20}
                        sx={{ borderRadius: '999px' }}
                    />
                </div>

                {/* Header: logo + text */}
                <div className="flex px-2 gap-3">
                    {/* Logo */}
                    <Skeleton
                        variant="circular"
                        width={64}
                        height={64}
                        sx={{ borderRadius: '999px' }}
                    />

                    {/* Title + meta */}
                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Skeleton variant="text" width={140} sx={{ fontSize: '1rem' }} />
                        <Skeleton variant="text" width={120} sx={{ fontSize: '0.75rem' }} />
                        <Skeleton variant="text" width={100} sx={{ fontSize: '0.75rem' }} />
                    </Box>
                </div>

                {/* Progress sections */}
                <div className="flex flex-col gap-3 px-2">
                    {/* Topics skeleton */}
                    <div className="flex flex-col gap-1">
                        <div className="flex justify-between items-center">
                            <Skeleton variant="text" width={120} sx={{ fontSize: '0.75rem' }} />
                            <Skeleton variant="text" width={60} sx={{ fontSize: '0.75rem' }} />
                        </div>
                        <Skeleton
                            variant="circular"
                            height={8}
                            sx={{ borderRadius: '999px', mt: 0.5 }}
                        />
                        <Skeleton variant="text" width={160} sx={{ fontSize: '0.875rem' }} />
                    </div>

                    {/* Tests skeleton */}
                    <div className="flex flex-col gap-1">
                        <div className="flex justify-between items-center">
                            <Skeleton variant="text" width={120} sx={{ fontSize: '0.75rem' }} />
                            <Skeleton variant="text" width={60} sx={{ fontSize: '0.75rem' }} />
                        </div>
                        <Skeleton
                            variant="circular"
                            height={8}
                            sx={{ borderRadius: '999px', mt: 0.5 }}
                        />
                        <Skeleton variant="text" width={160} sx={{ fontSize: '0.875rem' }} />
                    </div>
                </div>

                {/* Buttons skeleton */}
                <div className="flex flex-col gap-2 px-2 py-1">
                    <Skeleton
                        variant="circular"
                        height={36}
                        sx={{ borderRadius: '50px' }}
                    />
                    <Skeleton
                        variant="circular"
                        height={36}
                        sx={{ borderRadius: '50px' }}
                    />
                </div>
            </div>
        </Card>
    );
}