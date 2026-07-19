"use client";

import React, { memo, useRef } from "react";
import Section from "../global/Section";
import HeaderBlock from "../shared/text-render/HeaderBlock";
import clsx from "clsx";
import { motion } from "framer-motion";
import FAQAccordion, { AccordionItem } from "../shared/FAQAccordion";
import { Exam } from "@/types/page";
import { useScrollOnUserAction } from "@/hooks/useScrollOnUserAction";
import { Locale, defaultLocale } from "@/lib/i18n/config";

type FAQKey = "refund" | "general" | "courses" | "payments";

type FAQ = { q: string; a: React.ReactNode };

type FAQsContent = {
  eyebrow: string;
  heading: React.ReactNode;
  description: string;
  filters: { label: string; key: FAQKey }[];
  faqs: Record<FAQKey, FAQ[]>;
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
    filters: [
      { label: "Refund guarantee", key: "refund" },
      { label: "General", key: "general" },
      { label: "Courses & tests", key: "courses" },
      { label: "Payments", key: "payments" },
    ],
    faqs: {
      refund: [
        {
          q: "How does the refund guarantee work?",
          a: <>We trust our platform, so we offer a <strong>refund guarantee</strong> if you don't pass the exam! To get a refund:<br/>1. <strong>Complete the course</strong> (all videos and mini tests)<br/>2. <strong>Take all the tests</strong> (mini, sectional and full-length)<br/>3. <strong>Show your official result</strong> (if you don't pass)<br/>If you put in the full effort and still don't pass, we'll refund your entire fee!</>,
        },
        {
          q: "Why is completing the course necessary for a refund?",
          a: <>Dedication is essential for success! We want students to <strong>honestly follow the entire preparation process</strong>. If you complete the course, your chances of passing are very high. And if you still don't pass, we keep our promise — your money is refunded.</>,
        },
        {
          q: "What if I don't complete the course and still fail?",
          a: <>The refund only applies to students <strong>who complete the course.</strong> If you don't complete it, you won't be eligible for a refund.</>,
        },
        {
          q: "Are there any hidden charges for the refund guarantee?",
          a: <><strong>No hidden charges</strong>! If you meet all the conditions, we refund your amount.</>,
        },
        {
          q: "How will I get my refund if I don't pass?",
          a: <>Once you submit your official <strong>admit card PDF</strong> and <strong>exam result</strong>, the refund is sent to your original payment method <strong>within 24 hours</strong>.</>,
        },
      ],
      general: [
        {
          q: "What is Clear Cutoff and how will it help me pass Teaching Exams?",
          a: <>Clear Cutoff is a <strong>smart exam preparation platform</strong> built specifically for Teaching Exams. We provide:<br/>1. <strong>Previous Year Questions (PYQs)</strong> with solutions.<br/>2. <strong>Detailed video lectures</strong> from multiple teachers.<br/>3. <strong>Revision notes</strong> for quick revision.<br/>4. <strong>Sectional and full-length tests</strong> to track progress.<br/>5. A <strong>refund guarantee</strong> if you still don't pass after completing the course!</>,
        },
        {
          q: "Why choose Clear Cutoff when other platforms exist?",
          a: <>We focus purely on exam-oriented learning:<br/>1. A <strong>structured plan</strong> with revision cycles<br/>2. A choice of <strong>multiple teachers</strong><br/>3. <strong>Mini tests and full-length tests</strong> (including all PYQs)<br/>4. A realistic <strong>exam experience</strong> with our test series<br/>5. A <strong>refund guarantee</strong> if you followed the course and still didn't pass!</>,
        },
        {
          q: "Who can Clear Cutoff's courses help?",
          a: <>Clear Cutoff is perfect for:<br/>1. <strong>First-time teaching-exam candidates</strong>.<br/>2. <strong>Repeat candidates</strong> who want complete preparation.<br/>3. Students who prefer a structured, <strong>exam-focused approach</strong>.</>,
        },
        {
          q: "Is the content available in both Hindi and English?",
          a: <>Yes! All our PYQs, solutions and tests are available in <strong>both Hindi and English</strong>.</>,
        },
        {
          q: "Can I access the content anytime?",
          a: <>Yes! From the date of purchase right up to <strong>exam day</strong>, you get <strong>full access</strong> to all course materials.</>,
        },
      ],
      courses: [
        {
          q: "What's included in the course?",
          a: <>The course includes:<br/>1. <strong>PYQs</strong> with detailed solutions<br/>2. <strong>Video lectures</strong> (multiple teachers)<br/>3. Typed <strong>notes</strong> and <strong>flash cards</strong> for quick revision<br/>4. <strong>Sectional tests</strong> and <strong>mini tests</strong><br/>5. A full-length test series matching the exam pattern</>,
        },
        {
          q: "How are the tests designed?",
          a: <>Tests come at three levels:<br/>1. <strong>Mini tests</strong>: for chapter- and topic-level practice<br/>2. <strong>Sectional tests</strong>: for strong section-wise preparation<br/>3. <strong>Full-length tests</strong>: a real exam-like experience</>,
        },
        {
          q: "Can repeat candidates benefit from Clear Cutoff?",
          a: <>Yes! Clear Cutoff suits <strong>both first-time and repeat candidates</strong>.</>,
        },
        {
          q: "How are Clear Cutoff's tests better than others?",
          a: <>Our tests <strong>include all PYQs and are built to match the real exam pattern</strong>. The test series gives detailed solutions and feedback so you keep improving.</>,
        },
        {
          q: "Can I prepare for just one subject or topic?",
          a: <>You can study <strong>all sections of the paper</strong>, or take mini tests and sectional tests for focused practice.</>,
        },
      ],
      payments: [
        {
          q: "What does the course cost?",
          a: <>The course costs <strong>₹99</strong> after discount.</>,
        },
        {
          q: "Are there any charges beyond the course fee?",
          a: <>No, everything is included in the course fee. There are <strong>no hidden charges</strong>.</>,
        },
        {
          q: "How can I pay?",
          a: <>You can pay online via UPI, debit/credit card, net banking or wallet through a safe and <strong>secure payment gateway</strong>.</>,
        },
        {
          q: "Is a trial period available?",
          a: <>Yes, you can access a <strong>free trial</strong> of the course before buying.</>,
        },
        {
          q: "What if the exam gets postponed?",
          a: <>Your course access stays <strong>valid until exam day</strong>, even if the exam date is pushed back.</>,
        },
      ],
    },
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
    filters: [
      { label: "रिफंड गारंटी", key: "refund" },
      { label: "सामान्य प्रश्न", key: "general" },
      { label: "कोर्स और टेस्ट", key: "courses" },
      { label: "भुगतान", key: "payments" },
    ],
    faqs: {
      refund: [
        {
          q: "रिफंड गारंटी कैसे काम करती है?",
          a: <>हमें अपने प्लेटफॉर्म पर भरोसा है, इसलिए हम <strong>रिफंड गारंटी</strong> देते हैं अगर आप परीक्षा पास नहीं करते! रिफंड पाने के लिए: <br/>1. <strong>कोर्स पूरा करें</strong> (सभी वीडियो और मिनी टेस्ट)<br/>2. <strong>सभी टेस्ट दें</strong> (मिनी, सेक्शनल और फुल-लेंथ)<br/>3. <strong>अपना आधिकारिक रिजल्ट दिखाएँ</strong> (यदि पास नहीं होते)<br/>यदि आपने पूरी मेहनत की और फिर भी पास नहीं हुए, तो हम आपकी पूरी फीस वापस कर देंगे!</>,
        },
        {
          q: "रिफंड के लिए कोर्स पूरा करना क्यों ज़रूरी है?",
          a: <>सफलता के लिए समर्पण ज़रूरी है! हम चाहते हैं कि छात्र <strong>ईमानदारी से पूरी तैयारी प्रक्रिया को फॉलो करें</strong>। अगर आप कोर्स पूरा करते हैं, तो पास होने की संभावना बहुत अधिक होती है। फिर भी यदि आप पास नहीं होते, तो हम अपना वादा निभाते हैं — आपका पैसा वापस कर दिया जाएगा।</>,
        },
        {
          q: "अगर मैं कोर्स पूरा नहीं करता और फिर भी फेल हो जाता हूँ तो क्या होगा?",
          a: <>रिफंड केवल उन छात्रों पर लागू होता है <strong>जो कोर्स पूरा करते हैं।</strong> यदि आप इसे पूरा नहीं करते, तो आप रिफंड के पात्र नहीं होंगे।</>,
        },
        {
          q: "क्या रिफंड गारंटी के लिए कोई छिपा हुआ शुल्क है?",
          a: <><strong>कोई छिपा हुआ शुल्क नहीं</strong>! यदि आप सभी शर्तें पूरी करते हैं, तो हम आपकी राशि वापस कर देते हैं।</>,
        },
        {
          q: "अगर मैं पास नहीं हुआ तो मुझे रिफंड कैसे मिलेगा?",
          a: <>जब आप अपना आधिकारिक <strong>एडमिट कार्ड PDF</strong> और <strong>परीक्षा परिणाम</strong> जमा करेंगे, तो रिफंड आपकी मूल भुगतान विधि में <strong>24 घंटे के अंदर</strong> भेज दिया जाएगा।</>,
        },
      ],
      general: [
        {
          q: "Clear Cutoff क्या है और यह मुझे Teaching Exams पास करने में कैसे मदद करेगा?",
          a: <>Clear Cutoff एक <strong>स्मार्ट परीक्षा तैयारी प्लेटफॉर्म</strong> है, जो खास तौर पर Teaching Exams के लिए बनाया गया है। हम प्रदान करते हैं:<br/>1. <strong>पिछले वर्षों के प्रश्न (PYQs)</strong> हल सहित।<br/>2. अलग-अलग शिक्षकों के <strong>विस्तृत वीडियो लेक्चर</strong>।<br/>3. जल्दी दोहराने के लिए <strong>रिविजन नोट्स</strong>।<br/>4. प्रगति जांचने के लिए <strong>सेक्शनल और फुल-लेंथ टेस्ट</strong>।<br/>5. यदि आप पूरा कोर्स करने के बाद भी पास नहीं होते तो <strong>रिफंड गारंटी</strong>!</>,
        },
        {
          q: "Clear Cutoff को क्यों चुनें जब और भी प्लेटफार्म्स मौजूद हैं?",
          a: <>हम केवल परीक्षा-केंद्रित पढ़ाई पर ध्यान देते हैं:<br/>1. रिविजन साइकिल के साथ एक <strong>स्ट्रक्चर्ड प्लान</strong><br/>2. <strong>कई टीचर्स</strong> का विकल्प<br/>3. <strong>मिनी टेस्ट और फुल-लेंथ टेस्ट</strong> (सभी PYQs सहित)<br/>4. हमारी टेस्ट सीरीज़ के साथ असली <strong>एग्जाम अनुभव</strong><br/>5. यदि आपने कोर्स फॉलो किया और फिर भी पास नहीं हुए तो <strong>रिफंड गारंटी</strong>!</>,
        },
        {
          q: "Clear Cutoff के कोर्स किसे मदद कर सकते हैं?",
          a: <>Clear Cutoff इन छात्रों के लिए परफेक्ट है:<br/>1. <strong>पहली बार टीचिंग एग्ज़ाम देने वाले उम्मीदवार</strong>।<br/>2. पूरी तैयारी चाहने वाले <strong>दोबारा परीक्षा देने वाले उम्मीदवार</strong>।<br/>3. वे छात्र जो स्ट्रक्चर्ड और <strong>परीक्षा-केंद्रित अप्रोच</strong> पसंद करते हैं।</>,
        },
        {
          q: "क्या कंटेंट हिंदी और अंग्रेज़ी दोनों में उपलब्ध है?",
          a: <>हाँ! हमारे सभी PYQs, सॉल्यूशन और टेस्ट <strong>हिंदी और अंग्रेज़ी</strong> दोनों में उपलब्ध हैं।</>,
        },
        {
          q: "क्या मैं कंटेंट कभी भी एक्सेस कर सकता हूँ?",
          a: <>हाँ! खरीद की तारीख से लेकर <strong>एग्ज़ाम के दिन तक</strong> आपको सभी कोर्स मटेरियल्स का <strong>पूरा एक्सेस</strong> मिलता है।</>,
        },
      ],
      courses: [
        {
          q: "कोर्स में क्या-क्या शामिल है?",
          a: <>कोर्स में शामिल है:<br/>1. <strong>PYQs</strong> विस्तृत हल सहित<br/>2. <strong>वीडियो लेक्चर</strong> (एक से अधिक शिक्षक)<br/>3. जल्दी रिविजन के लिए टाइप किए हुए <strong>नोट्स</strong> और <strong>फ्लैश कार्ड</strong><br/>4. <strong>सेक्शनल टेस्ट</strong> और <strong>मिनी टेस्ट</strong><br/>5. परीक्षा पैटर्न के अनुसार फुल-लेंथ टेस्ट सीरीज़</>,
        },
        {
          q: "टेस्ट कैसे डिजाइन किए गए हैं?",
          a: <>टेस्ट तीन स्तर पर:<br/>1. <strong>मिनी टेस्ट</strong>: अध्याय और टॉपिक स्तर की प्रैक्टिस के लिए<br/>2. <strong>सेक्शनल टेस्ट</strong>: सेक्शन की मजबूत तैयारी के लिए<br/>3. <strong>फुल-लेंथ टेस्ट</strong>: असली परीक्षा जैसा अनुभव</>,
        },
        {
          q: "क्या दोबारा परीक्षा देने वाले छात्र Clear Cutoff से लाभ उठा सकते हैं?",
          a: <>हाँ! Clear Cutoff <strong>पहली बार और दोबारा परीक्षा देने वाले दोनों छात्रों</strong> के लिए उपयुक्त है।</>,
        },
        {
          q: "Clear Cutoff के टेस्ट दूसरों से बेहतर कैसे हैं?",
          a: <>हमारे टेस्ट में सभी <strong>PYQs शामिल हैं और वे असली परीक्षा पैटर्न के अनुसार बनाए गए हैं</strong>। टेस्ट सीरीज़ विस्तृत समाधान और फीडबैक देती है ताकि आप लगातार सुधार कर सकें।</>,
        },
        {
          q: "क्या मैं केवल किसी एक विषय या टॉपिक की तैयारी कर सकता हूँ?",
          a: <>आप पेपर के <strong>सभी सेक्शन पढ़ सकते हैं</strong>, या फोकस्ड प्रैक्टिस के लिए मिनी टेस्ट और सेक्शनल टेस्ट दे सकते हैं।</>,
        },
      ],
      payments: [
        {
          q: "कोर्स की कीमत क्या है?",
          a: <>कोर्स की कीमत छूट के बाद <strong>₹99</strong> है।</>,
        },
        {
          q: "क्या कोर्स फीस के अलावा कोई अतिरिक्त शुल्क है?",
          a: <>नहीं, कोर्स फीस में सब कुछ शामिल है। <strong>कोई छिपा हुआ शुल्क नहीं</strong> है।</>,
        },
        {
          q: "मैं भुगतान कैसे कर सकता हूँ?",
          a: <>आप UPI, डेबिट/क्रेडिट कार्ड, नेट बैंकिंग या वॉलेट के माध्यम से सुरक्षित और <strong>सुरक्षित पेमेंट गेटवे</strong> से ऑनलाइन भुगतान कर सकते हैं।</>,
        },
        {
          q: "क्या कोई ट्रायल अवधि उपलब्ध है?",
          a: <>हाँ, खरीदने से पहले आप कोर्स का <strong>फ्री ट्रायल</strong> एक्सेस कर सकते हैं।</>,
        },
        {
          q: "अगर परीक्षा स्थगित हो जाती है तो क्या होगा?",
          a: <>आपका कोर्स एक्सेस <strong>परीक्षा के दिन तक मान्य रहेगा</strong>, भले ही परीक्षा की तारीख आगे बढ़ जाए।</>,
        },
      ],
    },
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
};

export default function FAQsSection({
  bgColor,
  active = true,
  data,
  locale = defaultLocale,
}: {
  data?: Exam;
  bgColor?: string;
  active?: boolean;
  locale?: Locale;
}) {
  const t = CONTENT[locale];
  const [activeTab, setActiveTab] = React.useState<FAQKey>("refund");
  const containerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const { markUserAction } = useScrollOnUserAction({
    activeId: activeTab,
    refs: tabRefs,
    containerRef: containerRef,
    enabled: true,
    getIndex: (id) => t.filters.findIndex((i) => i.key === id),
  });

  const items: AccordionItem[] = (t.faqs[activeTab] || []).map((faq, index) => ({
    id: `${activeTab}-${index}`,
    title: faq.q,
    content: faq.a,
  }));

  if (!active) return null;

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
      <p className="body-medium text-text-gray-subtle">{content.intro}</p>
      <ul className="space-y-2 body-medium list-disc pl-5 text-text-gray-subtle">
        {content.points.map((point, i) => <li key={i}>{point}</li>)}
        <div>{content.footer}</div>
      </ul>
    </div>
  );
});
