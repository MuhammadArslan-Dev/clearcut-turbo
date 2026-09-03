import LocaleLink from "./LocaleLink";
import { getDict, Locale } from "@/lib/dictionary";

/**
 * Segmented switcher between the two primary tool modes, sitting directly
 * above the Configuration card on both the hub and the Add Name & Date page
 * so either is one click away from the other — every other standalone tool
 * (/image-compressor, /signature-compressor, /75-face-coverage) stays
 * reachable only via the "More tools" grid further down the page.
 *
 * activeTab is passed explicitly by the caller rather than read from
 * usePathname() — on a Hindi page the real URL (/hi/tools/resizer/*)
 * doesn't match the app's basePath, so usePathname() can't be trusted
 * there (see LocaleSwitcher.tsx), and each of the two call sites already
 * knows which tab it is anyway.
 */
export default function ToolModeTabs({
  locale = "en",
  activeTab,
}: {
  locale?: Locale;
  activeTab: "resizer" | "addNameDate";
}) {
  const t = getDict(locale).modeTabs;
  const tabs = [
    { key: "resizer" as const, href: "/", label: t.imageResizer },
    { key: "addNameDate" as const, href: "/add-name-date", label: t.addNameDate },
  ];

  return (
    <div className="flex justify-center mb-8">
      <div className="inline-flex gap-1 rounded-full border border-[var(--color-border-gray-subtle)] bg-white p-1 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        {tabs.map((tab) => {
          const active = tab.key === activeTab;
          return (
            <LocaleLink
              key={tab.key}
              locale={locale}
              href={tab.href}
              className={`rounded-full px-5 py-2 body-small !font-semibold transition-colors ${
                active ? "bg-brand text-white" : "text-text-gray-muted hover:text-text-gray-normal"
              }`}
            >
              {tab.label}
            </LocaleLink>
          );
        })}
      </div>
    </div>
  );
}
