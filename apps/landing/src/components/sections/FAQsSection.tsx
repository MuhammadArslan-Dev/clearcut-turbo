"use client";

import React, { memo, useRef } from "react";
import Section from "../global/Section";
import HeaderBlock from "../shared/text-render/HeaderBlock";
import clsx from "clsx";
import { motion } from "framer-motion";
import FAQAccordion, { AccordionItem } from "../shared/FAQAccordion";
import RichFaqText from "../shared/RichFaqText";
import { Exam } from "@/types/page";
import { useScrollOnUserAction } from "@/hooks/useScrollOnUserAction";
import { Locale, defaultLocale } from "@/lib/i18n/config";
import type { FaqCategory } from "@/types/cms";

// This section is a teaser embedded on the home/course pages, not the
// exhaustive FAQ resource (that's /faq, which shows every CMS category).
// Capped so the section stays a short skim, not a full duplicate of /faq.
const MAX_TEASER_CATEGORIES = 5;

// Section chrome only. The questions, answers and tab labels come from the CMS
// `faq` global (getFaq(), en/hi/mr) — phase 128 removed the hardcoded copy.
type FAQsContent = {
  eyebrow: string;
  heading: React.ReactNode;
  description: string;
  explanation: {
    title: string;
    intro: string;
    points: React.ReactNode[];
    footer: React.ReactNode;
  };
};

const CONTENT: Record<Locale, FAQsContent> = {
  en: {
    eyebrow: "Got a question? We've got the answer!",
    heading: (
      <>
        Frequently asked <span className="text-brand">questions</span>
      </>
    ),
    description:
      "Everything worth knowing before you start preparing with Clear Cutoff.",
    explanation: {
      title: "Can you actually pass the exam with Clear Cutoff?",
      intro: "Yes — if you practise, revise and prepare for the exam the smart way.",
      points: [
        <>Practise high-quality <span className="text-text-gray-subtle font-semibold">Previous Year Questions (PYQs)</span> and exam-level questions</>,
        <>Strengthen your concepts through <span className="text-text-gray-subtle font-semibold">tests and analysis</span></>,
        <>Identify <span className="text-text-gray-subtle font-semibold">your weak areas</span> with chapter-wise, sectional and full-length tests</>,
      ],
      footer: <>👉 You can start for free and decide for yourself (no payment required).</>,
    },
  },
  hi: {
    eyebrow: "कोई सवाल है? हमारे पास जवाब है!",
    heading: (
      <>
        अक्सर पूछे जाने वाले <span className="text-brand">प्रश्न</span>
      </>
    ),
    description: "Clear Cutoff के साथ तैयारी शुरू करने से पहले जानने योग्य सभी जरूरी बातें।",
    explanation: {
      title: "क्या Clear Cutoff से परीक्षा पास की जा सकती है?",
      intro: "हाँ, अगर आप समझदारी से अभ्यास, दोहराव और परीक्षा की सही तैयारी करें।",
      points: [
        <>उच्च गुणवत्ता वाले <span className="text-text-gray-subtle font-semibold">पिछले वर्ष के प्रश्न (PYQs)</span> और परीक्षा स्तर के प्रश्नों का अभ्यास करें</>,
        <><span className="text-text-gray-subtle font-semibold">टेस्ट और विश्लेषण</span> के माध्यम से अपने कॉन्सेप्ट मजबूत करें</>,
        <>अध्यायवार, सेक्शनल और फुल-लेंथ टेस्ट के जरिए <span className="text-text-gray-subtle font-semibold">अपनी कमजोरियाँ पहचानें</span></>,
      ],
      footer: <>👉 आप फ्री में शुरुआत कर सकते हैं और खुद तय कर सकते हैं (कोई भुगतान आवश्यक नहीं)।</>,
    },
  },
  mr: {
    eyebrow: "काही प्रश्न आहे? आमच्याकडे उत्तर आहे!",
    heading: (
      <>
        वारंवार विचारले जाणारे <span className="text-brand">प्रश्न</span>
      </>
    ),
    description: "Clear Cutoff सोबत तयारी सुरू करण्यापूर्वी जाणून घेण्यासारख्या सर्व महत्त्वाच्या गोष्टी.",
    explanation: {
      title: "Clear Cutoff ने खरंच परीक्षा उत्तीर्ण करता येते का?",
      intro: "हो — जर तुम्ही सराव, उजळणी आणि परीक्षेची हुशारीने तयारी केली तर.",
      points: [
        <>उच्च दर्जाचे <span className="text-text-gray-subtle font-semibold">मागील वर्षांचे प्रश्न (PYQs)</span> आणि परीक्षा-स्तरावरील प्रश्नांचा सराव करा</>,
        <><span className="text-text-gray-subtle font-semibold">टेस्ट आणि विश्लेषणा</span>द्वारे तुमच्या संकल्पना मजबूत करा</>,
        <>प्रकरणनिहाय, सेक्शनल आणि फुल-लेंथ टेस्टद्वारे <span className="text-text-gray-subtle font-semibold">तुमच्या कमकुवत जागा ओळखा</span></>,
      ],
      footer: <>👉 तुम्ही मोफत सुरुवात करू शकता आणि स्वतः ठरवू शकता (कोणतेही पेमेंट आवश्यक नाही).</>,
    },
  },
};

