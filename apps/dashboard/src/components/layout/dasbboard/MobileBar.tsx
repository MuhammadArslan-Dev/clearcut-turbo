"use client";
import clsx from "clsx";
import { Link, usePathname } from "@/i18n/navigation"; // ⬅️ use i18n navigation
import { mainNav } from "@/config/navigation";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";


export default function MobileBar() {
    const pathname = usePathname();
    const t = useTranslations("Sidebar");
    return (
        <div className="md:hidden border-b border-slate-200 md:px-2">
            <div className="w-full h-[var(--dashboard-mobile-bar-height)] bg-white flex items-center justify-between rounded-md px-4">
                <div className="flex justify-center items-center w-full gap-5 h-full">
                    {mainNav.map((item) => {
                        const isActive =
                            pathname === item.href ||
                            (item.href !== "/dashboard" && pathname.startsWith(item.href));

                        return (
                            <div key={item.href} className="relative flex  w-full h-full">
                                <Link
                                    href={item.href}
                                    className={clsx(
                                        "relative flex items-center z-10 rounded-sm px-3 py-3 text-sm font-medium transition-colors",
                                        isActive
                                            ? "text-brand"
                                            : "text-slate-600 hover:text-slate-900"
                                    )}
                                >
                                    {t(`${item.key}`)}
                                    {isActive && (
                                        <motion.div
                                            layoutId="nav-active"
                                            className="absolute top-0 left-0 right-0 h-1 rounded-full bg-brand"
                                            transition={{
                                                type: "spring",
                                                stiffness: 350,
                                                damping: 36,
                                            }}
                                        />
                                    )}
                                </Link>
                            </div>
                        );
                    })}

                </div>


            </div>
        </div>
    )
}
