import clsx from 'clsx'

type Props = {
    show: boolean
    direction?: 'left' | 'right'
    children: React.ReactNode
    className?: string
}

export function SlidePane({
    show,
    direction = 'right',
    children,
    className,
}: Props) {
    const hidden =
        direction === 'right'
            ? 'translate-x-full'
            : '-translate-x-full'

    return (
        <div
            className={clsx(
                'absolute inset-0 transition-transform duration-300 ease-out',
                show ? 'translate-x-0' : hidden,
                className
            )}
        >
            {children}
        </div>
    )
}
