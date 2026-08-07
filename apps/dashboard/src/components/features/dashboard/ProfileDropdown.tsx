"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const menuVariants = {
    hidden: { opacity: 0, y: -10, scale: 0.98 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            type: "spring" as const,
            stiffness: 260,
            damping: 30,
            staggerChildren: 0.05,
        },
    },
    exit: {
        opacity: 0,
        y: -10,
        scale: 0.98,
        transition: { duration: 0.25 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: -4 },
    visible: { opacity: 1, y: 0 },
};

export default function ProfileDropdown() {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement | null>(null);

    // Close on click outside
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (!ref.current || ref.current.contains(e.target as Node)) return;
            setOpen(false);
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    return (
        <div className="relative inline-block text-left" ref={ref}>
            {/* Trigger button / avatar */}
            <button
                onClick={() => setOpen((o) => !o)}
                className="flex items-center gap-2 rounded-full border px-3 py-1.5 bg-white hover:bg-gray-100 shadow-sm"
                aria-haspopup="menu"
                aria-expanded={open}
            >
                <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center text-sm font-semibold">
                    U
                </div>
                <span className="hidden md:inline text-sm font-medium">Username</span>
                <svg
                    className="h-4 w-4 text-gray-500"
                    viewBox="0 0 20 20"
                    fill="none"
                >
                    <path
                        d="M5 7.5L10 12.5L15 7.5"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </button>

            {/* Dropdown menu */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        key="menu"
                        variants={menuVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="absolute right-0 mt-2 w-56 origin-top-right rounded-lg bg-white shadow-lg ring-1 ring-black/5 overflow-hidden z-50"
                    >
                        <div className="px-4 py-3 border-b">
                            <p className="text-sm font-medium text-gray-900">
                                Username
                            </p>
                            <p className="mt-0.5 text-xs text-gray-500">
                                user@example.com
                            </p>
                        </div>

                        <motion.button
                            variants={itemVariants}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                            onClick={() => {
                                // handle navigation
                                setOpen(false);
                            }}
                        >
                            Profile
                        </motion.button>

                        <motion.button
                            variants={itemVariants}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                        >
                            Settings
                        </motion.button>

                        <motion.button
                            variants={itemVariants}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                            onClick={() => {
                                // handle logout
                                setOpen(false);
                            }}
                        >
                            Log out
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}