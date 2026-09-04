import React from "react";
import Section from "../../global/Section";
import HeaderBlock from "../../shared/text-render/HeaderBlock";
import clsx from "clsx";
import Image from "next/image";
import { Exam } from "@/types/page";
import HowItWorkStep from "./HowItWorkStep";
import { IMAGES } from "@/constants/images";
import { Locale, defaultLocale } from "@/lib/i18n/config";

type StepItem = {
  id: string;
  number: number;
  title: React.ReactNode;
  subtitle: React.ReactNode;
  desc: React.ReactNode;
  btn: React.ReactNode;
  cardTitle?: React.ReactNode;
  image?: React.ReactNode;
};

// Locale-independent step images, keyed by step id.
// Source files are ~359x285-287 (a landscape ~1.26:1 ratio), not the square
// 370x370 previously declared here — with `sizes` set, Tailwind's preflight
// (img { height: auto }) computes height from the real file once it loads
// rather than the declared attributes, so the wrong declared ratio meant
// this row reflowed after load. Heights below match each file's real ratio.
const STEP_IMAGES: Record<string, React.ReactNode> = {
  "step-1": (
    <Image src={IMAGES.howItWork.step1} alt="how it work step 1 image" width={370} height={294} className="aspect-[370/294]" sizes="(max-width: 768px) 90vw, 370px" />
  ),
  "step-2": (
    <Image src={IMAGES.howItWork.step2} alt="how it work step 2 image" width={370} height={296} className="aspect-[370/296]" sizes="(max-width: 768px) 90vw, 370px" />
  ),
  "step-3": (
    <Image src={IMAGES.howItWork.step3} alt="how it work step 3 image" width={370} height={294} className="aspect-[370/294]" sizes="(max-width: 768px) 90vw, 370px" />
  ),
};

type HowItWorksContent = {
  eyebrow: string;
  heading: React.ReactNode;
  description: string;
  steps: Omit<StepItem, "image">[];
};

