import Text from "@clearcut/ui/text";
import FAQAccordion, { AccordionItem } from "./FAQAccordion";
import { getDict, Locale } from "@/lib/dictionary";

function UploadStepIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-brand">
      <path
        d="M12 15V3m0 0L7 8m5-5l5 5M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DetailsStepIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-brand">
      <path d="M15 4l5 5-9.5 9.5H5.5V14L15 4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M3 20h5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function DownloadStepIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-brand">
      <path
        d="M12 3v12m0 0l-5-5m5 5l5-5M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const STEP_ICONS = [UploadStepIcon, DetailsStepIcon, DownloadStepIcon];

function TextIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M5 6h14M5 12h14M5 18h9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="3.5" y="5" width="17" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3.5 9.5h17M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function ShieldCheckIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function MobileIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="6" y="2.5" width="12" height="19" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M11 18.5h2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function FreeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M9.5 9.2c0-1.2 1-2.1 2.5-2.1s2.5.9 2.5 2c0 2-2.5 1.7-2.5 3.7M12 16.5v.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

const FEATURE_ICONS = [TextIcon, CalendarIcon, ShieldCheckIcon, EyeIcon, MobileIcon, FreeIcon];

/**
 * "How it works" / feature-highlight / FAQ sections specific to the Add
 * Name & Date page — not the generic hub copy, since this page's flow
 * (upload → type name/date → download, no crop step by default) reads
 * differently. Content paraphrased from the reference site's equivalent
 * page in our own wording, not copied, same reasoning as
 * officialRequirements.ts.
 */
export default function AddNameDateExtras({ locale = "en" }: { locale?: Locale }) {
  const t = getDict(locale).addNameDatePage;
  const faqItems: AccordionItem[] = t.faqs.map((faq, i) => ({
    id: `and-faq-${i}`,
    title: faq.q,
    content: faq.a,
  }));

  return (
    <>
      <div className="max-w-[880px] mx-auto text-center flex flex-col items-center gap-3 mt-16 md:mt-20">
        <h2 className="heading-large !font-bold text-text-gray-normal">{t.howItWorksTitle}</h2>
        <p className="body-medium text-text-gray-muted mb-6">{t.howItWorksLead}</p>
        <div className="grid md:grid-cols-3 gap-8 w-full">
          {t.steps.map(({ title, description }, i) => {
            const Icon = STEP_ICONS[i];
            return (
              <div key={title} className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-brand/8 flex items-center justify-center">
                  <Icon />
                </div>
                <Text as="p" variant="body-large" weight="semibold" color="gray-normal">
                  {title}
                </Text>
                <Text as="p" variant="body-small" color="gray-muted">
                  {description}
                </Text>
              </div>
            );
          })}
        </div>
      </div>

      <div className="max-w-[1080px] mx-auto text-center flex flex-col items-center gap-3 mt-16 md:mt-20 px-2">
        <h2 className="heading-large !font-bold text-text-gray-normal">{t.featuresTitle}</h2>
        <p className="body-medium text-text-gray-muted mb-6 max-w-[620px]">{t.featuresLead}</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 w-full">
          {t.features.map(({ title, description }, i) => {
            const Icon = FEATURE_ICONS[i];
            return (
              <div
                key={title}
                className="flex flex-col items-center gap-2 rounded-xl border border-[var(--color-border-gray-subtle)] bg-white p-4 text-center"
              >
                <div className="w-10 h-10 rounded-lg bg-brand/8 text-brand flex items-center justify-center">
                  <Icon />
                </div>
                <Text as="p" variant="body-medium" weight="semibold" color="gray-normal">
                  {title}
                </Text>
                <Text as="p" variant="body-small" color="gray-muted">
                  {description}
                </Text>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-16 md:mt-20 max-w-[720px] mx-auto px-2">
        <h2 className="heading-large !font-bold text-text-gray-normal text-center mb-6">{t.faqTitle}</h2>
        <FAQAccordion items={faqItems} defaultOpenId={faqItems[0]?.id} />
      </div>
    </>
  );
}
