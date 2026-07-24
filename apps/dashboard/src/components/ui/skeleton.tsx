// components/ui/skeleton.tsx
export function Skeleton({
    className,
    rounded = 'rounded-md'
}: { className?: string, rounded?: string }) {
    return (
        <div
            className={`animate-pulse ${rounded} bg-gray-300 ${className}`}
        />
    );
}