const CONTENT: Record<Locale, HowItWorksContent> = {
  en: {
    eyebrow: "How it works",
    heading: (
      <>
        3 easy steps to crack the Teaching <span className="text-brand">Exam</span>
      </>
    ),
    description: "Follow these 3 simple steps to succeed in your exam",
    steps: [
      {
        id: "step-1",
        number: 1,
        title: "Start free on Clear Cutoff",
        subtitle: "Create your free account and get started!",
        desc: "Register with your mobile number in seconds and get instant access to all study material and tests.",
        btn: "Get started",
      },
      {
        id: "step-2",
        number: 2,
        title: "Learn with videos, notes and mini tests",
        subtitle: "Prepare with videos, notes and mini tests!",
        desc: "Strengthen every subject topic-by-topic with video lectures, revision notes and mini tests.",
        btn: "Start learning",
      },
      {
        id: "step-3",
        number: 3,
        title: "PYQ-based test series",
        subtitle: "Practise with sectional and full-length tests!",
        desc: "Build your confidence by solving PYQ-based sectional and full-length papers in Hindi and English.",
        btn: "Take a test",
      },
    ],
  },
  hi: {
    eyebrow: "यह कैसे काम करता है",
    heading: (
      <>
        Teaching <span className="text-brand">Exam</span> पास करने के 3 आसान स्टेप्स
      </>
    ),
    description: "परीक्षा में सफल होने के लिए इन 3 आसान चरणों का पालन करें",
    steps: [
      {
        id: "step-1",
        number: 1,
        title: "Clear Cutoff पर फ्री शुरुआत करें",
        subtitle: "अपना फ्री अकाउंट बनाएं और शुरू करें!",
        desc: "कुछ ही सेकंड में अपने मोबाइल नंबर से रजिस्टर करें और सभी स्टडी मटेरियल व टेस्ट का तुरंत एक्सेस पाएं।",
        btn: "शुरू करें",
      },
      {
        id: "step-2",
        number: 2,
        title: "वीडियो, नोट्स और मिनी टेस्ट से सीखें",
        subtitle: "वीडियो, नोट्स और मिनी टेस्ट के साथ तैयारी करें!",
        desc: "हर विषय को टॉपिक के अनुसार वीडियो लेक्चर, रिवीजन नोट्स और मिनी टेस्ट से मजबूत बनाएं।",
        btn: "सीखना शुरू करें",
      },
      {
        id: "step-3",
        number: 3,
        title: "PYQ आधारित टेस्ट सीरीज",
        subtitle: "सेक्शनल और फुल लेंथ टेस्ट से अभ्यास करें!",
        desc: "हिंदी और अंग्रेजी में PYQ आधारित सेक्शनल और फुल लेंथ पेपर हल करके अपना आत्मविश्वास बढ़ाएं।",
        btn: "टेस्ट दें",
      },
    ],
  },
  mr: {
    eyebrow: "हे कसे कार्य करते",
    heading: (
      <>
        Teaching <span className="text-brand">Exam</span> उत्तीर्ण करण्यासाठी 3 सोप्या पायऱ्या
      </>
    ),
    description: "परीक्षेत यशस्वी होण्यासाठी या 3 सोप्या पायऱ्यांचे अनुसरण करा",
    steps: [
      {
        id: "step-1",
        number: 1,
        title: "Clear Cutoff वर मोफत सुरुवात करा",
        subtitle: "तुमचे मोफत खाते तयार करा आणि सुरुवात करा!",
        desc: "काही सेकंदात तुमच्या मोबाईल नंबरने नोंदणी करा आणि सर्व अभ्यास साहित्य व टेस्टचा तात्काळ अ‍ॅक्सेस मिळवा.",
        btn: "सुरुवात करा",
      },
      {
        id: "step-2",
        number: 2,
        title: "व्हिडिओ, नोट्स आणि मिनी टेस्टसह शिका",
        subtitle: "व्हिडिओ, नोट्स आणि मिनी टेस्टसह तयारी करा!",
        desc: "प्रत्येक विषयाचा टॉपिकनिहाय व्हिडिओ लेक्चर्स, रिव्हिजन नोट्स आणि मिनी टेस्टने पाया मजबूत करा.",
        btn: "शिकायला सुरुवात करा",
      },
      {
        id: "step-3",
        number: 3,
        title: "PYQ आधारित टेस्ट सिरीज",
        subtitle: "सेक्शनल आणि फुल लेंथ टेस्टसह सराव करा!",
        desc: "हिंदी आणि इंग्रजीत PYQ आधारित सेक्शनल आणि फुल लेंथ पेपर सोडवून तुमचा आत्मविश्वास वाढवा.",
        btn: "टेस्ट द्या",
      },
    ],
  },
};

export default async function HowItWorksSection({
  bgColor = "bg-white",
  active = true,
  data,
  locale = defaultLocale,
}: {
  data?: Exam;
  bgColor?: string;
  active?: boolean;
  locale?: Locale;
}) {
  if (!active) return null;

  const t = CONTENT[locale];
  const steps: StepItem[] = t.steps.map((s) => ({ ...s, image: STEP_IMAGES[s.id] }));

  return (
    <div className={clsx(bgColor)} style={{ background: bgColor }}>
      <Section padding="py-ym-section md:py-yd-section px-3" sectionId="how-it-works-section">
        <div className="flex flex-col gap-12">
          <HeaderBlock
            eyebrow={{ text: t.eyebrow }}
            heading={{ text: t.heading }}
            description={{ text: t.description }}
            eyebrowOptions={{ alignMobile: "center", alignDesktop: "center" }}
            headingOptions={{ alignMobile: "center", alignDesktop: "center", font: "display-medium !font-semibold" }}
            descriptionOptions={{ alignMobile: "center", alignDesktop: "center" }}
            containerClassName="mx-auto"
          />
          <div className="max-w-4xl mx-auto">
            <HowItWorkStep steps={steps} />
          </div>
        </div>
      </Section>
    </div>
  );
}
