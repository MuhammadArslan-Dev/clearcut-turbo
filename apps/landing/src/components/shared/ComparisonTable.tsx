import React from "react";
import Text from "@clearcut/ui/text";
import MainAppLogo from "../icons/main-app-logo";
import { Locale, defaultLocale } from "@/lib/i18n/config";

const CrossIcon = () => (
  <svg className="h-5 w-5 text-red-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
    <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" />
  </svg>
);

const CheckIcon = () => (
  <svg className="h-5 w-5 text-green-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
    <path d="M5 13l4 4L19 7" strokeLinecap="round" />
  </svg>
);

export const CheckIconGreen = ({ size = 16, color = "#00A251" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="0.5" y="0.5" width="15" height="15" rx="7.5" fill={color} />
    <rect x="0.5" y="0.5" width="15" height="15" rx="7.5" stroke={color} />
    <path d="M11.3346 5.5L6.7513 10.0833L4.66797 8" stroke="white" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const WarningIcon = () => (
  <svg className="h-5 w-5 text-amber-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path
      d="M12 9v4m0 4h.01M10.29 3.86l-8.18 14A1 1 0 003 19.5h18a1 1 0 00.87-1.5l-8.18-14a1 1 0 00-1.74 0z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const B = ({ children }: { children: React.ReactNode }) => (
  <span className="text-black !font-semibold">{children}</span>
);

export type FeatureStatus = "yes" | "warning" | "no";

function statusIcon(status: FeatureStatus) {
  if (status === "warning") return <WarningIcon />;
  if (status === "no") return <CrossIcon />;
  return <CheckIcon />;
}

export type ComparisonTableRow = {
  label: React.ReactNode;
  coaching: React.ReactNode;
  app: React.ReactNode;
  /** Icon next to the label column; omit for no icon (used by the default homepage rows only). */
  labelStatus?: FeatureStatus;
  /** Defaults to "no" (cross) to match the original homepage table. */
  coachingStatus?: FeatureStatus;
  /** Defaults to "yes" (check) to match the original homepage table. */
  appStatus?: FeatureStatus;
};

type ComparisonRow = { label: React.ReactNode; coaching: string; app: React.ReactNode };

const TABLE: Record<Locale, { comparisonTitle: string; coachingTitle: string; rows: ComparisonRow[] }> = {
  en: {
    comparisonTitle: "Comparison",
    coachingTitle: "Coaching centre",
    rows: [
      { label: <B>Affordable fee</B>, coaching: "Fees ₹20,000+ (per course)", app: <><B>₹99</B> (full access)</> },
      { label: <B>All subjects included</B>, coaching: "Limited subject options", app: <><B>All subjects</B> in one place</> },
      { label: <B>Unlimited practice tests</B>, coaching: "Limited tests; mostly in class", app: <>Mini tests + <B>sectional tests</B> + PYQs</> },
      { label: <B>Refund guarantee</B>, coaching: "No refund policy", app: <><B>Full refund</B> if you don't pass after completing the course</> },
      { label: <B>Exam-ready</B>, coaching: "Mostly theory; more focus on teaching", app: <>Focus on PYQs and the <B>exam pattern</B></> },
      { label: <B>Subscription period</B>, coaching: "Only for the course duration", app: <><B>1 year</B> of full access</> },
      { label: <B>Extra charges?</B>, coaching: "Pay separately for notes and study material", app: <><B>Free notes</B> and study material!</> },
    ],
  },
  hi: {
    comparisonTitle: "तुलना",
    coachingTitle: "कोचिंग सेंटर",
    rows: [
      { label: <B>किफायती शुल्क</B>, coaching: "फीस ₹20,000+ (प्रति कोर्स)", app: <><B>₹99</B> (पूरा एक्सेस)</> },
      { label: <B>सभी विषय शामिल</B>, coaching: "सीमित विषय विकल्प", app: <><B>सभी विषय</B> एक ही जगह</> },
      { label: <B>अनलिमिटेड प्रैक्टिस टेस्ट</B>, coaching: "सीमित टेस्ट; ज्यादातर क्लास में", app: <>मिनी टेस्ट + <B>सेक्शनल टेस्ट</B> + PYQ</> },
      { label: <B> रिफंड गारंटी</B>, coaching: "कोई रिफंड नीति नहीं", app: <><B>पूरा रिफंड</B> यदि कोर्स पूरा करने के बाद भी पास न हों</> },
      { label: <B>परीक्षा के लिए तैयार</B>, coaching: "अधिकतर थ्योरी; पढ़ाने पर ज्यादा फोकस", app: <>PYQ और <B>परीक्षा पैटर्न</B> पर फोकस</> },
      { label: <B>सदस्यता अवधि</B>, coaching: "केवल कोर्स अवधि तक", app: <><B>1 साल</B> का पूरा एक्सेस</> },
      { label: <B>अतिरिक्त शुल्क?</B>, coaching: "नोट्स और स्टडी मटेरियल के लिए अलग से भुगतान", app: <><B>फ्री नोट्स</B> और स्टडी मटेरियल!</> },
    ],
  },
};

export default function ComparisonTable({
  locale = defaultLocale,
  competitorName,
  rows,
}: {
  locale?: Locale;
  /** Overrides the "Coaching centre" column title, e.g. with a CMS competitor name. */
  competitorName?: string;
  /** Overrides the default homepage rows, e.g. with a CMS-driven feature table. */
  rows?: ComparisonTableRow[];
}) {
  const defaults = TABLE[locale];
  const comparisonTitle = defaults.comparisonTitle;
  const coachingTitle = competitorName ?? defaults.coachingTitle;
  const ROWS: ComparisonTableRow[] =
    rows ?? defaults.rows.map((r, i) => ({ ...r, labelStatus: i < 3 ? "yes" : undefined }));

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[720px] mx-auto max-w-[950px] bg-[#f8fafc] rounded-2xl px-2 py-3">
        <div className="flex w-full px-0 rounded-xl">
          <Column
            title={comparisonTitle}
            justify="justify-center"
            rounded="rounded-l-xl"
            iconPosition="right"
            rows={ROWS.map((r) => ({ text: r.label, icon: r.labelStatus ? statusIcon(r.labelStatus) : undefined }))}
          />
          <Column
            title={coachingTitle}
            rows={ROWS.map((r) => ({ text: r.coaching, icon: statusIcon(r.coachingStatus ?? "no") }))}
          />
          <div className="flex-[1_1_35%] min-w-[240px] rounded-xl outline-4 outline-blue-500">
            <div className="mb-2 flex justify-center">
              <MainAppLogo width={200} height={48} />
            </div>
            <Column
              rounded="rounded-r-xl"
              rows={ROWS.map((r) => ({ text: r.app, icon: statusIcon(r.appStatus ?? "yes") }))}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Column({
  title,
  rows,
  rounded,
  justify = "justify-start",
  iconPosition = "left",
}: {
  title?: string;
  rows: { text: React.ReactNode; icon?: React.ReactNode }[];
  rounded?: string;
  justify?: string;
  iconPosition?: "left" | "right";
}) {
  const isRight = iconPosition === "right";

  return (
    <div className="flex-[1_1_35%] min-w-[180px]">
      {title && (
        <Text as="h2" variant="heading-large" weight="semibold" className="text-center mb-4 h-[42px] flex items-end justify-center">
          {title}
        </Text>
      )}
      <div className={`bg-white py-2 ${rounded}`}>
        {rows.map((row, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 min-h-15 px-2 lg:px-6 ${justify} ${isRight ? "flex-row-reverse" : ""} ${i !== 0 ? "border-t border-gray-200" : ""}`}
          >
            {row.icon && <span className="shrink-0">{row.icon}</span>}
            <Text as="p" variant="heading-small">{row.text}</Text>
          </div>
        ))}
      </div>
    </div>
  );
}
