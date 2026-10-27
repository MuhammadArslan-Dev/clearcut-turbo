"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import {
  BookOpenIcon,
  ChevronRightIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import CustomizableHeader from "@/components/customizable-header";
import ExamSelectionContainer from "@/components/ui/exam/exam-selection-container";
import { formatToSlug, unFormatSlug } from "@/utils/slugify";

type NavItem = {
  id: number | string;
  ent_id: string;
  exam_id: string;
  parent_id: string;
  name: string;
  entity: string;
  group?: string;
  /** JSON string: {"en":{"name","group","detail"},"hi":{…}} */
  translation?: string;
};

type LocalisedNavItem = {
  /** Display name for the current locale, e.g. "Paper 1". */
  name: string;
  /** Secondary line, e.g. "Classes 1-5". Papers have it; subjects do not. */
  detail?: string;
  /** What this level IS, e.g. "Paper" / "Language subject". */
  group?: string;
};

/**
 * Every navigation row carries its translations as a JSON *string* in
 * `translation`. Read the requested locale out of it and fall back to the raw
 * English columns — several rows ship an empty string for a locale, which must
 * not render as a blank card.
 */
function localise(item: NavItem, locale: string): LocalisedNavItem {
  let translated: Partial<LocalisedNavItem> = {};
  try {
    const parsed = item.translation ? JSON.parse(item.translation) : null;
    if (parsed?.[locale]) translated = parsed[locale];
  } catch {
    /* fall through to the raw columns */
  }

  const pick = (value: unknown, fallback?: string) =>
    typeof value === "string" && value.trim() ? value : fallback;

  return {
    name: pick(translated.name, item.name) ?? item.name,
    detail: pick(translated.detail),
    group: pick(translated.group, item.group),
  };
}

/** One selectable level: icon tile, name, optional detail line, chevron. */
function LevelCard({
  title,
  detail,
  onClick,
}: {
  title: string;
  detail?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 text-left transition-colors hover:border-blue-300 hover:bg-blue-50/40"
    >
      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
        <BookOpenIcon className="h-7 w-7" aria-hidden="true" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="heading-small !font-semibold block truncate text-gray-900">
          {title}
        </span>
        {detail && (
          <span className="body-medium !font-normal mt-0.5 block truncate text-gray-600">
            {detail}
          </span>
        )}
      </span>

      <ChevronRightIcon
        className="h-5 w-5 shrink-0 text-gray-400 transition-colors group-hover:text-blue-600"
        aria-hidden="true"
      />
    </button>
  );
}

export default function ExamLevelsSection({
  data,
  examName,
}: {
  data?: NavItem[];
  examName?: string;
}) {
  const [trail, setTrail] = React.useState<NavItem[]>([]);
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("examPage");
  const [loading, setLoading] = React.useState<boolean>(false);

  const items = data ?? [];
  const roots = items.filter((i) => !i.parent_id);
  const last = trail.length ? trail[trail.length - 1] : null;
  const visible = last ? items.filter((i) => i.parent_id === last.entity) : roots;
  const isRootStep = trail.length === 0;

  const handleSelect = (item: NavItem) => {
    setTrail((currentTrail) => [...currentTrail, item]);
  };

  useEffect(() => {
    if (visible.length === 0) {
      setLoading(true);

      if (!trail || trail.length === 0) return;

      // Get first and remaining elements
      const [firstElement, ...restTrail] = trail;

      // Build query params with levels[] format
      const queryParams = restTrail
        .map((item) => `levels=${formatToSlug(item.name)}`)
        .join("&");

      // Create slug and new URL
      const slug = formatToSlug(firstElement?.name ?? "");
      const newUrl = `${pathname}/${slug}${queryParams ? `?${queryParams}` : ""}`;

      router.push(newUrl);
    } else {
      setLoading(false);
    }
  }, [trail, pathname, router, visible.length]);

  const handleBack = (index: number) => setTrail((currentTrail) => currentTrail.slice(index, -1));
  const decodedExamName = unFormatSlug(examName ?? "").toUpperCase();

  // "Choose your paper" / "Choose your language subject" — the level's own
  // `group` names what is being picked, so a new level type needs no change.
  const groupLabel = localise(visible[0] ?? ({} as NavItem), locale).group;

  return (
    <div className="space-y-8">
      <div className="px-3">
        <CustomizableHeader
          showEyebrow={false}
          heading={t("title", { exam: decodedExamName })}
          highlightText={decodedExamName}
          subheading={t("subtitle")}
          headingColor="text-gray-900"
          highlightColor="text-blue-500"
          subheadingColor="text-gray-600"
          alignment="md:text-center text-left"
          headingClasses="!mb-1"
          headingSize="heading-2xlarge !font-semibold"
        />
      </div>

      <div className="px-3">
        <h2 className="heading-xlarge !font-semibold">
          {groupLabel ? t("chooseLevel", { group: groupLabel.toLowerCase() }) : t("choosePaper")}
        </h2>
        {isRootStep && visible.length > 0 && (
          <p className="body-medium !font-normal mt-1 text-gray-600">
            {t("paperHint", { exam: decodedExamName, count: visible.length })}
          </p>
        )}

        {trail.length > 0 && (
          <div className="mt-4">
            {trail.map((item, index) => (
              <ExamSelectionContainer
                key={item.id}
                title={item.name}
                handleBack={() => handleBack(index - 1)}
              />
            ))}
          </div>
        )}

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          {visible.map((item) => {
            const display = localise(item, locale);
            return (
              <LevelCard
                key={item.id}
                title={display.name}
                detail={display.detail}
                onClick={() => handleSelect(item)}
              />
            );
          })}

          {loading && (
            <div
              className="col-span-1 flex items-center justify-center py-6 md:col-span-2"
              role="status"
              aria-live="polite"
            >
              <div className="flex items-center gap-3 text-gray-600">
                <span className="relative flex h-9 w-9">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
                  <span className="relative inline-flex h-9 w-9 rounded-full bg-blue-500" />
                </span>
                <span className="font-medium">{t("loadingLevels")}</span>
              </div>
            </div>
          )}
        </div>

        {isRootStep && visible.length > 0 && (
          <div className="mt-4 flex items-start gap-3 rounded-xl bg-blue-50 px-4 py-3.5">
            <InformationCircleIcon
              className="mt-0.5 h-5 w-5 shrink-0 text-gray-500"
              aria-hidden="true"
            />
            <p className="body-medium !font-normal text-gray-700">{t("switchPapersInfo")}</p>
          </div>
        )}

        {/* The cards above are buttons because picking a level is a multi-step
            client flow whose final URL isn't known until the last step. These
            are the crawlable <a href> equivalents for the first level, so the
            paper pages are still reachable from this page by a search engine. */}
        <div className="hidden">
          {roots.map((item: { name?: string }, index) => (
            <div key={item.name || index}>
              <Link href={`${pathname}/${formatToSlug(item?.name ?? "")}` || "#"}>
                {item?.name}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
