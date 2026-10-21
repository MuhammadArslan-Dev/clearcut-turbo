import React from 'react'

export default function ButtonShimmerOverlay() {
    return (
        <div
            // `.button-shimmer` (globals.css): same sweep the framer-motion
            // version ran — translateX -150% → 150%, 3s, linear, forever.
            className="pointer-events-none button-shimmer"
            style={{
                position: "absolute",
                inset: 0,
                // Narrower band than a plain 0%/50%/100% spread (that made
                // the bright streak span almost the whole element) — tighter
                // stops around the 50% peak keep the light confined to a
                // thin sweep instead of a wide glow.
                background:
                    "linear-gradient(120deg, rgba(255,255,255,0) 42%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0) 58%)",
                // put it under the content
                zIndex: 0,
            }}
        />
    )
}
