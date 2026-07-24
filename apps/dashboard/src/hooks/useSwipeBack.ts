import { useEffect } from 'react'

export function useSwipeBack(onBack: () => void) {
    useEffect(() => {
        let startX = 0

        const onTouchStart = (e: TouchEvent) => {
            startX = e.touches[0].clientX
        }

        const onTouchEnd = (e: TouchEvent) => {
            const diff = e.changedTouches[0].clientX - startX
            if (diff > 80) onBack()
        }

        window.addEventListener('touchstart', onTouchStart)
        window.addEventListener('touchend', onTouchEnd)

        return () => {
            window.removeEventListener('touchstart', onTouchStart)
            window.removeEventListener('touchend', onTouchEnd)
        }
    }, [onBack])
}