export default function FAQsSection({
  bgColor,
  active = true,
  data,
  locale = defaultLocale,
  categories,
}: {
  data?: Exam;
  bgColor?: string;
  active?: boolean;
  locale?: Locale;
  /** CMS categories (from getFaq()) — the only source of the tabs and questions,
   *  capped to MAX_TEASER_CATEGORIES. Empty/missing (no CMS content, or a 404 from
   *  the CMS) hides the whole section rather than showing a header with no
   *  questions. An unreachable CMS makes getFaq() throw, so ISR keeps serving the
   *  last good page instead of rendering this empty. */
  categories?: FaqCategory[];
}) {
  const t = CONTENT[locale];
  const cmsCategories = (categories ?? [])
    .filter((c) => c.questions.length > 0)
    .slice(0, MAX_TEASER_CATEGORIES);

  const tabs: { key: string; label: string }[] = cmsCategories.map((c) => ({ key: c.key, label: c.label }));

  const [activeTab, setActiveTab] = React.useState<string>(tabs[0]?.key ?? "");
  const containerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const { markUserAction } = useScrollOnUserAction({
    activeId: activeTab,
    refs: tabRefs,
    containerRef: containerRef,
    enabled: true,
    getIndex: (id) => tabs.findIndex((i) => i.key === id),
  });

  const items: AccordionItem[] = (cmsCategories.find((c) => c.key === activeTab)?.questions ?? []).map(
    (faq, index) => ({
      id: `${activeTab}-${index}`,
      title: <RichFaqText html={faq.questionHtml} text={faq.question} inline />,
      content: <RichFaqText html={faq.answerHtml} text={faq.answer} />,
    }),
  );

  if (!active || tabs.length === 0) return null;

  return (
    <div className={clsx(bgColor)} style={{ background: bgColor }}>
      <Section padding="py-ym-section md:py-yd-section px-3 scroll-mt-16 md:scroll-mt-12" sectionId="faqs-section">
        <div className="flex flex-col gap-6">
          <HeaderBlock
            eyebrow={{ text: t.eyebrow }}
            heading={{ text: t.heading }}
            description={{ text: t.description }}
            eyebrowOptions={{ alignMobile: "center", alignDesktop: "center" }}
            headingOptions={{ alignMobile: "center", alignDesktop: "center", font: "display-medium !font-semibold" }}
            descriptionOptions={{ alignMobile: "center", alignDesktop: "center" }}
            containerClassName="max-w-3xl mx-auto"
          />

          <ExplanationCard content={t.explanation} />

          <div className="max-w-3xl md:mx-auto md:px-2">
            <div ref={containerRef} className="flex bg-brand-dark py-1 overflow-x-auto -mx-3 px-1 md:rounded-full relative">
              {tabs.map((filter, index) => {
                const isActive = activeTab === filter.key;
                return (
                  <button
                    key={filter.key}
                    ref={(el) => { tabRefs.current[index] = el; }}
                    onClick={() => { markUserAction(); setActiveTab(filter.key); }}
                    className="relative px-4 py-1.5 flex justify-center items-center rounded-sm whitespace-nowrap z-10 cursor-pointer"
                  >
                    {isActive && (
                      <motion.div layoutId="active-pill" className="absolute inset-0 bg-white rounded-full shadow-sm" transition={{ type: "spring", stiffness: 500, damping: 35 }} />
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
    </div>
  );
}

const ExplanationCard = memo(function ExplanationCard({
  content,
}: {
  content: FAQsContent["explanation"];
}) {
  return (
    <div className="max-w-lg mx-auto bg-white rounded-xl border-2 border-brand p-6 space-y-4">
      <h3 className="!font-semibold heading-small">{content.title}</h3>
      {/* `font-normal` is explicit, not new styling: the shared typography classes
          now carry a default weight (medium for body-*) from
          @clearcut/design-tokens, which landing previously did not have. These two
          elements measured 400 before, so the weight is pinned to keep them
          identical. */}
      <p className="body-medium font-normal text-text-gray-subtle">{content.intro}</p>
      <ul className="space-y-2 body-medium font-normal list-disc pl-5 text-text-gray-subtle">
        {content.points.map((point, i) => <li key={i}>{point}</li>)}
        <div>{content.footer}</div>
      </ul>
    </div>
  );
});
