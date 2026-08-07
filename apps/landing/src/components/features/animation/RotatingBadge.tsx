"use client";
import React, { useEffect, useState } from "react";

type Direction = "up" | "down" | "left" | "right";

type RotatingBadgeProps = {
    items?: string[];
    intervalMs?: number;
    animationDuration?: number;
    direction?: Direction;
    text?: string;
};

const defaultItems = ["Videos", "Notes", "PDFs"];

export function RotatingBadge({
    items = defaultItems,
    intervalMs = 3000,
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
    const animClass = direction === "down" ? "badge-slide-down" : "badge-slide-up";

    return (
        <div className="flex items-center gap-2 text-sm md:text-base">
            <span className="body-small !font-normal text-surface-gray-subtle">{text}</span>

            <div className="relative h-7 min-w-[80px] overflow-hidden flex items-center">
                <span
                    key={`${current}-${index}`}
                    className={`inline-flex items-center px-4 py-0.5 rounded-full border-2 border-[var(--color-success)] bg-[var(--color-success-soft)] ${animClass}`}
                >
                    <p className="body-xsmall !font-semibold text-[var(--color-success)]">
                        {current}
                    </p>
                </span>
            </div>
        </div>
    );
}
