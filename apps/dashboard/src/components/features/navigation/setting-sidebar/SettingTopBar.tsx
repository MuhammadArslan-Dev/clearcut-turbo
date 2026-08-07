// src/components/layout/Topbar.tsx
"use client";

import { usePathname } from "@/i18n/navigation"; // locale-aware pathname
import useLanguageSwitch from "@/hooks/useLanguageSwitch";
import { mainNav } from "@/config/navigation";
import { useTranslations } from "next-intl";
import {
  LanguageIcon,
  ProfileIcon,
  WarningCircleIcon,
} from "@/components/ui/icons";
import { useAuth } from "@/providers/AuthProvider";
import clsx from "clsx";
import { useModalStore } from "@/store/modal/useModalStore";
import { useRouter } from "next/navigation";
import { trackEvent } from "@/lib/analytics/browser";

const PAGE_TITLES = mainNav;

function getPageTitle(pathname: string) {
  // Match the most specific route (handles nested paths like /dashboard/my-courses/123)
  const match = PAGE_TITLES.slice()
    .sort((a, b) => b.href.length - a.href.length)
    .find(
      (item) => pathname === item.href || pathname.startsWith(item.href + "/")
    );

  return match?.key ?? "Dashboard";
}

export default function SettingTopBar() {
  const { locale, switchLanguage } = useLanguageSwitch();
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const t = useTranslations();
  const open = useModalStore((state) => state.open);

  const padding = "py-4 px-3 md:py-2 md:px-4";

  return (
    <header className="border-slate-200 md:p-3">
      <div
        className={clsx(
          "bg-[#0053A2] flex md:flex-row flex-col gap-2 md:gap-0 md:items-center justify-between md:rounded-[8px]",
          padding
        )}
      >
        <div className="flex items-center text-white heading-large !font-semibold gap-2 md:hidden">
          <p className="">{t("profile.title")}</p>
        </div>
        <div className="flex items-center gap-2">

          <ProfileIcon color="#ffffff" size={48} />

          <div className="text-white">
            <h1 className="body-large !font-semibold">
              {t("profile.greeting", {
                name: user?.full_name || "Student",
              })}{" "}
            </h1>
            <p className="body-small">{user?.phone}</p>
          </div>

        </div>

        <div className="hidden md:flex items-center gap-4">

          <div
            onClick={async () => {
              await trackEvent("Profile Option Clicked", {
                option_selected: "helpsport",
              });
              open("helpsport");
            }}
            className="cursor-pointer h-12 w-[173px] gap-2 bg-white rounded-[8px] flex items-center px-4 py-2"
          >
            <WarningCircleIcon variant={"help"} size={24} />
            <p className="body-medium !font-semibold whitespace-nowrap">
              {t("profileMenu.helpSupport.title")}
            </p>
          </div>
          <div
            onClick={async () => {
              await trackEvent("Profile Option Clicked", {
                option_selected: "language",
              });
              open("language");
            }}
            className="cursor-pointer h-12 w-[113px] gap-2 bg-white rounded-[8px] flex items-center px-4 py-2"
          >
            <LanguageIcon size={32} />
            <p className="body-medium !font-semibold">
              {locale === "en" ? "Eng" : "Hi"}
            </p>
          </div>

          {/* <ProfileDropdown /> */}
        </div>
      </div>
    </header>
  );
}
