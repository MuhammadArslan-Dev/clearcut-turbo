// src/components/layout/Topbar.tsx
"use client";

import { usePathname } from "@/i18n/navigation"; // locale-aware pathname
import useLanguageSwitch from "@/hooks/useLanguageSwitch";
import { mainNav } from "@/config/navigation";
import { useTranslations } from "next-intl";
import ProfileDropdown from "@/components/features/dashboard/ProfileDropdown";
import LanguageModal from "@/components/modals/language-modal/LanguageModal";
import { useState } from "react";
import { EnLangCircleIcon, HomeIcon, LanguageIcon, ProfileIcon } from "@/components/ui/icons";
import { useAuth } from "@/providers/AuthProvider";

const PAGE_TITLES = mainNav;

function getPageTitle(pathname: string) {
    // Match the most specific route (handles nested paths like /dashboard/my-courses/123)
    const match = PAGE_TITLES
        .slice()
        .sort((a, b) => b.href.length - a.href.length)
        .find(
            (item) =>
                pathname === item.href || pathname.startsWith(item.href + "/")
        );

    return match?.key ?? "Dashboard";
}

export default function Topbar() {
    const { locale, switchLanguage } = useLanguageSwitch();
    const { user, loading } = useAuth();
    const pathname = usePathname();
    const pageTitle = getPageTitle(pathname);
    const t = useTranslations("Sidebar");
    const [isOpen, setIsOpne] = useState<boolean>(false);

    return (
        <header className="border-slate-200 md:p-3">
            <div className="h-[var(--dashboard-header-height)] bg-[#0053A2] flex items-center justify-between rounded-[8px] px-4">
                <div className="flex items-center gap-2">
                    <ProfileIcon color="#ffffff" size={48} />
                    <div className="text-white">
                        <h1 className="body-large !font-semibold">Hi, {user?.full_name || 'Student'}</h1>
                        <p className="body-small">{user?.phone}</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div
                        // onClick={() => setIsOpne(true)}
                        className="cursor-pointer h-12 w-[173px] gap-2 bg-white rounded-[8px] flex items-center px-4 py-2">
                        <HomeIcon />
                        <p className="body-medium !font-semibold">Help & Support</p>
                    </div>
                    <div
                        onClick={() => setIsOpne(true)}
                        className="cursor-pointer h-12 w-[113px] gap-2 bg-white rounded-[8px] flex items-center px-4 py-2">
                        <LanguageIcon />
                        <p className="body-medium !font-semibold">{locale === 'en' ? "Eng" : "Hi"}</p>
                    </div>

                    {/* <ProfileDropdown /> */}
                </div>
            </div>
            <LanguageModal isOpen={isOpen} closeModal={() => setIsOpne(false)} />
        </header>
    );
}