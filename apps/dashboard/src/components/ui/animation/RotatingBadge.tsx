// RotatingBadge.tsx
import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Chip from "@mui/joy/Chip";

type Direction = "up" | "down" | "left" | "right";

type RotatingBadgeProps = {
    items?: string[];
    intervalMs?: number;
    animationDuration?: number;
    direction?: Direction;
    text?: string;
};

const getVariants = (direction: Direction) => {
    switch (direction) {
        case "up":
            return {
                initial: { y: 16, opacity: 0 },
                animate: { y: 0, opacity: 1 },
                exit: { y: -16, opacity: 0 },
            };
        case "down":
            return {
                initial: { y: -16, opacity: 0 },
                animate: { y: 0, opacity: 1 },
                exit: { y: 16, opacity: 0 },
            };
        case "left":
            return {
                initial: { x: 32, opacity: 0 },
                animate: { x: 0, opacity: 1 },
                exit: { x: -32, opacity: 0 },
            };
        case "right":
            return {
                initial: { x: -32, opacity: 0 },
                animate: { x: 0, opacity: 1 },
                exit: { x: 32, opacity: 0 },
            };
        default:
            return {
                initial: { y: 16, opacity: 0 },
                animate: { y: 0, opacity: 1 },
                exit: { y: -16, opacity: 0 },
            };
    }
};

const defaultItems = ["Videos", "Notes", "PDFs"];

export function RotatingBadge({
    items = defaultItems,
    intervalMs = 3000,
    animationDuration = 0.25,
    direction = "up",
    text = "Unlock what you need to clear exam —",
}: RotatingBadgeProps) {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        if (items.length <= 1) return;

        const id = setInterval(() => {
            setIndex((prev) => (prev + 1) % items.length);
        }, intervalMs);

        return () => clearInterval(id);
    }, [items, intervalMs]);

    const current = items[index];
    const motionVariants = getVariants(direction);

    return (
        <div className="flex items-center gap-2 text-sm md:text-base">
            <span className="body-medium !font-normal text-surface-gray-subtle whitespace-nowrap">{text}</span>

            {/* Badge container */}
            <div className="relative h-7 min-w-[70px] overflow-hidden">

                <AnimatePresence mode="wait">

                    <motion.span
                        key={current}
                        initial={motionVariants.initial}
                        animate={motionVariants.animate}
                        exit={motionVariants.exit}
                        transition={{ duration: animationDuration, ease: "easeOut" }}
                        className="inline-flex"
                    >
                        <Chip className={['border-2 cursor-pointer', "!border-[var(--color-success)]"].join(" ")}
                            sx={{
                                backgroundColor: "var(--color-success-soft)",
                                padding: "1.5px 16px",
                                color: "var(--color-success)",
                            }}

                            size="md" >
                            <p className="body-xsmall !font-semibold">
                                {current}
                            </p>
                        </Chip>
                    </motion.span>
                </AnimatePresence>
            </div>
        </div>
    );
}