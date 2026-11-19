"use client";
import React, { useEffect, useState } from "react";

type Direction = "up" | "down" | "left" | "right";

type RotatingBadgeProps = {
    items?: string[];
    intervalMs?: number;
    animationDuration?: number;
    direction?: Direction;
    text?: string;
    /** When set, the word pill is a real button (CC-108: students tapped it). Omit = plain decoration, as before. */
    onPillClick?: () => void;
};

const defaultItems = ["Videos", "Notes", "PDFs"];

export function RotatingBadge({
    items = defaultItems,
    intervalMs = 3000,
    direction = "up",
    text = "Unlock what you need to clear exam —",
    onPillClick,
}: RotatingBadgeProps) {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        if (items.length <= 1) return;
        const id = setInterval(() => {
            setIndex((prev) => (prev + 1) % items.length);
        }, intervalMs);
        return () => clearInterval(id);
    }, [items, intervalMs]);

    const Pill = onPillClick ? "button" : "span";
    const current = items[index];
    const animClass = direction === "down" ? "badge-slide-down" : "badge-slide-up";

    return (
        <div className="flex items-center gap-2 text-sm md:text-base">
            <span className="body-small !font-normal text-surface-gray-subtle">{text}</span>

            <div className="relative h-7 min-w-[80px] overflow-hidden flex items-center">
                <Pill
                    key={`${current}-${index}`}
                    {...(onPillClick ? { type: "button" as const, onClick: onPillClick } : {})}
                    className={`inline-flex items-center px-4 py-0.5 rounded-full border-2 border-[var(--color-success)] bg-[var(--color-success-soft)] ${animClass}${onPillClick ? " cursor-pointer" : ""}`}
                >
                    <p className="body-xsmall !font-semibold text-[var(--color-success)]">
                        {current}
                    </p>
                </Pill>
            </div>
        </div>
    );
}
