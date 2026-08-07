import { Section, sectionRegistry } from "@/lib/sections/registry";
import { Exam } from "@/types/page";
import LazySection from "./LazySection";
import { Locale, defaultLocale } from "@/lib/i18n/config";

type Props = {
  sections: Section[];
  data?: Exam;
  locale?: Locale;
  // Section types that should render immediately (above the fold)
  eagerTypes?: string[];
};

// Default above-fold section types — render immediately, no lazy wrapper
const DEFAULT_EAGER: string[] = ["homeHero", "courseHero", "courseLogoCarousal"];

export default function SectionRenderer({
  sections,
  data,
  locale = defaultLocale,
  eagerTypes = DEFAULT_EAGER,
}: Props) {
  if (!sections?.length) return null;

  return (
    <main>
      {sections.map((section) => {
        const Component = sectionRegistry[section.type];
        if (!Component) return null;

        const isEager = eagerTypes.includes(section.type);

        const element = (
          <Component
            key={section.id ?? section.type}
            data={data}
            locale={locale}
            {...section}
          />
        );

        if (isEager) return element;

        return (
          <LazySection key={section.id ?? section.type} fallbackHeight="400px">
            {element}
          </LazySection>
        );
      })}
    </main>
  );
}
