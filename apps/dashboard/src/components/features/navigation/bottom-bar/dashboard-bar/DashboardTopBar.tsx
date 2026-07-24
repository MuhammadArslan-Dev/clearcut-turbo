// src/components/layout/Topbar.tsx
"use client";

import { useTranslations } from "next-intl";

import {
  CheckIcon,
} from "@/components/ui/icons";

import clsx from "clsx";



export default function DashboardTopBar() {
  const t = useTranslations("examType");

  const padding = " pb-1 pt-3 px-3 md:py-4 md:px-4";

  return (
    <header className="border-slate-200 md:p-3 ">
      <div
        className={clsx(
          "bg-transparen bg-white flex md:flex-row md:h-[64px] flex-col gap-3 md:gap-0 md:items-center justify-between md:rounded-[8px]",
          padding
        )}
      >
        <div className="flex justify-between md:justify-start items-center gap-4">
          <h1 className="heading-large !font-semibold">{t(`title`)}</h1>
          <div className="flex items-center gap-1">
            <CheckIcon
              size={20}
              color="var(--color-success)"
              variant="design"
            />
            <p className="body-large text-[var(--color-success)]">
              {t("byClearCutoff")}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
