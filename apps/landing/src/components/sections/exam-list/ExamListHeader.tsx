"use client";
import React from "react";
import HeaderBlock from "@/components/shared/text-render/HeaderBlock";
import { Locale } from "@/lib/i18n/config";
import { useLocale } from "next-intl";

const COPY: Record<Locale, { eyebrow: string; heading: React.ReactNode; description: string }> = {
  en: {
    eyebrow: "Prepare for every teaching exam",
    heading: (
      <>
        All <span className="text-brand">teaching exams</span> in one place!
      </>
    ),
    description: "Explore complete courses and test series for every teaching exam, and start for free.",
  },
  hi: {
    eyebrow: "सभी टीचिंग एग्ज़ाम की तैयारी करें",
    heading: (
      <>
        सभी <span className="text-brand">टीचिंग एग्ज़ाम</span> एक ही जगह पर!
      </>
    ),
    description: "सभी टीचिंग एग्ज़ाम के कम्प्लीट कोर्स और टेस्ट सीरीज़ देखें और फ्री में शुरुआत करें।",
  },
  mr: {
    eyebrow: "प्रत्येक टीचिंग परीक्षेची तयारी करा",
    heading: (
      <>
        सर्व <span className="text-brand">टीचिंग परीक्षा</span> एकाच ठिकाणी!
      </>
    ),
    description: "प्रत्येक टीचिंग परीक्षेचे संपूर्ण कोर्स आणि टेस्ट सिरीज पहा आणि मोफत सुरुवात करा.",
  },
};

export default function ExamListHeader() {
  const t = COPY[useLocale()];
  return (
    <HeaderBlock
      eyebrow={{ text: t.eyebrow }}
      heading={{ text: t.heading }}
      description={{ text: t.description }}
      eyebrowOptions={{ alignMobile: "center", alignDesktop: "center" }}
      headingOptions={{ alignMobile: "center", alignDesktop: "center", font: "display-small md:display-medium !font-semibold" }}
      descriptionOptions={{ alignMobile: "center", alignDesktop: "center" }}
      containerClassName="mx-auto"
    />
  );
}
