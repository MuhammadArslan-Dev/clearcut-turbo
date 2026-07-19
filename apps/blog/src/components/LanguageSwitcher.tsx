"use client";

import { useTransition } from "react";
import { useParams } from "next/navigation";
import { Locale, useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { AppLocale } from "@/types/components/language";
import LanguageIcon from "./ui/icons/language-icon";
export default function LanguageSwitcher({ onClick }: { onClick: () => void }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const pathname = usePathname();
  const params = useParams();
  const locale = useLocale() as AppLocale; // current locale

  const locales = routing.locales;
  const currentIndex = locales.indexOf(locale);

  function switchLanguage(nextLocale: Locale) {
    startTransition(() => {
      router.replace(
        // @ts-expect-error - TS validates params per pathname
        { pathname, params },
        { locale: nextLocale }
      );
    });
  }

  return (
    <button
      onClick={onClick}
      disabled={isPending}
      className="flex items-center gap-2 bg-white"
    >
      <LanguageIcon size={32} color="#143D52" secondaryColor="#E2E8F0" />

      <span className="text-sm font-medium uppercase">{locale}</span>
    </button>
  );
}
