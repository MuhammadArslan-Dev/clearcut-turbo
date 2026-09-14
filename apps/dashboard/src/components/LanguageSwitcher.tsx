"use client";

import { useTransition } from "react";
import { useParams } from "next/navigation";
import { Locale, useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import Image from "next/image";
import { routing } from "@/i18n/routing";
import { AppLocale } from "@/types/components/language";

export default function LanguageSwitcher() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const pathname = usePathname();
  const params = useParams();
  const locale = useLocale(); // current locale

  const locales = routing.locales;
  const currentIndex = locales.indexOf(locale as AppLocale);
  const nextLocale = locales[(currentIndex + 1) % locales.length]; // cycle

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
      onClick={() => switchLanguage(nextLocale as Locale)}
      disabled={isPending}
      className="flex items-center gap-2 rounded-lg border px-3 py-2 bg-white hover:bg-gray-100 shadow-sm transition disabled:opacity-50"
    >
      <Image
        src={`/locale/${locale}.png`}
        alt={locale}
        width={20}
        height={20}
        className="rounded"
      />
      <span className="text-sm font-medium uppercase">{locale}</span>
      <span className="text-xs text-gray-500">⇄</span>
    </button>
  );
}
