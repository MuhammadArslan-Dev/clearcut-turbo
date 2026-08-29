"use client";

import React from "react";
import PaperTabs from "@/components/ui/tabs/PaperTabs";
import SectionSwitchUI from "@/components/ui/tabs/SectionSwitchUI";
import useLanguageSwitch from "@/hooks/useLanguageSwitch";
import { mapPapersToItems, mapSectionsToItems } from "@/lib/mapPapersToItems";
import { usePathname } from "@/i18n/navigation";
import { useContentDataStore } from "../store/useContentDataStore";

/**
 * Paper (subject) + section tabs, shared by notes-page and paper-page —
 * mounted inside Topbar's always-visible row instead of each page's own
 * scrolling content, mirroring how preparation's Topbar embeds
 * PaperSwitch/SectionsTab directly rather than as a separately-sticky
 * element. Two independently `position: sticky` elements stacked on top of
 * each other don't stay in sync while the one above is ALSO animating its
 * own height on scroll (the JS-driven height change lags a frame behind the
 * browser's own sticky recalculation) — that mismatch is what caused the
 * shake/overlap. Living inside the same single sticky header box as one
 * continuous unit removes the seam entirely.
 */
export default function ContentTabsBar() {
  const pathname = usePathname();
  const isNotesRoute = pathname.includes("/notes");

  const {
    papers,
    sectionsMap,
    selectedPaperId,
    selectedSections,
    selectPaper,
    toggleSection,
  } = useContentDataStore();

  const { locale } = useLanguageSwitch();

  const items = React.useMemo(() => mapPapersToItems(papers, locale), [papers, locale]);

  const sections = selectedPaperId != null ? (sectionsMap[selectedPaperId] ?? []) : [];
  const sectionItems = mapSectionsToItems(sections, locale);

  if (items.length <= 1 && (!isNotesRoute || sectionItems.length <= 1)) return null;

  return (
    <div className="bg-white sm:bg-transparent -mt-1 py-1">
      {items.length > 1 && (
        <div className="px-4">
          <PaperTabs
            tabs={items}
            selectedId={selectedPaperId?.toString() ?? null}
            onChange={(id) => selectPaper(Number(id))}
            containerBg="bg-transparent"
          />
        </div>
      )}

      {isNotesRoute && sectionItems.length > 1 && (
        <div className="w-full flex justify-center">
          <SectionSwitchUI
            layoutId="section-tab-preparation"
            items={sectionItems}
            active={selectedSections?.toString() ?? null}
            changeSection={(id: string) => toggleSection(Number(id))}
          />
        </div>
      )}
    </div>
  );
}
