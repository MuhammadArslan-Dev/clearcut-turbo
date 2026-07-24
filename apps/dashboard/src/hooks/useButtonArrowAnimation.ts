import React, { useEffect, useState } from 'react'
type ButtonPhase = 'idle' | 'icon' | 'shimmer';

export default function useButtonArrowAnimation({ data }: { data: string | number | boolean | null }) {
    const [buttonPhase, setButtonPhase] = useState<ButtonPhase>('idle');

    // Example: data.language exists like in your code
    const languageSelected = data;

    useEffect(() => {
        if (!languageSelected) {
            setButtonPhase('idle');
            return;
        }

        // Durations (ms)
        const ICON_MS = 4700;     // icon moves for 2s
        const SHIMMER_MS = 2500;  // shimmer shows for 2.5s

        let phase: 'icon' | 'shimmer' = 'icon';
        setButtonPhase('icon');

        let timeoutId: ReturnType<typeof setTimeout>;

        const loop = () => {
            const duration = phase === 'icon' ? ICON_MS : SHIMMER_MS;

            timeoutId = setTimeout(() => {
                // toggle phase
                phase = phase === 'icon' ? 'shimmer' : 'icon';
                setButtonPhase(phase);
                loop();
            }, duration);
        };

        loop();

        return () => clearTimeout(timeoutId);
    }, [languageSelected]);

    return {
        buttonPhase
    }
}
