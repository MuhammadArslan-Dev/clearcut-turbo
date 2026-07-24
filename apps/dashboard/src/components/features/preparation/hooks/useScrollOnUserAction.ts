import { useEffect, useRef } from 'react'

interface Options {
  activeId: string | null
  getIndex: (id: string) => number
  refs: React.MutableRefObject<(HTMLElement | null)[]>
  containerRef?: React.RefObject<(HTMLElement | null)> 
  enabled?: boolean
}

export function useScrollOnUserAction({
  activeId,
  getIndex,
  refs,
  containerRef,
  enabled = true,
}: Options) {
  const isUserActionRef = useRef(false)
  const isAnimatingRef = useRef(false)

  const markUserAction = () => {
    isUserActionRef.current = true
  }

  useEffect(() => {
    if (!enabled || !isUserActionRef.current || !activeId) return

    const index = getIndex(activeId)
    const el = refs.current[index]
    const container = containerRef?.current

    if (!el || !container) return

    isAnimatingRef.current = true

    const containerRect = container.getBoundingClientRect()
    const elRect = el.getBoundingClientRect()

    const isRTL = getComputedStyle(container).direction === 'rtl'

    const offset =
      elRect.left -
      containerRect.left -
      container.clientWidth / 2 +
      el.clientWidth / 2

    container.scrollTo({
      left: isRTL
        ? container.scrollLeft - offset
        : container.scrollLeft + offset,
      behavior: 'smooth',
    })

    const unlock = () => {
      isAnimatingRef.current = false
      isUserActionRef.current = false
    }

    const timer = setTimeout(unlock, 350)
    return () => clearTimeout(timer)
  }, [activeId, enabled, getIndex, refs, containerRef])

  return {
    markUserAction,
    isAnimatingRef,
  }
}
