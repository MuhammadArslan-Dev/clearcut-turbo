import Image from "next/image";
import Text from "@clearcut/ui/text";
import { Link } from "@clearcut/i18n/navigation";
import { IMAGES } from "@/constants/images";
import { Locale, defaultLocale } from "@/lib/i18n/config";

const CONTENT: Record<
  Locale,
  {
    badge: string;
    headingLine1: string;
    headingAccent: string;
    subheading: string;
    features: { title: string; description: string }[];
    rating: string;
    trust: string;
  }
> = {
  en: {
    badge: "India's Trusted Exam Preparation Platform",
    headingLine1: "Start your",
    headingAccent: "exam preparation",
    subheading:
      "Everything you need to clear CTET, HTET, UPTET and more – in one place.",
    features: [
      {
        title: "Concept videos for every chapter",
        description: "Learn with high quality, exam-focused videos.",
      },
      {
        title: "Downloadable notes in Hindi & English",
        description: "Easy to read, easy to revise, anytime.",
      },
      {
        title: "Previous year questions (PYQs)",
        description: "Practice with detailed solutions.",
      },
    ],
    rating: "4.9 rating from 10,000+ students",
    trust: "Trusted by students across India",
  },
  hi: {
    badge: "भारत का भरोसेमंद एग्ज़ाम प्रिपरेशन प्लेटफॉर्म",
    headingLine1: "अपनी",
    headingAccent: "परीक्षा की तैयारी शुरू करें",
    subheading:
      "CTET, HTET, UPTET जैसी परीक्षाएं पास करने के लिए सब कुछ यहां है।",
    features: [
      {
        title: "हर चैप्टर के लिए कॉन्सेप्ट वीडियो",
        description: "हाई क्वालिटी, एग्ज़ाम-केंद्रित वीडियो के साथ सीखें।",
      },
      {
        title: "हिंदी और अंग्रेज़ी में डाउनलोड करने योग्य नोट्स",
        description: "पढ़ने और रिवीज़न करने में आसान, कभी भी।",
      },
      {
        title: "पिछले वर्षों के प्रश्न (PYQs)",
        description: "विस्तृत समाधान के साथ अभ्यास करें।",
      },
    ],
    rating: "10,000+ छात्रों की 4.9 रेटिंग",
    trust: "पूरे भारत के छात्रों का भरोसा",
  },
};

function BadgeCheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0">
      <circle cx="12" cy="12" r="12" fill="var(--color-success)" />
      <path
        d="M7 12.5l3 3 7-7"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="#FECF49" className="shrink-0">
      <path d="M12.0026 18.26L4.9491 22.2082L6.52443 14.2799L0.589844 8.7918L8.61688 7.84006L12.0026 0.5L15.3882 7.84006L23.4152 8.7918L17.4807 14.2799L19.056 22.2082L12.0026 18.26Z" />
    </svg>
  );
}

function VideoIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="4" width="20" height="16" rx="3.5" stroke="var(--color-brand)" strokeWidth="1.8" />
      <path d="M10 8.5l6 3.5-6 3.5v-7z" fill="var(--color-brand)" />
    </svg>
  );
}

function NotesIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M6 3h8l5 5v12.5a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 016 20.5v-16A1.5 1.5 0 017.5 3H6z"
        stroke="var(--color-brand)"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M9 12.5h6M9 16h6" stroke="var(--color-brand)" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function PyqIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9.5" stroke="var(--color-brand)" strokeWidth="1.8" />
      <path
        d="M9.3 9.6a2.7 2.7 0 115 1.4c-.7.7-1.6 1.1-1.6 2.6"
        stroke="var(--color-brand)"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="12.6" cy="17" r="1.2" fill="var(--color-brand)" />
    </svg>
  );
}

const FEATURE_ICONS = [VideoIcon, NotesIcon, PyqIcon];

/**
 * Static left panel — Server Component on purpose (no "use client"), so this
 * entire half of the page (logo, copy, feature list, illustration) ships as
 * plain HTML with zero client JS. Only StartAuthForm (the actual form) is a
 * client island; splitting it out here is what keeps this page's JS payload
 * small, per the "static/fast, minimal JS" requirement.
 */
export default function StartHero({ locale = defaultLocale }: { locale?: Locale }) {
  const t = CONTENT[locale];

  return (
    <div className="relative hidden md:flex md:w-[60%] overflow-y-auto bg-[var(--color-brand)] flex-col gap-6 px-10 py-6 lg:px-14 lg:py-8 text-white">
      {/* Decorative dot grid, purely visual */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-8 right-10 grid grid-cols-6 gap-2 opacity-20"
      >
        {Array.from({ length: 24 }).map((_, i) => (
          <span key={i} className="w-1 h-1 rounded-full bg-white" />
        ))}
      </div>

      <Link href="/" className="w-fit">
        <Image
          src={IMAGES.mainLogo}
          alt="Clear Cutoff"
          width={140}
          height={40}
          priority
          className="brightness-0 invert"
        />
      </Link>

      <div className="flex-1 flex items-center gap-8">
        <div className="flex-1 flex flex-col gap-5 max-w-[420px]">
          <div className="w-fit flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5">
            <BadgeCheckIcon />
            <Text as="span" variant="body-small" weight="semibold" className="!text-white">
              {t.badge}
            </Text>
          </div>

          <div>
            <Text as="h1" variant="heading-2xlarge" weight="bold" className="!text-white leading-tight">
              {t.headingLine1}{" "}
              <span className="text-[#FECF49]">{t.headingAccent}</span>
            </Text>
            <Text as="p" variant="body-large" className="!text-white/85 mt-2">
              {t.subheading}
            </Text>
          </div>

          <ul className="flex flex-col gap-3">
            {t.features.map((feature, i) => {
              const Icon = FEATURE_ICONS[i];
              return (
                <li key={feature.title} className="flex items-start gap-3">
                  <div className="shrink-0 w-10 h-10 rounded-lg bg-white flex items-center justify-center">
                    <Icon />
                  </div>
                  <div>
                    <Text as="p" variant="body-medium" weight="semibold" className="!text-white">
                      {feature.title}
                    </Text>
                    <Text as="p" variant="body-small" className="!text-white/70">
                      {feature.description}
                    </Text>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="flex flex-col gap-1 pt-3 border-t border-white/20">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <StarIcon key={i} />
              ))}
            </div>
            <Text as="p" variant="body-medium" weight="semibold" className="!text-white">
              {t.rating}
            </Text>
            <Text as="p" variant="body-small" className="!text-white/70">
              {t.trust}
            </Text>
          </div>
        </div>

        <div className="hidden lg:block w-[360px] xl:w-[440px] shrink-0">
          <Image
            src={IMAGES.startIllustration}
            alt=""
            width={440}
            height={402}
            priority
            sizes="440px"
            className="w-full h-auto"
          />
        </div>
      </div>
    </div>
  );
}
