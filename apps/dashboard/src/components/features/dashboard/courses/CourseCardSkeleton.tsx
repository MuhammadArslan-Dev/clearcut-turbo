import { Card } from "@clearcut/ui/card";
import Skeleton from '@mui/joy/Skeleton';
import Box from '@mui/joy/Box';

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
                            height={64}
                            sx={{ borderRadius: '999px' }}
                        />

                        <Box sx={{ mt: 0.5 }}>
                            <Skeleton variant="text" width={100} sx={{ fontSize: '0.875rem' }} />
                            <Skeleton variant="text" width={80} sx={{ fontSize: '0.75rem' }} />
                        </Box>
                    </div>

                    {/* Right: exam details rows */}
                    <div className="col-span-4 flex flex-col gap-2">
                        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Skeleton variant="text" width={140} sx={{ fontSize: '1rem' }} />
                            <Skeleton variant="text" width={120} sx={{ fontSize: '0.75rem' }} />
                            <Skeleton variant="text" width={100} sx={{ fontSize: '0.75rem' }} />
                        </Box>
                    </div>
                </div>

                {/* Bottom button skeleton */}
                <div className="flex flex-col gap-2 px-2 py-1">
                    <Skeleton
                        variant="rectangular"
                        height={36}
                        sx={{ borderRadius: '50px' }}
                    />
                </div>
            </div>
        </Card>
    );
}