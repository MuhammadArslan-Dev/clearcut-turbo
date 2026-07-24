'use client'

import { useEffect, useState } from 'react'

export function useMobileSlideNavigation<T>() {
    const [active, setActive] = useState<T | null>(null)

    useEffect(() => {
        const onPopState = () => setActive(null)

        window.addEventListener('popstate', onPopState)
        return () => window.removeEventListener('popstate', onPopState)
    }, [])

    const open = (value: T) => {
        setActive(value)
        window.history.pushState({ value }, '')
    }

    const close = () => {
        window.history.back()
    }

    return {
        active,
        isOpen: Boolean(active),
        open,
        close,
        setActive, // for desktop sync
    }
}
