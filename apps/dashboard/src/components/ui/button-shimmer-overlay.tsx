import { motion } from 'framer-motion'
import React from 'react'

export default function ButtonShimmerOverlay() {
    return (
        <motion.div
            className="pointer-events-none "
            style={{
                position: "absolute",
                inset: 0,
                background:
                    "linear-gradient(120deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.7) 50%, rgba(255,255,255,0) 100%)",
                // put it under the content
                zIndex: 0,
            }}
            initial={{ x: "-150%" }}
            animate={{ x: ["-150%", "150%"] }}
            transition={{
                repeat: Infinity,
                duration: 3,
                ease: "linear",
            }}
        />
    )
}
