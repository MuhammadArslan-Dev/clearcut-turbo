import { useEffect, useRef } from "react";

interface Options {
  activeId: string | null;
  getIndex: (id: string) => number;
  refs: React.MutableRefObject<(HTMLElement | null)[]>;
  containerRef?: React.RefObject<HTMLElement | null>;
  enabled?: boolean;
}

export function useScrollOnUserAction({
  activeId,
  getIndex,
  refs,
  containerRef,
  enabled = true,
}: Options) {
  const isUserActionRef = useRef(false);

  const markUserAction = () => {
    isUserActionRef.current = true;
  };

  useEffect(() => {
    if (!enabled || !isUserActionRef.current || !activeId) return;

    const index = getIndex(activeId);
    const el = refs.current[index];
    const container = containerRef?.current;

    if (!el || !container) return;

    const containerRect = container.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();

    const offset =
      elRect.left -
      containerRect.left -
      container.clientWidth / 2 +
      el.clientWidth / 2;

    container.scrollTo({
      left: container.scrollLeft + offset,
      behavior: "smooth",
    });

    const timer = setTimeout(() => {
      isUserActionRef.current = false;
    }, 300);

    return () => clearTimeout(timer);
  }, [activeId, enabled, getIndex, refs, containerRef]);

  return {
    markUserAction,
  };
}