"use client";

import React, { useRef } from "react";
import { motion } from "framer-motion";
import Section from "@/components/global/Section";
import HeaderBlock from "@/components/shared/text-render/HeaderBlock";
import FAQAccordion, { AccordionItem } from "@/components/shared/FAQAccordion";
import { useScrollOnUserAction } from "@/hooks/useScrollOnUserAction";
import { Locale, defaultLocale } from "@/lib/i18n/config";
import { APP_DOWNLOAD_FAQ_CONTENT, type FAQKey } from "@/lib/data/appDownloadFaq";
import type { AppPlatform } from "./AppDownloadHero";

export default function AppDownloadFaqSection({
  platform,
  locale = defaultLocale,
}: {
  platform: AppPlatform;
  locale?: Locale;
}) {
  const t = APP_DOWNLOAD_FAQ_CONTENT[platform][locale];
  const [activeTab, setActiveTab] = React.useState<FAQKey>(t.filters[0]?.key ?? "gettingStarted");
  const containerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const { markUserAction } = useScrollOnUserAction({
    activeId: activeTab,
    refs: tabRefs,
    containerRef,
    enabled: true,
    getIndex: (id) => t.filters.findIndex((f) => f.key === id),
  });

  const items: AccordionItem[] = (t.faqs[activeTab] ?? []).map((faq, index) => ({
    id: `app-download-faq-${activeTab}-${index}`,
    title: faq.q,
    content: faq.a,
  }));

  return (
    <Section sectionId="app-download-faqs-section" maxWidth="max-w-[900px]" padding="py-ym-section md:py-yd-section px-3 scroll-mt-16 md:scroll-mt-12">
      <div className="flex flex-col gap-6">
        <HeaderBlock
          eyebrow={{ text: t.eyebrow }}
          heading={{ text: t.heading }}
          description={{ text: t.description }}
          eyebrowOptions={{ alignMobile: "center", alignDesktop: "center" }}
          headingOptions={{ alignMobile: "center", alignDesktop: "center", font: "display-medium !font-bold" }}
          descriptionOptions={{ alignMobile: "center", alignDesktop: "center" }}
          containerClassName="mx-auto text-center"
        />

        <div className="flex justify-center w-full px-3 md:px-2">
          <div ref={containerRef} className="inline-flex max-w-full bg-brand-dark py-1 px-1 overflow-x-auto rounded-full relative">
            {t.filters.map((filter, index) => {
              const isActive = activeTab === filter.key;
              return (
                <button
                  key={filter.key}
                  ref={(el) => { tabRefs.current[index] = el; }}
                  onClick={() => { markUserAction(); setActiveTab(filter.key); }}
                  className="relative px-4 py-1.5 flex justify-center items-center rounded-sm whitespace-nowrap z-10 cursor-pointer"
                >
                  {isActive && (
                    <motion.div layoutId="app-download-faq-active-pill" className="absolute inset-0 bg-white rounded-full shadow-sm" transition={{ type: "spring", stiffness: 500, damping: 35 }} />
                  )}
                  <span className={`relative body-medium ${isActive ? "text-text-gray-normal !font-semibold" : "text-white"}`}>
                    {filter.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <FAQAccordion items={items} defaultOpenId={items[0]?.id} />
      </div>
    </Section>
  );
}
