import { useEffect, useRef, useState } from "react";

// "icon" (the moving-arrow phase) removed by request — this used to
// alternate between an icon-move phase and a shimmer phase forever; now it
// only ever enters "shimmer", once, and stays there.
type ButtonPhase = "idle" | "shimmer";

export default function useButtonArrowAnimation({
  data,
}: {
  data: string | number | boolean | null;
}) {
  const [buttonPhase, setButtonPhase] = useState<ButtonPhase>("idle");

  const started = useRef(false);

  const languageSelected = data;

  useEffect(() => {
    if (!languageSelected) {
      setButtonPhase("idle");
      return;
    }

    const startAnimation = () => {
      if (started.current) return;
      started.current = true;
      setButtonPhase("shimmer");
      removeListeners();
    };

    const events = ["click", "scroll", "keydown", "touchstart"];

    const removeListeners = () =>
      events.forEach((event) =>
        window.removeEventListener(event, startAnimation)
      );

    events.forEach((event) =>
      window.addEventListener(event, startAnimation, { passive: true })
    );

    return () => {
      removeListeners();
    };
  }, [languageSelected]);

  return { buttonPhase };
}